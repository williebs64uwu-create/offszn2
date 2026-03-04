import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
    getConversations,
    getMessages,
    sendMessage,
    startConversation,
    createGroup,
    toggleReaction,
    getMessageById
} from '../controllers/ChatController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/conversations', getConversations);
router.get('/conversations/:conversationId/messages', getMessages);
router.get('/messages/:messageId', getMessageById);
router.post('/messages', sendMessage);
router.post('/start', startConversation);
router.post('/groups', createGroup);
router.post('/reactions', toggleReaction);

export default router;
