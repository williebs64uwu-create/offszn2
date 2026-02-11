import { supabase } from '../../database/connection.js';

export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No se proporcionó token de acceso' });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Token inválido o expirado' });
        }

        // Onboarding Gate: Check if user has a profile record
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('nickname, role, is_onboarded')
            .eq('id', user.id)
            .maybeSingle();

        req.user = {
            userId: user.id,
            email: user.email,
            nickname: profile?.nickname,
            role: profile?.role,
            isOnboarded: !!profile
        };

        // Strict Gate: If profile doesn't exist, we might want to flag it
        // However, we'll let the controller decide or provide a specific header/flag
        if (!profile && !req.path.includes('/auth/onboarding')) {
            // Optional: Header-based signaling for frontend
            res.set('X-Onboarding-Required', 'true');
        }

        next();
    } catch (error) {
        console.error('[AuthMiddleware] Error:', error);
        return res.status(500).json({ error: 'Error interno de autenticación' });
    }
};
