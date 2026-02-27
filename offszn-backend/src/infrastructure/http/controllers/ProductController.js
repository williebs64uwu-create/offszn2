import { supabase } from '../../database/connection.js';
import { createNotification } from './NotificationController.js';

export const getAllProducts = async (req, res) => {
    try {
        const { nickname, type, sort } = req.query;
        // En ProductController.js -> getAllProducts
        let query = supabase
            .from('products')
            .select(`
        *,
        users!producer_id (
            id, nickname, avatar_url, is_verified
        ),
        collaborations:collab_invitations!product_id (
            royalty_percent,
            status,
            collaborator:users!collaborator_id (
                id, nickname, avatar_url, is_verified
            )
        )
    `);

        // Filtrado por Nickname de Productor
        if (nickname) {
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('id')
                .ilike('nickname', nickname)
                .single();

            if (userError || !user) {
                return res.status(404).json({ error: 'Productor no encontrado' });
            }
            query = query.eq('producer_id', user.id);
        }

        if (type) {
            query = query.eq('product_type', type);
        }

        // En producción, mostrar publicados o aprobados
        query = query.in('status', ['approved', 'published']);

        // Ordenamiento
        if (sort === 'newest') {
            query = query.order('created_at', { ascending: false });
        } else if (sort === 'plays') {
            query = query.order('plays_count', { ascending: false });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;
        if (error) throw error;

        // Add is_liked status if user is logged in
        let productsWithLikes = data;
        const userId = req.user?.userId;

        if (userId && data.length > 0) {
            const productIds = data.map(p => p.id);
            const { data: userLikes } = await supabase
                .from('likes')
                .select('target_id')
                .eq('user_id', userId)
                .eq('target_type', 'product')
                .in('target_id', productIds);

            if (userLikes) {
                const likedIds = new Set(userLikes.map(l => l.target_id));
                productsWithLikes = data.map(p => ({
                    ...p,
                    is_liked: likedIds.has(p.id)
                }));
            }
        }

        res.status(200).json(productsWithLikes);
    } catch (err) {
        console.error("❌ ERROR EN GET_ALL_PRODUCTS:", err); // <-- AGREGA ESTO
        res.status(500).json({ error: err.message });
    }
};



export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        // Support ID or Slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const isInt = /^\d+$/.test(id);

        let query = supabase
            .from('products')
            .select(`
                *,
                users!producer_id (
                    id, nickname, avatar_url, is_verified
                )
            `);

        if (isInt || isUUID) {
            query = query.eq('id', id);
        } else {
            query = query.eq('public_slug', id);
        }

        const { data, error } = await query.single();

        if (error || !data) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Add is_liked status if user is logged in
        let isLiked = false;
        const userId = req.user?.userId;

        if (userId) {
            const { data: like } = await supabase
                .from('likes')
                .select('id')
                .eq('user_id', userId)
                .eq('target_id', data.id)
                .eq('target_type', 'product')
                .maybeSingle();
            isLiked = !!like;
        }

        res.status(200).json({ ...data, is_liked: isLiked });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createProduct = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {
            title, description, key, bpm, tags, genres, moods,
            isFree, licenses, artwork_url, mp3_url, wav_url, stems_url, product_type
        } = req.body;

        if (!title || !genres || !artwork_url) {
            return res.status(400).json({ error: 'Faltan datos obligatorios.' });
        }

        // SEO Slug Generation: /beat/{name-slug}-{id-part}
        const nameSlug = title.toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');

        // We generate a temp slug, Supabase will provide the ID
        const tempSlug = `${nameSlug}-${Math.random().toString(36).substring(2, 7)}`;

        const productData = {
            producer_id: userId,
            name: title,
            public_slug: tempSlug,
            description: description || null,
            image_url: artwork_url,
            product_type: product_type || 'beat',
            status: 'approved',
            bpm: bpm ? parseInt(bpm) : null,
            key: key || null,
            tags: tags || null,
            genres: genres || null,
            moods: moods || null,
            download_url_mp3: mp3_url,
            download_url_wav: wav_url || null,
            download_url_stems: stems_url || null,
            is_free: isFree,
            price_basic: licenses?.basic || null,
            price_premium: licenses?.premium || null,
            price_stems: licenses?.stems || null,
            price_exclusive: licenses?.exclusive || null
        };

        const { data: newProduct, error: insertError } = await supabase
            .from('products')
            .insert(productData)
            .select()
            .single();

        if (insertError) throw insertError;

        // Emit notification for successful upload
        await createNotification({
            userId,
            actorId: userId,
            type: 'product_upload',
            message: `Tu producto '${title}' se ha subido exitosamente.`,
            link: `/dashboard/my-products` // Or product link
        });

        res.status(201).json({ message: 'Producto publicado!', product: newProduct });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const incrementPlayCount = async (req, res) => {
    try {
        const productId = req.params.id;
        const { type } = req.query; // 'view' or 'play'

        const column = type === 'view' ? 'views_count' : 'plays_count';

        const { error } = await supabase.rpc('increment_product_metric', {
            row_id: productId,
            column_name: column
        });

        // Fallback if RPC doesn't exist yet (Supabase Common Pattern)
        if (error) {
            const { data: product } = await supabase
                .from('products')
                .select(column)
                .eq('id', productId)
                .single();

            await supabase
                .from('products')
                .update({ [column]: (product?.[column] || 0) + 1 })
                .eq('id', productId);
        }

        res.status(200).json({ message: 'Metric updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
