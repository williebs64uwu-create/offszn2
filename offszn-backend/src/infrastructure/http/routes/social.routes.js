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

import {
    getMyCollaborations,
    updateCollaborations,
    respondToInvitation
} from '../controllers/CollabController.js';

const router = express.Router();

router.use(authMiddleware);

// Social / Following
router.get('/following', getMyFollowing);
router.get('/following/:id/status', checkFollowStatus);
router.post('/following/:id', followUser);
router.delete('/following/:id', unfollowUser);

// Favorites
router.get('/favorites', getMyFavorites);
router.post('/favorites/:id/toggle', toggleProductLike);

// Collaborations
router.get('/collaborations', getMyCollaborations);
router.post('/collaborations/update', updateCollaborations);
router.put('/collaborations/:id/respond', respondToInvitation);

export default router;
