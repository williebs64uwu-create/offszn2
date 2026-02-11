import { supabase } from '../../database/connection.js';

/**
 * Middleware to authenticate requests using Supabase JWT tokens.
 */
export const authenticateTokenMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        req.user = {
            userId: user.id,
            email: user.email
        };

        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err);
        res.status(403).json({ error: 'Authentication failed' });
    }
};
