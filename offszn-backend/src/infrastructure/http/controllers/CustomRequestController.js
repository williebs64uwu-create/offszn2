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
