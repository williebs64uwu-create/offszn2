import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { getMyNotifications, markAsRead, markAllAsRead, createNotificationEndpoint, collabInviteNotification } from '../controllers/NotificationController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getMyNotifications);
router.post('/', createNotificationEndpoint);
router.post('/collab-invite', collabInviteNotification);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

export default router;
