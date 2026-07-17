import { Router } from 'express';
import {
  sendMessage, getConversation, getConversations, markMessageAsRead,
  markConversationAsRead, deleteMessage, getUnreadCount, searchMessages, toggleBlockUser,
} from '../controllers/messageController.js';
import { protect, requireKYC } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.post('/', requireKYC, sendMessage);
router.get('/conversations', getConversations);
router.get('/unread/count', getUnreadCount);
router.get('/conversation/:receiverId', requireKYC, getConversation);
router.get('/search', searchMessages);
router.patch('/:messageId/read', markMessageAsRead);
router.patch('/conversation/:receiverId/read-all', markConversationAsRead);
router.delete('/:messageId', deleteMessage);
router.post('/:userId/block', toggleBlockUser);

export default router;
