import { supabase } from '../../database/connection.js';

export const followUser = async (req, res) => {
    try {
        const { id: targetId } = req.params;
        const followerId = req.user.userId;

        if (targetId === followerId) {
            return res.status(400).json({ error: "No te puedes seguir a ti mismo" });
        }

        const { error } = await supabase
            .from('followers')
            .insert({
                user_id: targetId,
                follower_id: followerId
            });

        if (error) {
            if (error.code === '23505') return res.status(200).json({ message: 'Ya sigues a este usuario' });
            throw error;
        }

        // Notification
        try {
            const { data: followerData } = await supabase
                .from('users')
                .select('nickname')
                .eq('id', followerId)
                .single();

            const followerName = followerData?.nickname || 'Alguien';
            await supabase.from('notifications').insert({
                user_id: targetId,
                type: 'new_follower',
                title: '¡Nuevo Seguidor!',
                message: `<strong>${followerName}</strong> te empezó a seguir.`,
                read: false
            });
        } catch (e) {
            console.warn("Follow: Notification failed", e.message);
        }

        const { count } = await supabase
            .from('followers')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', targetId);

        res.status(200).json({ message: 'Seguido correctamente', followersCount: count });
    } catch (error) {
        console.error("Error following user:", error);
        res.status(500).json({ error: error.message });
    }
};

export const unfollowUser = async (req, res) => {
    try {
        const { id: targetId } = req.params;
        const followerId = req.user.userId;

        const { error } = await supabase
            .from('followers')
            .delete()
            .match({
                user_id: targetId,
                follower_id: followerId
            });

        if (error) throw error;

        const { count } = await supabase
            .from('followers')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', targetId);

        res.status(200).json({ message: 'Dejado de seguir', followersCount: count });
    } catch (error) {
        console.error("Error unfollowing user:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getMyFollowing = async (req, res) => {
    try {
        const followerId = req.user.userId;
        const { data, error } = await supabase
            .from('followers')
            .select('user_id')
            .eq('follower_id', followerId);

        if (error) throw error;
        res.status(200).json(data.map(r => r.user_id));
    } catch (error) {
        console.error("Error fetching following:", error);
        res.status(500).json([]);
    }
};

export const checkFollowStatus = async (req, res) => {
    try {
        const { id: targetId } = req.params;
        const followerId = req.user.userId;

        const { data, error } = await supabase
            .from('followers')
            .select('id')
            .match({
                user_id: targetId,
                follower_id: followerId
            })
            .single();

        res.status(200).json({ isFollowing: !!data && !error });
    } catch (error) {
        res.status(200).json({ isFollowing: false });
    }
};
