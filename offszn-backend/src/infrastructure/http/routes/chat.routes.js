import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
    getConversations,
    getMessages,
    sendMessage,
    startConversation
} from '../controllers/ChatController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/conversations', getConversations);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/messages', sendMessage);
router.post('/start', startConversation);

export default router;
