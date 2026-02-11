import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../api/client';
import { useAuth } from '../store/authStore';
import toast from 'react-hot-toast';

export const useCoupons = () => {
    const { user } = useAuth();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);

    const getStatus = (coupon) => {
        const now = new Date();
        const start = new Date(coupon.valid_from);
        const end = coupon.valid_to ? new Date(coupon.valid_to) : null;

        if (start > now) return 'scheduled';
        if (end && end <= now) return 'expired';
        return 'active';
    };

    const fetchCoupons = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('producer_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const withStatus = data.map(c => ({
                ...c,
                status: getStatus(c)
            }));

            setCoupons(withStatus);
        } catch (err) {
            console.error("Error fetching coupons:", err);
            toast.error("Error al cargar cupones");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    const saveCoupon = async (couponData) => {
        if (!user) return false;

        try {
            const isEditing = !!couponData.id;
            const payload = {
                ...couponData,
                producer_id: user.id,
                code: couponData.code.toUpperCase()
            };

            let error;
            if (isEditing) {
                const { error: updateError } = await supabase
                    .from('coupons')
                    .update(payload)
                    .eq('id', couponData.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('coupons')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            toast.success(isEditing ? "Cupón actualizado" : "Cupón creado con éxito");
            fetchCoupons();
            return true;
        } catch (err) {
            console.error("Error saving coupon:", err);
            toast.error(err.message || "Error al guardar el cupón");
            return false;
        }
    };

    const deleteCoupon = async (id) => {
        try {
            const { error } = await supabase
                .from('coupons')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success("Cupón eliminado");
            fetchCoupons();
            return true;
        } catch (err) {
            console.error("Error deleting coupon:", err);
            toast.error("Error al eliminar el cupón");
            return false;
        }
    };

    const validateCoupon = async (code, productId = null) => {
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', code.toUpperCase())
                .single();

            if (error || !data) throw new Error("Cupón no encontrado");

            const status = getStatus(data);
            if (status === 'expired') throw new Error("El cupón ha expirado");
            if (status === 'scheduled') throw new Error("El cupón aún no es válido");

            if (data.usage_limit && data.used_count >= data.usage_limit) {
                throw new Error("El cupón ha alcanzado su límite de uso");
            }

            // If product-specific, check match
            if (data.applicable_to === 'specific' && productId && data.product_id !== productId) {
                throw new Error("Este cupón no es válido para este producto");
            }

            return { valid: true, coupon: data };
        } catch (err) {
            return { valid: false, message: err.message };
        }
    };

    return {
        coupons,
        loading,
        saveCoupon,
        deleteCoupon,
        validateCoupon,
        refresh: fetchCoupons
    };
};
