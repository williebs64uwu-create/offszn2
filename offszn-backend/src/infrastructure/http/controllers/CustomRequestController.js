import { supabase } from '../../database/connection.js';

export const createCustomRequest = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {
            producerId,
            description,
            budget,
            bpm,
            key,
            referenceLink1,
            referenceLink2,
            previewUrl
        } = req.body;

        if (!producerId || !description || !budget) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        // Rate limit check (e.g. 1 per day if simple strategy) could go here.
        // We will insert directly into the table.
        const { data, error } = await supabase
            .from('custom_requests')
            .insert({
                buyer_id: userId,
                producer_id: producerId,
                description,
                budget,
                bpm,
                key,
                reference_link_1: referenceLink1,
                reference_link_2: referenceLink2,
                preview_url: previewUrl,
                status: 'pending' // or whatever original states were
            })
            .select('*')
            .single();

        if (error) {
            throw error;
        }

        res.status(201).json({ message: 'Solicitud creada con éxito', request: data });
    } catch (err) {
        console.error("Error en createCustomRequest:", err.message);
        res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
};

export const getPublicRequests = async (req, res) => {
    try {
        const { genre, category, minPrice, maxPrice } = req.query;

        let query = supabase
            .from('custom_requests')
            .select(`
                *,
                buyer:buyer_id (
                    id,
                    nickname,
                    avatar_url,
                    role
                )
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        // Apply filters
        if (genre && genre !== 'all') {
            query = query.ilike('description', `%${genre}%`);
        }

        if (minPrice) {
            query = query.gte('budget', minPrice);
        }

        if (maxPrice) {
            query = query.lte('budget', maxPrice);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({ requests: data || [] });
    } catch (err) {
        console.error("Error en getPublicRequests:", err.message);
        res.status(500).json({ error: 'Error al cargar las solicitudes' });
    }
};

export const claimRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const producerId = req.user.userId;

        // 1. Verify it's not the buyer claiming their own request
        const { data: request, error: fetchError } = await supabase
            .from('custom_requests')
            .select('buyer_id, status')
            .eq('id', id)
            .single();

        if (fetchError || !request) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        if (request.buyer_id === producerId) {
            return res.status(403).json({ error: 'No puedes reclamar tu propia solicitud' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ error: 'Esta solicitud ya ha sido reclamada o no está disponible' });
        }

        // 2. Update status and claimer
        const { data, error } = await supabase
            .from('custom_requests')
            .update({
                status: 'claimed',
                producer_id: producerId
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // 3. Send notification to buyer (mocked for now, assuming notification system exists)
        try {
            await supabase.from('notifications').insert({
                target_user_id: request.buyer_id,
                type: 'request_claimed',
                message: `¡Un productor ha aceptado tu solicitud de trabajo! Revisa tus mensajes.`,
                link: `/dashboard/requests`
            });
        } catch (notifErr) {
            console.warn("Could not send notification:", notifErr.message);
        }

        res.json({ message: 'Has reclamado el trabajo con éxito', request: data });
    } catch (err) {
        console.error("Error en claimRequest:", err.message);
        res.status(500).json({ error: 'Error al procesar el reclamo' });
    }
};
