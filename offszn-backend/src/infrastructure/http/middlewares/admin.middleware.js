export const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Access denied: Not authenticated' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado: Se requieren permisos de administrador' });
    }

    next();
};
