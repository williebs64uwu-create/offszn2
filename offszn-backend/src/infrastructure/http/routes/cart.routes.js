import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
    addItemToCart,
    getCart,
    removeItemFromCart
} from '../controllers/cartController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getCart);
router.post('/add', addItemToCart);
router.delete('/:id', removeItemFromCart);

export default router;
