import express from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import postRoutes from './postRoutes';
import commentRoutes from './commentRoutes';
import likeRoutes from './likeRoutes';
import aiRoutes from './aiRoutes';
import searchRoutes from './searchRoutes';
import chatRoutes from './chatRoutes';
import messageRoutes from './messageRoutes';

const router = express.Router();

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);
router.use('/likes', likeRoutes);
router.use('/ai', aiRoutes);
router.use('/search', searchRoutes);
router.use('/chats', chatRoutes);
router.use('/messages', messageRoutes);

export default router; 