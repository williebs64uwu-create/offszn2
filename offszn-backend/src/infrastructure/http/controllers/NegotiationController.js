import { supabase } from '../../database/connection.js';
import { createNotification } from './NotificationController.js';
import { sendNegotiationOfferEmail, sendNegotiationResponseEmail } from '../../../shared/services/EmailService.js';

export const createNegotiation = async (req, res) => {
    try {
        const { product_id, buyer_email, buyer_name, offered_amount, message } = req.body;

        if (!product_id || !buyer_email || !offered_amount) {
            return res.status(400).json({ error: 'Faltan datos requeridos' });
        }

        // Get product to find producer_id
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, producer_id, name')
            .eq('id', product_id)
            .single();

        if (productError || !product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Create negotiation
        const { data: negotiation, error } = await supabase
            .from('negotiations')
            .insert({
                product_id,
                producer_id: product.producer_id,
                buyer_id: req.user?.userId || null, // Capture buyer_id if logged in
                buyer_email,
                buyer_name: buyer_name || buyer_email.split('@')[0],
                offered_amount,
                message,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        // --- NEW: Send Email to Producer ---
        try {
            const { data: producer } = await supabase
                .from('users')
                .select('email')
                .eq('id', product.producer_id)
                .single();

            if (producer?.email) {
                await sendNegotiationOfferEmail(producer.email, product, offered_amount);
            }
        } catch (emailErr) {
            console.error('Non-blocking Email Error (Producer):', emailErr.message);
        }

        // Create notification for producer
        await createNotification({
            user_id: product.producer_id,
            type: 'negotiation',
            message: `Nueva oferta de $${offered_amount} para tu beat "${product.name}"`,
            link: `/dashboard/negotiations`
        });

        res.status(201).json(negotiation);
    } catch (err) {
        console.error('Error creating negotiation:', err);
        res.status(500).json({ error: 'Error al crear la negociación' });
    }
};

export const getNegotiations = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { type = 'producer' } = req.query; // 'producer' or 'buyer'

        if (!userId) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        let query = supabase
            .from('negotiations')
            .select(`
                *,
                product:products(
                    id,
                    name,
                    public_slug,
                    image_url,
                    product_type,
                    users:users!products_producer_id_fkey(nickname, is_verified)
                )
            `);

        if (type === 'buyer') {
            query = query.eq('buyer_id', userId);
        } else {
            query = query.eq('producer_id', userId);
        }

        const { data: negotiations, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json(negotiations);
    } catch (err) {
        console.error('Error fetching negotiations:', err);
        res.status(500).json({ error: 'Error al obtener las negociaciones' });
    }
};

export const getNegotiationById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        const { data: negotiation, error } = await supabase
            .from('negotiations')
            .select(`
                *,
                product:products(
                    id,
                    name,
                    public_slug,
                    image_url,
                    product_type,
                    audio_url,
                    bpm,
                    key
                )
            `)
            .eq('id', id)
            .or(`producer_id.eq.${userId},buyer_id.eq.${userId}`)
            .single();

        if (error || !negotiation) {
            return res.status(404).json({ error: 'Negociación no encontrada' });
        }

        res.status(200).json(negotiation);
    } catch (err) {
        console.error('Error fetching negotiation:', err);
        res.status(500).json({ error: 'Error al obtener la negociación' });
    }
};

export const updateNegotiationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, response_message } = req.body;
        const userId = req.user?.userId;

        if (!['pending', 'accepted', 'rejected', 'counter'].includes(status)) {
            return res.status(400).json({ error: 'Estado inválido' });
        }

        const { data: negotiation, error } = await supabase
            .from('negotiations')
            .update({
                status,
                response_message,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('producer_id', userId)
            .select()
            .single();

        if (error) throw error;

        // --- NEW: Send Email to Buyer ---
        try {
            const { data: product } = await supabase
                .from('products')
                .select('name')
                .eq('id', negotiation.product_id)
                .single();

            await sendNegotiationResponseEmail(
                negotiation.buyer_email,
                { name: product?.name || 'Producto' },
                status,
                response_message
            );

            // Notify buyer if they are a registered user
            if (negotiation.buyer_id) {
                await createNotification({
                    user_id: negotiation.buyer_id,
                    type: 'negotiation',
                    message: `Tu oferta para "${product?.name || 'Producto'}" ha sido ${status === 'accepted' ? 'ACEPTADA' : 'RECHAZADA'}`,
                    link: `/dashboard/negotiations`
                });
            }
        } catch (emailErr) {
            console.error('Non-blocking Email/Notify Error (Buyer):', emailErr.message);
        }

        res.status(200).json(negotiation);
    } catch (err) {
        console.error('Error updating negotiation:', err);
        res.status(500).json({ error: 'Error al actualizar la negociación' });
    }
};
