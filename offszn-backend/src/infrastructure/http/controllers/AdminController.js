import { supabase } from '../../database/connection.js';

export const getAllAdminProducts = async (req, res) => {
    try {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        console.error("Error in getAllAdminProducts:", err.message);
        res.status(500).json({ error: 'Error fetching products' });
    }
};

export const getAllAdminOrders = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                id, created_at, transaction_id, status, total_price,
                users ( email ), 
                order_items ( quantity, price_at_purchase, products ( name ) )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        console.error("Error in getAllAdminOrders:", err.message);
        res.status(500).json({ error: 'Error fetching orders' });
    }
};

export const getAllAdminUsers = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, created_at, email, first_name, last_name, is_admin, role');
        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        console.error("Error in getAllAdminUsers:", err.message);
        res.status(500).json({ error: 'Error fetching users' });
    }
};

export const createAdminProduct = async (req, res) => {
    try {
        const product = req.body;
        const { data, error } = await supabase
            .from('products')
            .insert(product)
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ message: 'Product created successfully', product: data });
    } catch (err) {
        console.error("Error in createAdminProduct:", err.message);
        res.status(500).json({ error: err.message || 'Error creating product' });
    }
};

export const updateAdminProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.status(200).json({ message: 'Product updated successfully', product: data });
    } catch (err) {
        console.error("Error in updateAdminProduct:", err.message);
        res.status(500).json({ error: err.message || 'Error updating product' });
    }
};

export const deleteAdminProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error("Error in deleteAdminProduct:", err.message);
        res.status(500).json({ error: err.message || 'Error deleting product' });
    }
};
