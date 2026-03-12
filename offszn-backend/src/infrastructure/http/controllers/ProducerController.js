import { supabase } from '../../database/connection.js';

export const getAllProducers = async (req, res) => {
    try {
        const { genre, specialty, search, sort = 'trending', role } = req.query;
        const limit = parseInt(req.query.limit) || 50;
        const page = parseInt(req.query.page) || 1;
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('users')
            .select('id, nickname, first_name, last_name, avatar_url, banner_url, bio, role, is_verified, genres, specialty', { count: 'exact' });

        if (!role) {
            query = query.eq('is_producer', true);
        }

        if (genre) {
            query = query.contains('genres', [genre]);
        }
        if (specialty) {
            query = query.eq('specialty', specialty);
        }

        if (search && search.trim()) {
            const keywords = search.trim().split(/\s+/).filter(k => k.length > 0);
            if (keywords.length > 0) {
                const terms = keywords.map(k => `nickname.ilike.%${k}%`);
                query = query.or(terms.join(','));
            }
        }

        if (role) {
            const roleList = role.split(',').map(r => r.trim().toLowerCase()).filter(Boolean);
            if (roleList.length > 0) {
                const orParts = roleList.map(lowRole => {
                    if (lowRole === 'productores') {
                        return 'role.ilike.%Productor%';
                    } else if (lowRole === 'artistas') {
                        return 'role.ilike.%Artista%';
                    } else if (lowRole === 'compositores') {
                        return 'role.ilike.%Compositor%';
                    } else if (lowRole === 'ingenieros' || lowRole === 'ingenieros de mezcla/master') {
                        return 'role.ilike.%Ingeniero%';
                    } else if (lowRole === 'instrumentistas' || lowRole === 'instrumentista') {
                        return 'role.ilike.%Músico%,role.ilike.%Instrumentista%';
                    } else if (lowRole === 'oyentes' || lowRole === 'fan y consumidor' || lowRole === 'fan / consumidor') {
                        return 'role.ilike.%Fan%,role.ilike.%Consumidor%,role.ilike.%Oyente%';
                    }
                    return `role.ilike.%${lowRole}%`;
                });
                query = query.or(orParts.join(','));
            }
        }

        if (sort !== 'recent' && sort !== 'a-z') {
            query = query.order('avatar_url', { ascending: false, nullsFirst: false })
                .order('banner_url', { ascending: false, nullsFirst: false });
        }

        if (sort === 'a-z') {
            query = query.order('nickname', { ascending: true });
        } else if (sort === 'recent') {
            query = query.order('created_at', { ascending: false });
        } else if (sort === 'popular') {
            query = query.order('is_verified', { ascending: false }).order('created_at', { ascending: false });
        } else {
            query = query.order('is_verified', { ascending: false }).order('created_at', { ascending: false });
        }

        const { data: producers, count, error } = await query.range(from, to);

        if (error) throw error;

        let finalProducers = producers || [];

        if (finalProducers.length > 0) {
            const producerIds = finalProducers.map(p => p.id);
            const { data: productsData } = await supabase
                .from('products')
                .select('producer_id')
                .in('producer_id', producerIds)
                .in('status', ['approved', 'published']);

            const productCounts = {};
            if (productsData) {
                productsData.forEach(prod => {
                    productCounts[prod.producer_id] = (productCounts[prod.producer_id] || 0) + 1;
                });
            }

            finalProducers = finalProducers.map(p => ({
                ...p,
                products_count: productCounts[p.id] || 0
            }));
        }

        res.status(200).json({
            producers: finalProducers,
            total: count || 0,
            page: parseInt(page),
            totalPages: Math.ceil((count || 0) / limit)
        });
    } catch (err) {
        console.error("Error getAllProducers:", err.message);
        res.status(500).json({ error: 'Error al cargar creadores' });
    }
};
