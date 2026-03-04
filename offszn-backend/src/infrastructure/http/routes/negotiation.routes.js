import { Router } from 'express';
import { createNegotiation, getNegotiations, getNegotiationById, updateNegotiationStatus } from '../controllers/NegotiationController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', optionalAuthMiddleware, createNegotiation);
router.get('/', authMiddleware, getNegotiations);
router.get('/:id', authMiddleware, getNegotiationById);
router.put('/:id', authMiddleware, updateNegotiationStatus);

export default router;
