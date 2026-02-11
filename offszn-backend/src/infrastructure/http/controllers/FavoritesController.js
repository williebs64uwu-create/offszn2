import { supabase } from '../../database/connection.js';

export const getMyFavorites = async (req, res) => {
    try {
        const userId = req.user.userId;

        const { data: likes, error: likesError } = await supabase
            .from('likes')
            .select('target_id')
            .eq('user_id', userId)
            .eq('target_type', 'product');

        if (likesError) throw likesError;
        if (!likes || likes.length === 0) return res.status(200).json([]);

        const productIds = likes.map(l => l.target_id);

        const { data: products, error: productsError } = await supabase
            .from('products')
            .select(`
                *,
                artist_users:users!products_producer_id_fkey(nickname, avatar_url, is_verified, id)
            `)
            .in('id', productIds);

        if (productsError) throw productsError;
        res.status(200).json(products || []);
    } catch (err) {
        console.error("Error getMyFavorites:", err.message);
        res.status(500).json({ error: 'Error al obtener favoritos' });
    }
};

export const toggleProductLike = async (req, res) => {
    try {
        const userId = req.user.userId;
        const productId = req.params.id;

        const { data: existing, error: checkError } = await supabase
            .from('likes')
            .select('id')
            .eq('user_id', userId)
            .eq('target_id', productId)
            .eq('target_type', 'product')
            .maybeSingle();

        if (checkError) throw checkError;

        if (existing) {
            const { error: deleteError } = await supabase
                .from('likes')
                .delete()
                .eq('id', existing.id);

            if (deleteError) throw deleteError;
            return res.status(200).json({ liked: false });
        } else {
            const { error: insertError } = await supabase
                .from('likes')
                .insert({
                    user_id: userId,
                    target_id: productId,
                    target_type: 'product'
                });

            if (insertError) throw insertError;

            // Optional: Notification logic can be moved to a shared service
            try {
                const { data: product } = await supabase
                    .from('products')
                    .select('producer_id, name')
                    .eq('id', productId)
                    .single();

                if (product && product.producer_id) {
                    const { data: liker } = await supabase
                        .from('users')
                        .select('nickname')
                        .eq('id', userId)
                        .single();

                    await supabase.from('notifications').insert({
                        user_id: product.producer_id,
                        type: 'product_like',
                        title: '¡Nuevo Me Gusta!',
                        message: `A <strong>${liker?.nickname || 'Alguien'}</strong> le gustó tu producto <strong>${product.name}</strong>.`,
                        data: { product_id: productId, liker_id: userId },
                        read: false
                    });
                }
            } catch (notifErr) {
                console.warn("Favorites: Failed to send notification", notifErr.message);
            }

            return res.status(200).json({ liked: true });
        }
    } catch (err) {
        console.error("Error toggleProductLike:", err.message);
        res.status(500).json({ error: 'Error al actualizar like' });
    }
};
