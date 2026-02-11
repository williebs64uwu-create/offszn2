import express from 'express';
import { optionalAuthMiddleware } from '../middlewares/optional-auth.middleware.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
    createPayPalOrder,
    capturePayPalOrder,
    getSecureDownloadUrl,
    linkGuestOrder
} from '../controllers/PayPalController.js';

const router = express.Router();

router.post('/orders/paypal/create', optionalAuthMiddleware, createPayPalOrder);
router.post('/orders/paypal/capture', optionalAuthMiddleware, capturePayPalOrder);
router.post('/orders/paypal/link', authMiddleware, linkGuestOrder);
router.get('/orders/download-link', optionalAuthMiddleware, getSecureDownloadUrl);

export default router;
