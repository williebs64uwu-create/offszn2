import { supabase } from '../../database/connection.js';

export const getUserByNickname = async (req, res) => {
    try {
        const { nickname } = req.params;
        const { data, error } = await supabase
            .from('users')
            .select(`
                id, nickname, first_name, last_name, avatar_url, banner_url, is_verified, role, bio, socials, socials_order
            `)
            .eq('nickname', nickname)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        let isFollowing = false;
        if (req.user?.userId) {
            const { data: follow } = await supabase
                .from('followers')
                .select('id')
                .match({ user_id: data.id, follower_id: req.user.userId })
                .maybeSingle();
            isFollowing = !!follow;
        }

        res.status(200).json({ ...data, is_following: isFollowing });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Merged Profile Logic
export const getUserProfile = async (req, res) => {
    try {
        const { nickname } = req.params;
        const { data, error } = await supabase
            .from('users')
            .select(`
                id, nickname, first_name, last_name, avatar_url, banner_url, is_verified, role, bio, socials, socials_order,
                followers:followers!user_id(count),
                following:followers!follower_id(count),
                products:products!producer_id(count)
            `)
            .ilike('nickname', nickname)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Flatten counts
        const user = {
            ...data,
            followers_count: data.followers?.[0]?.count || 0,
            following_count: data.following?.[0]?.count || 0,
            products_count: data.products?.[0]?.count || 0
        };
        delete user.followers;
        delete user.following;
        delete user.products;

        let isFollowing = false;
        if (req.user?.userId) {
            const { data: follow } = await supabase
                .from('followers')
                .select('id')
                .match({ user_id: user.id, follower_id: req.user.userId })
                .maybeSingle();
            isFollowing = !!follow;
        }

        res.status(200).json({ ...user, is_following: isFollowing });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateMyProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { first_name, last_name, bio, socials, socials_order } = req.body;

        const { data, error } = await supabase
            .from('users')
            .update({ first_name, last_name, bio, socials, socials_order })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({ message: 'Perfil actualizado', profile: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { nickname, first_name, last_name, bio, socials, socials_order } = req.body;

        const { data, error } = await supabase
            .from('users')
            .update({ nickname, first_name, last_name, bio, socials, socials_order })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ============================================
// ONBOARDING: Check Nickname Availability
// ============================================
export const checkNickname = async (req, res) => {
    try {
        const { nickname } = req.body;

        if (!nickname || nickname.trim().length === 0) {
            return res.status(400).json({ error: 'Nickname is required' });
        }

        // Sanitize: lowercase, alphanumeric + ._-
        const sanitized = nickname.toLowerCase().replace(/[^a-z0-9._-]/g, '');

        // Min/Max length
        if (sanitized.length < 3) {
            return res.json({ available: false, reason: 'too_short' });
        }
        if (sanitized.length > 30) {
            return res.json({ available: false, reason: 'too_long' });
        }

        // Reserved usernames
        const reserved = [
            'admin', 'offszn', 'support', 'help', 'api', 'www', 'root',
            'system', 'moderator', 'mod', 'staff', 'official'
        ];
        if (reserved.includes(sanitized) || reserved.some(r => sanitized.startsWith(r + '.'))) {
            return res.json({ available: false, reason: 'reserved' });
        }

        // Check database
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .ilike('nickname', sanitized)
            .maybeSingle();

        if (error) throw error;

        if (data) {
            // Generate suggestions
            const suggestions = [
                `${sanitized}${Math.floor(Math.random() * 999) + 1}`,
                `${sanitized}_beats`,
                `${sanitized}.prod`,
                `${sanitized}_music`
            ];
            return res.json({ available: false, reason: 'taken', suggestions });
        }

        return res.json({ available: true, sanitized });
    } catch (err) {
        console.error('Error checking nickname:', err);
        res.status(500).json({ error: 'Failed to check nickname availability' });
    }
};

// ============================================
// ONBOARDING: Complete Profile
// ============================================
export const completeProfile = async (req, res) => {
    try {
        const userId = req.user.userId; // Changed from req.user.id
        const { nickname, firstName, lastName, role, socialLinks, avatarUrl } = req.body;

        // Validate required fields
        if (!nickname || !firstName || !lastName || !role) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Sanitize nickname
        const sanitized = nickname.toLowerCase().replace(/[^a-z0-9._-]/g, '');

        // Double-check nickname availability (prevent race conditions)
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .ilike('nickname', sanitized)
            .neq('id', userId)
            .maybeSingle();

        if (existing) {
            return res.status(400).json({ error: 'Nickname already taken' });
        }

        // Update profile
        const { data, error } = await supabase
            .from('users')
            .update({
                nickname: sanitized,
                first_name: firstName,
                last_name: lastName,
                role,
                socials: socialLinks || {},
                avatar_url: avatarUrl || null,
                onboarding_completed: true
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, user: data });
    } catch (err) {
        console.error('Error completing profile:', err);
        res.status(500).json({ error: 'Failed to complete profile' });
    }
};
