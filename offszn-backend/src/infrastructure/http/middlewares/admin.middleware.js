export const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Access denied: Not authenticated' });
    }

    if (req.user.isAdmin !== true) {
        return res.status(403).json({ error: 'Access denied: Insufficient permissions (Admin only)' });
    }

    next();
};
