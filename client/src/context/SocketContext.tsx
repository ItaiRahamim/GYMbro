import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

// Types
interface OnlineUser {
  userId: string;
  socketId: string;
}

interface TypingInfo {
  chatId: string;
  userId: string;
}

export interface SocketContextType {
  socket: any | null;
  onlineUsers: Map<string, string>;
  isConnected: boolean;
  usersTyping: TypingInfo[];
}

// Initial context values
const defaultSocketContext: SocketContextType = {
  socket: null,
  onlineUsers: new Map<string, string>(),
  isConnected: false,
  usersTyping: [],
};

// Create context
const SocketContext = createContext<SocketContextType>(defaultSocketContext);

// Context provider props
interface SocketProviderProps {
  children: ReactNode;
}

// Provider component
export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<any | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, string>>(new Map());
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [usersTyping, setUsersTyping] = useState<TypingInfo[]>([]);
  const { authState } = useAuth();
  const token = localStorage.getItem('accessToken');
  const user = authState.user;

  useEffect(() => {
    if (token && user?._id) {
      // Connect to socket server with auth token
      console.log('Connecting to socket server...');
      
      // Use standard environment variable
      const socketServerUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      const newSocket = io(socketServerUrl, {
        auth: { token },
        // Cast to any to bypass TS error for withCredentials
        ...(({
          withCredentials: true,
        } as any))
      });

      // Connection events
      newSocket.on('connect', () => {
        console.log('Socket connected: ', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', (reason: string) => {
        console.log('Socket disconnected: ', reason);
        setIsConnected(false);
        setOnlineUsers(new Map());
      });

      newSocket.on('connect_error', (error: Error) => {
        console.error('Socket connection error: ', error.message);
        setTimeout(() => {
          newSocket.connect();
        }, 5000); // Try to reconnect after 5 seconds
      });

      // User status events
      newSocket.on('users:online', (users: OnlineUser[]) => {
        console.log('Online users updated: ', users);
        const newOnlineUsers = new Map<string, string>();
        users.forEach((user) => {
          newOnlineUsers.set(user.userId, user.socketId);
        });
        setOnlineUsers(newOnlineUsers);
      });

      newSocket.on('user:connected', (userData: OnlineUser) => {
        console.log('User connected: ', userData);
        setOnlineUsers((prev) => {
          const newMap = new Map(prev);
          newMap.set(userData.userId, userData.socketId);
          return newMap;
        });
      });

      newSocket.on('user:disconnected', (userId: string) => {
        console.log('User disconnected: ', userId);
        setOnlineUsers((prev) => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
      });

      // Typing events
      newSocket.on('typing:start', ({ chatId, userId }: TypingInfo) => {
        console.log(`User ${userId} is typing in chat ${chatId}`);
        setUsersTyping((prev) => {
          // Check if this user is already typing in this chat
          const exists = prev.some(
            (info) => info.chatId === chatId && info.userId === userId
          );
          if (exists) return prev;
          return [...prev, { chatId, userId }];
        });
      });

      newSocket.on('typing:stop', ({ chatId, userId }: TypingInfo) => {
        console.log(`User ${userId} stopped typing in chat ${chatId}`);
        setUsersTyping((prev) =>
          prev.filter(
            (info) => !(info.chatId === chatId && info.userId === userId)
          )
        );
      });

      // Set socket
      setSocket(newSocket);

      // Clean up on unmount
      return () => {
        console.log('Disconnecting socket...');
        newSocket.disconnect();
      };
    } else {
      // If not authenticated, disconnect any existing socket
      if (socket) {
        console.log('Not authenticated, disconnecting socket...');
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers(new Map());
      }
    }
  }, [token, user?._id, socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        isConnected,
        usersTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use the context
export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}; 