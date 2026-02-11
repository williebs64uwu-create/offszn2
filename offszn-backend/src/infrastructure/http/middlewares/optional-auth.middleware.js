import { verifyToken } from '../../../shared/utils/jwt.js';

export const optionalAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next();
    }

    try {
        const decoded = await verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        // Just proceed as guest if token is invalid
        next();
    }
};
