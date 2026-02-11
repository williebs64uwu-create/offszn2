import { supabase } from '../../database/connection.js';

export const getLeaderboard = async (req, res) => {
    try {
        const { data: producers, error: userError } = await supabase
            .from('users')
            .select('id, nickname, avatar_url, is_verified, bio')
            .eq('is_producer', true)
            .not('avatar_url', 'is', null);

        if (userError) throw userError;

        const producerIds = producers.map(p => p.id);

        const { data: products, error: prodError } = await supabase
            .from('products')
            .select('producer_id, views_count, plays_count, downloads_count, sales_count')
            .in('producer_id', producerIds)
            .eq('status', 'approved');

        if (prodError) throw prodError;

        // Simplified scoring for new backend (similar to legacy)
        const scores = {};
        producers.forEach(p => {
            scores[p.id] = p.is_verified ? 100 : 0;
        });

        products?.forEach(prod => {
            if (scores[prod.producer_id] !== undefined) {
                scores[prod.producer_id] +=
                    (prod.views_count || 0) * 1 +
                    (prod.plays_count || 0) * 2 +
                    (prod.downloads_count || 0) * 20 +
                    (prod.sales_count || 0) * 50;
            }
        });

        const leaderboard = producers.map(p => ({
            id: p.id,
            nickname: p.nickname,
            avatar_url: p.avatar_url,
            is_verified: p.is_verified,
            score: scores[p.id] || 0
        }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map((p, i) => ({ ...p, rank: i + 1 }));

        res.status(200).json(leaderboard);
    } catch (err) {
        console.error("Error generating leaderboard:", err);
        res.status(500).json({ error: 'Error al generar leaderboard' });
    }
};
