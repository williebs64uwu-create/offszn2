import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';
import {
    getAllAdminProducts,
    getAllAdminOrders,
    getAllAdminUsers,
    createAdminProduct,
    updateAdminProduct,
    deleteAdminProduct
} from '../controllers/AdminController.js';

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/products', getAllAdminProducts);
router.get('/orders', getAllAdminOrders);
router.get('/users', getAllAdminUsers);
router.post('/products', createAdminProduct);
router.put('/products/:id', updateAdminProduct);
router.delete('/products/:id', deleteAdminProduct);

export default router;
