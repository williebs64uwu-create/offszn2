import { Router } from 'express';
import { authenticateTokenMiddleware } from '../middlewares/authenticateTokenMiddleware.js';
import {
    createMercadoPagoPreference,
    handleMercadoPagoWebhook,
    createFreeOrder,
    checkPaymentStatus,
    forceCheckPayment
} from '../controllers/OrderController.js';

const router = Router();

// Webhook is public (sent by Mercado Pago)
router.post('/orders/mercadopago-webhook', handleMercadoPagoWebhook);

// Protected routes
router.use(authenticateTokenMiddleware);
router.post('/orders/create-mercadopago-preference', createMercadoPagoPreference);
router.post('/orders/free', createFreeOrder);
router.get('/orders/status/latest', checkPaymentStatus);

// Debug endpoint (Unprotected or restricted to admin in production)
router.get('/orders/debug/force/:paymentId', forceCheckPayment);

export default router;
