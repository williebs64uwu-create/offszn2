import express from 'express';
import {
    registerUser,
    loginUser,
    checkNicknameAvailability
} from '../controllers/AuthController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/check-nickname', checkNicknameAvailability);

export default router;
