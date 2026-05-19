import express from 'express';
import {
  sendMessage,
  getConversation,
  getConversations,
  markMessageAsRead,
  markConversationAsRead,
  deleteMessage,
  getUnreadCount,
  searchMessages,
  toggleBlockUser,
} from '../controllers/messageController.js';
import { protect, authorize, requireKYC } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * MESSAGING ROUTES
 *
 * KYC Policy:
 * - Only KYC-verified users can send messages and view individual conversations
 * - Read-only routes (list conversations, unread count, search) are available to all authenticated users
 * - This ensures non-KYC users can still receive admin replies via Contact page notifications
 */

// Send message (requires KYC verification)
router.post('/', requireKYC, sendMessage);

// Get all conversations for current user
router.get('/conversations', getConversations);

// Get unread count
router.get('/unread/count', getUnreadCount);

// Get conversation with specific user (requires KYC verification)
router.get('/conversation/:receiverId', requireKYC, getConversation);

// Search messages in conversation
router.get('/search', searchMessages);

// Mark message as read
router.patch('/:messageId/read', markMessageAsRead);

// Mark entire conversation as read
router.patch('/conversation/:receiverId/read-all', markConversationAsRead);

// Delete message (soft delete)
router.delete('/:messageId', deleteMessage);

// Block/Unblock user
router.post('/:userId/block', toggleBlockUser);

export default router;
