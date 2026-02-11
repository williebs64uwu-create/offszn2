import { Router } from 'express';
import { getAllProducts, incrementPlayCount } from '../controllers/ProductController.js';
import { getUserByNickname, getUserProfile } from '../controllers/UserController.js';
import { getLeaderboard } from '../controllers/LeaderboardController.js';

const router = Router();

router.get('/products', getAllProducts);
router.post('/products/:id/play', incrementPlayCount);

// User/Profile routes
router.get('/users/:nickname', getUserProfile);
router.get('/users/:nickname/raw', getUserByNickname);
router.get('/users/:nickname/products', getAllProducts);

// Search & Discovery
router.get('/leaderboard', getLeaderboard);

export default router;
