import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
    getMyFavorites,
    toggleProductLike
} from '../controllers/FavoritesController.js';
import {
    followUser,
    unfollowUser,
    getMyFollowing,
    checkFollowStatus
} from '../controllers/FollowController.js';

const router = express.Router();

router.use(authMiddleware);

// Favorites
router.get('/favorites', getMyFavorites);
router.post('/favorites/:id/toggle', toggleProductLike);

// Following
router.get('/following', getMyFollowing);
router.get('/following/:id/status', checkFollowStatus);
router.post('/following/:id', followUser);
router.delete('/following/:id', unfollowUser);

export default router;
