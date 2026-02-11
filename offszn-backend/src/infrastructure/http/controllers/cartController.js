import { supabase } from '../../database/connection.js';

export const addItemToCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { productId, license_name, variant_price } = req.body;

        if (!productId) return res.status(400).json({ error: 'Product ID is required' });

        const { data, error } = await supabase
            .from('cart_items')
            .insert({
                user_id: userId,
                product_id: productId,
                license_name,
                variant_price
            })
            .select()
            .single();

        if (error && error.code === '23505') {
            return res.status(409).json({ error: 'Este producto ya está en el carrito' });
        } else if (error) throw error;

        res.status(201).json({ message: 'Añadido al carrito', item: data });
    } catch (err) {
        console.error("ErroraddItemToCart:", err.message);
        res.status(500).json({ error: 'Error al añadir al carrito' });
    }
};

export const getCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { data, error } = await supabase
            .from('cart_items')
            .select(`
                id, 
                license_name, 
                variant_price, 
                product:products(id, name, price_basic, image_url, producer_id)
            `)
            .eq('user_id', userId);

        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        console.error("Error getCart:", err.message);
        res.status(500).json({ error: 'Error al obtener el carrito' });
    }
};

export const removeItemFromCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', userId)
            .eq('id', id);

        if (error) throw error;
        res.status(200).json({ message: 'Eliminado del carrito' });
    } catch (err) {
        console.error("Error removeItemFromCart:", err.message);
        res.status(500).json({ error: 'Error al eliminar del carrito' });
    }
};
