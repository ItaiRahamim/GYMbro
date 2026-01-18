import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import jwt from 'jsonwebtoken';
import Message from '../models/Message';
import Chat from '../models/Chat';
import User from '../models/User';
import mongoose from 'mongoose';

// Socket event types
export interface ChatMessage {
  content: string;
  sender: string;
  recipient: string;
  chatId?: string;
}

// Connected users cache
const connectedUsers: Map<string, string> = new Map(); // userId -> socketId

// Initialize Socket.IO
export const initializeSocketIO = (server: HttpServer | HttpsServer) => {
  console.log('[Socket.io] Initializing socket.io server');
  
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'https://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000
  });
  
  // Middleware to authenticate users
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      console.log('[Socket.io] Auth attempt with token:', token ? 'valid token (masked)' : 'missing token');
      
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'access-token-secret-for-testing') as jwt.JwtPayload;
      
      if (!decoded || !decoded.id) {
        console.log('[Socket.io] Invalid token payload:', decoded);
        return next(new Error('Invalid token'));
      }
      
      // Attach user data to socket
      socket.data.userId = decoded.id;
      console.log(`[Socket.io] User authenticated: ${decoded.id}`);
      
      next();
    } catch (error) {
      console.error('[Socket.io] Authentication error:', error);
      next(new Error('Authentication error'));
    }
  });
  
  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    
    console.log(`[Socket.io] User connected: ${userId}, socket ID: ${socket.id}`);
    
    // Register the connection
    if (userId) {
      connectedUsers.set(userId, socket.id);
      console.log(`[Socket.io] Current connected users: ${connectedUsers.size}`, Array.from(connectedUsers.keys()));
      
      // Emit online status to other users
      socket.broadcast.emit('user:status', { userId, status: 'online' });
    }
    
    // Handle join chat room
    socket.on('chat:join', (chatId) => {
      console.log(`[Socket.io] User ${userId} joined chat ${chatId}`);
      socket.join(`chat:${chatId}`);
      
      // Notify other users in the chat that this user has joined
      socket.to(`chat:${chatId}`).emit('user:joined', { userId, chatId });
    });
    
    // Handle leave chat room
    socket.on('chat:leave', (chatId) => {
      console.log(`[Socket.io] User ${userId} left chat ${chatId}`);
      socket.leave(`chat:${chatId}`);
      
      // Notify other users in the chat that this user has left
      socket.to(`chat:${chatId}`).emit('user:left', { userId, chatId });
    });
    
    // Handle new message
    socket.on('chat:message', async (data: ChatMessage) => {
      try {
        const { content, recipient, chatId } = data;
        const sender = userId;
        
        console.log(`[Socket.io] Received message: sender=${sender}, recipient=${recipient}, content="${content}", chatId=${chatId}`);
        
        if (!content || !recipient || !sender) {
          console.error('[Socket.io] Invalid message data:', { content, recipient, sender });
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }
        
        // Validate users exist
        const [senderExists, recipientExists] = await Promise.all([
          User.exists({ _id: sender }),
          User.exists({ _id: recipient })
        ]);
        
        if (!senderExists || !recipientExists) {
          console.error('[Socket.io] Invalid sender or recipient:', { senderExists, recipientExists });
          socket.emit('error', { message: 'Invalid sender or recipient' });
          return;
        }
        
        console.log('[Socket.io] Finding or creating chat for participants:', [sender, recipient]);
        
        // Find or create chat
        const participants = [
          new mongoose.Types.ObjectId(sender),
          new mongoose.Types.ObjectId(recipient)
        ].sort((a, b) => a.toString().localeCompare(b.toString()));
        
        let chat;
        
        // If chatId was provided, verify it's a valid chat
        if (chatId) {
          chat = await Chat.findOne({
            _id: chatId,
            participants: { $all: participants }
          });
          
          if (chat) {
            console.log('[Socket.io] Using existing chat with ID:', chat._id);
          } else {
            console.log('[Socket.io] Chat ID provided but not found or invalid:', chatId);
          }
        }
        
        // If no valid chat found, find or create one
        if (!chat) {
          chat = await Chat.findOne({
            participants: { $all: participants },
            $expr: { $eq: [{ $size: '$participants' }, 2] }
          });
          
          if (!chat) {
            console.log('[Socket.io] Chat not found, creating new chat');
            chat = await Chat.create({ participants });
            console.log('[Socket.io] New chat created with ID:', chat._id);
          } else {
            console.log('[Socket.io] Existing chat found with ID:', chat._id);
          }
        }
        
        // Automatically join the sender to this chat room if not already joined
        const rooms = Array.from(socket.rooms);
        const chatRoomId = `chat:${chat._id}`;
        if (!rooms.includes(chatRoomId)) {
          console.log(`[Socket.io] Automatically joining user ${userId} to chat room ${chatRoomId}`);
          socket.join(chatRoomId);
        }
        
        // Save message to database
        console.log('[Socket.io] Creating new message in database');
        const message = await Message.create({
          content,
          sender,
          recipient,
          chat: chat._id,
          read: false
        });
        console.log('[Socket.io] Message created with ID:', message._id);
        
        // Populate sender info
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username profilePicture')
          .lean();
        
        // Update chat's last message
        console.log('[Socket.io] Updating chat with last message');
        await Chat.updateOne(
          { _id: chat._id },
          { 
            lastMessage: message._id,
            $set: { updatedAt: new Date() }
          }
        );
        
        // Emit message to both users
        console.log(`[Socket.io] Emitting message to chat room: ${chatRoomId}`);
        io.to(chatRoomId).emit('chat:message', {
          ...populatedMessage,
          chat: chat._id
        });
        
        // Also send to the specific recipient's socket if they're online but not in the chat room
        const recipientSocketId = connectedUsers.get(recipient.toString());
        if (recipientSocketId && !io.sockets.adapter.rooms.get(chatRoomId)?.has(recipientSocketId)) {
          console.log(`[Socket.io] Sending direct notification to recipient: ${recipient}`);
          io.to(recipientSocketId).emit('chat:notification', {
            message: populatedMessage,
            chat: chat._id
          });
        }
      } catch (error) {
        console.error('[Socket.io] Error handling message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Handle typing indicator
    socket.on('typing:start', (data: { chatId: string, recipient: string }) => {
      const { chatId, recipient } = data;
      console.log(`[Socket.io] User ${userId} started typing in chat ${chatId}`);
      
      // Emit typing event to chat room
      socket.to(`chat:${chatId}`).emit('typing:start', {
        chatId,
        userId
      });
      
      // Also send to specific recipient if they're not in the chat room
      const recipientSocketId = connectedUsers.get(recipient);
      if (recipientSocketId) {
        const recipientSocket = io.sockets.sockets.get(recipientSocketId);
        if (recipientSocket && !recipientSocket.rooms.has(`chat:${chatId}`)) {
          console.log(`[Socket.io] Sending typing notification directly to recipient ${recipient}`);
          io.to(recipientSocketId).emit('typing:start', {
            chatId,
            userId
          });
        }
      }
    });
    
    // Handle typing stopped
    socket.on('typing:stop', (data: { chatId: string, recipient: string }) => {
      const { chatId, recipient } = data;
      console.log(`[Socket.io] User ${userId} stopped typing in chat ${chatId}`);
      
      // Emit typing stopped event to chat room
      socket.to(`chat:${chatId}`).emit('typing:stop', {
        chatId,
        userId
      });
      
      // Also send to specific recipient if they're not in the chat room
      const recipientSocketId = connectedUsers.get(recipient);
      if (recipientSocketId) {
        const recipientSocket = io.sockets.sockets.get(recipientSocketId);
        if (recipientSocket && !recipientSocket.rooms.has(`chat:${chatId}`)) {
          console.log(`[Socket.io] Sending typing stopped notification directly to recipient ${recipient}`);
          io.to(recipientSocketId).emit('typing:stop', {
            chatId,
            userId
          });
        }
      }
    });
    
    // Handle read receipts
    socket.on('message:read', async (data: { chatId: string, messageIds: string[] }) => {
      try {
        const { chatId, messageIds } = data;
        console.log(`[Socket.io] User ${userId} marking messages as read in chat ${chatId}:`, messageIds);
        
        if (!messageIds || !messageIds.length) {
          console.error('[Socket.io] No message IDs provided for read receipt');
          return;
        }
        
        // Update messages in database
        const result = await Message.updateMany(
          { 
            _id: { $in: messageIds },
            recipient: userId,
            read: false
          },
          { 
            $set: { 
              read: true,
              readAt: new Date()
            }
          }
        );
        
        console.log(`[Socket.io] Marked ${result.modifiedCount} messages as read`);
        
        // Find the sender of these messages to notify them
        const messages = await Message.find({ _id: { $in: messageIds } })
          .select('sender')
          .lean();
        
        // Get unique sender IDs
        const senderIds = [...new Set(messages.map(m => m.sender.toString()))];
        
        // Emit read receipt to chat room
        socket.to(`chat:${chatId}`).emit('message:read', {
          chatId,
          messageIds,
          reader: userId
        });
        
        // Also send directly to senders if they're online but not in the chat room
        for (const senderId of senderIds) {
          const senderSocketId = connectedUsers.get(senderId);
          if (senderSocketId) {
            const socket = io.sockets.sockets.get(senderSocketId);
            if (socket && !socket.rooms.has(`chat:${chatId}`)) {
              console.log(`[Socket.io] Sending read receipt directly to sender ${senderId}`);
              io.to(senderSocketId).emit('message:read', {
                chatId,
                messageIds: messageIds.filter(id => 
                  messages.find(m => m._id.toString() === id)?.sender.toString() === senderId
                ),
                reader: userId
              });
            }
          }
        }
      } catch (error) {
        console.error('[Socket.io] Error marking messages as read:', error);
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`[Socket.io] User disconnected: ${userId}`);
      
      if (userId) {
        connectedUsers.delete(userId);
        
        // Emit offline status to other users
        socket.broadcast.emit('user:status', { userId, status: 'offline' });
      }
    });
  });
  
  return io;
}; 