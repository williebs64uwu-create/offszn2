import { Router } from 'express';
import { getAllProducts, getProductById, incrementPlayCount } from '../controllers/ProductController.js';
import { getUserByNickname, getUserProfile, checkNickname, completeProfile } from '../controllers/UserController.js';
import { getLeaderboard } from '../controllers/LeaderboardController.js';
import { getAllProducers } from '../controllers/ProducerController.js';
import { createCustomRequest, getPublicRequests, claimRequest } from '../controllers/CustomRequestController.js';
import { optionalAuthMiddleware, authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/products', optionalAuthMiddleware, getAllProducts);
router.get('/products/:id', optionalAuthMiddleware, getProductById);
router.post('/products/:id/play', incrementPlayCount);

// User/Profile routes
router.get('/users/:nickname', optionalAuthMiddleware, getUserProfile);
router.get('/users/:nickname/raw', optionalAuthMiddleware, getUserByNickname);
router.get('/users/:nickname/products', getAllProducts);

// Onboarding
router.post('/users/check-nickname', checkNickname);

// Search & Discovery
router.get('/leaderboard', getLeaderboard);

// Creators (Producers)
router.get('/producers', getAllProducers);

// Custom Requests
router.get('/custom-requests/public', getPublicRequests);
router.post('/custom-requests', authMiddleware, createCustomRequest);
router.post('/custom-requests/:id/claim', authMiddleware, claimRequest);

export default router;
