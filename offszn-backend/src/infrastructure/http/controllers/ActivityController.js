import { supabase } from '../../database/connection.js';

export const recordActivity = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { entity_id, entity_type } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        if (!entity_id || !entity_type) {
            return res.status(400).json({ error: 'Faltan datos requeridos' });
        }

        // Record activity
        const { data, error } = await supabase
            .from('activity_history')
            .upsert({
                user_id: userId,
                entity_id,
                entity_type,
                last_action_at: new Date().toISOString()
            }, { onConflict: 'user_id, entity_id, entity_type' });

        if (error) throw error;

        res.status(201).json({ success: true });
    } catch (err) {
        console.error('Error recording activity:', err);
        res.status(500).json({ error: 'Error al registrar actividad' });
    }
};

export const getActivityHistory = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { type } = req.query; // 'product' or 'profile'

        if (!userId) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        let query = supabase
            .from('activity_history')
            .select('*')
            .eq('user_id', userId)
            .order('last_action_at', { ascending: false });

        if (type) {
            query = query.eq('entity_type', type);
        }

        const { data: history, error } = await query.limit(50);

        if (error) throw error;

        // Populate basic info if needed
        // For products, fetching product details
        const enrichedHistory = await Promise.all(history.map(async (item) => {
            if (item.entity_type === 'product' || item.entity_type === 'listen') {
                const { data: product } = await supabase
                    .from('products')
                    .select('id, name, image_url, public_slug, product_type')
                    .eq('id', item.entity_id)
                    .single();
                return { ...item, product };
            } else if (item.entity_type === 'profile') {
                const { data: profile } = await supabase
                    .from('users')
                    .select('id, avatar_url, nickname')
                    .eq('nickname', item.entity_id)
                    .single();
                return { ...item, profile };
            }
            return item;
        }));

        res.status(200).json(enrichedHistory);
    } catch (err) {
        console.error('Error fetching activity history:', err);
        res.status(500).json({ error: 'Error al obtener historial' });
    }
};
