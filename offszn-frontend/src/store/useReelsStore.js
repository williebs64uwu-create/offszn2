import { create } from 'zustand';
import { supabase } from '../api/client';

export const useReelsStore = create((set, get) => ({
    reels: [],
    loading: false,
    error: null,

    fetchReels: async () => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('reels')
                .select(`
          *,
          users(id, nickname, avatar_url, is_verified),
          reel_likes_count:reel_likes(count),
          reel_comments_count:reel_comments(count)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedReels = data.map(reel => ({
                ...reel,
                likesCount: reel.reel_likes_count?.[0]?.count || 0,
                commentsCount: reel.reel_comments_count?.[0]?.count || 0,
                isLiked: false // Initial state, will check in separate action or per user
            }));

            set({ reels: formattedReels, loading: false });
        } catch (error) {
            console.error('Error fetching reels:', error);
            set({ error: error.message, loading: false });
        }
    },

    checkIfLiked: async (userId) => {
        if (!userId) return;
        const { reels } = get();
        if (!reels.length) return;

        try {
            const reelIds = reels.map(r => r.id);
            const { data: likes } = await supabase
                .from('reel_likes')
                .select('reel_id')
                .eq('user_id', userId)
                .in('reel_id', reelIds);

            const likedIds = new Set(likes?.map(l => l.reel_id) || []);

            set({
                reels: reels.map(r => ({
                    ...r,
                    isLiked: likedIds.has(r.id)
                }))
            });
        } catch (error) {
            console.error('Error checking reel likes:', error);
        }
    },

    toggleLike: async (reelId, userId) => {
        if (!userId) return;

        const { reels } = get();
        const reel = reels.find(r => r.id === reelId);
        if (!reel) return;

        const newIsLiked = !reel.isLiked;
        const newLikesCount = newIsLiked ? reel.likesCount + 1 : reel.likesCount - 1;

        // Optimistic Update
        set({
            reels: reels.map(r =>
                r.id === reelId
                    ? { ...r, isLiked: newIsLiked, likesCount: Math.max(0, newLikesCount) }
                    : r
            )
        });

        try {
            if (newIsLiked) {
                await supabase.from('reel_likes').insert({ reel_id: reelId, user_id: userId });
            } else {
                await supabase.from('reel_likes').delete().match({ reel_id: reelId, user_id: userId });
            }
        } catch (error) {
            console.error('Error toggling reel like:', error);
            // Rollback on error
            set({
                reels: reels.map(r =>
                    r.id === reelId
                        ? { ...r, isLiked: !newIsLiked, likesCount: reel.likesCount }
                        : r
                )
            });
        }
    },

    incrementView: async (reelId) => {
        try {
            await supabase.rpc('increment_reel_views', { row_id: reelId });
        } catch (e) {
            console.error('Error incrementing reel views:', e);
        }
    }
}));
