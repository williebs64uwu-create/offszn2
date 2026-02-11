import { supabase } from '../../database/connection.js';

export const getMyCollaborations = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { status } = req.query;

        let query = supabase
            .from('collaborations')
            .select(`
                *,
                product:products(id, name, image_url),
                owner:users!owner_id(id, nickname, avatar_url),
                collaborator:users!collaborator_id(id, nickname, avatar_url)
            `);

        if (status) {
            query = query.eq('status', status);
        }

        // Collaborations where I am either owner or collaborator
        const { data, error } = await query.or(`owner_id.eq.${userId},collaborator_id.eq.${userId}`);

        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateCollaborations = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { productId, splits } = req.body; // splits: [{email, percent}]

        if (!productId || !splits || !Array.isArray(splits)) {
            return res.status(400).json({ error: 'Faltan datos obligatorios' });
        }

        // 1. Validate total = 100% (Strict Rule 8.2)
        const total = splits.reduce((acc, s) => acc + (parseInt(s.percent) || 0), 0);

        // Note: The owner's split might be implicit or explicit. 
        // In this implementation, we expect the full 100% breakdown.
        if (total !== 100) {
            return res.status(400).json({ error: 'El total de los splits debe sumar exactamente 100%' });
        }

        // 2. Clear old ones (Reconciliation)
        await supabase.from('collaborations').delete().eq('product_id', productId).eq('owner_id', userId);

        // 3. Insert new ones
        const inserts = splits.map(s => ({
            owner_id: userId,
            collaborator_email: s.email, // Or collaborator_id if we resolve it
            product_id: productId,
            royalty_split: s.percent,
            status: 'pending'
        }));

        const { error } = await supabase.from('collaborations').insert(inserts);
        if (error) throw error;

        res.status(200).json({ message: 'Colaboraciones actualizadas correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const respondToInvitation = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { status } = req.body; // 'accepted' | 'rejected'

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Estado inválido' });
        }

        const { data, error } = await supabase
            .from('collaborations')
            .update({ status, collaborator_id: userId })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.status(200).json({ message: `Invitación ${status}`, collaboration: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
