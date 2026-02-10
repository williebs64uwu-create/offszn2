import { useState, useCallback } from 'react';
import { supabase } from '../api/client';
import { useAuth } from '../store/authStore';
import toast from 'react-hot-toast';

export const useMyProducts = () => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());

    const fetchProducts = useCallback(async (type = 'beat', status = 'all') => {
        if (!user) return;
        setLoading(true);

        // Map UI type to DB type
        const typeMap = {
            'beats': 'beat',
            'drumkits': 'drumkit',
            'loopkits': 'loopkit',
            'presets': 'preset'
        };
        const dbType = typeMap[type] || 'beat';

        // Map UI status/visibility
        const visibilityMap = {
            'published': 'public',
            'private': 'private',
            'unlisted': 'unlisted'
        };

        try {
            // 1. Fetch Published Products
            let query = supabase
                .from('products')
                .select('*')
                .eq('producer_id', user.id)
                .eq('product_type', dbType);

            if (status !== 'all' && status !== 'draft') {
                const visibility = visibilityMap[status];
                if (visibility) {
                    query = query.eq('visibility', visibility);
                }
            }

            // Exclude soft-deleted items
            query = query.not('status', 'eq', 'deleted');

            const { data: products, error: pError } = await query.order('created_at', { ascending: false });
            if (pError) throw pError;

            // 2. Fetch Drafts (Only if 'all' or 'draft')
            let drafts = [];
            if (status === 'all' || status === 'draft') {
                const draftTableMap = {
                    'beat': 'beat_drafts',
                    'drumkit': 'drumkit_drafts',
                    'loopkit': 'loopkit_drafts',
                    'preset': 'preset_drafts'
                };
                const draftTable = draftTableMap[dbType];

                if (draftTable) {
                    const { data: dData, error: dError } = await supabase
                        .from(draftTable)
                        .select('*')
                        .eq('user_id', user.id)
                        .order('last_saved', { ascending: false });

                    if (dError) console.error("Error fetching drafts:", dError);
                    else drafts = (dData || []).map(d => ({ ...d, isDraft: true, status: 'draft' }));
                }
            }

            // 3. Combine and Set
            setItems([...drafts, ...products]);
        } catch (err) {
            console.error("Error loading products:", err);
            toast.error("Error al cargar tus productos");
        } finally {
            setLoading(false);
        }
    }, [user]);

    const toggleSelection = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAll = () => {
        const allIds = items.map(i => i.id);
        setSelectedIds(new Set(allIds));
    };

    const deselectAll = () => {
        setSelectedIds(new Set());
    };

    const bulkUpdateVisibility = async (newVisibility) => {
        if (selectedIds.size === 0) return;
        setLoading(true);

        try {
            const ids = Array.from(selectedIds);

            // Drafts cannot have their visibility changed directly to public/unlisted without publishing
            const productsToUpdate = items.filter(i => selectedIds.has(i.id) && !i.isDraft);
            const draftCount = ids.length - productsToUpdate.length;

            if (productsToUpdate.length > 0) {
                const { error } = await supabase
                    .from('products')
                    .update({ visibility: newVisibility })
                    .in('id', productsToUpdate.map(p => p.id));

                if (error) throw error;
            }

            let msg = "Visibilidad actualizada";
            if (draftCount > 0) msg += `. (${draftCount} borradores omitidos)`;
            toast.success(msg);

            deselectAll();
            // Refresh
            // We need to know current type/status to refresh properly, 
            // but for now we trust the parent to call fetchProducts
        } catch (err) {
            console.error("Bulk visibility error:", err);
            toast.error("Error al actualizar visibilidad");
        } finally {
            setLoading(false);
        }
    };

    const bulkDelete = async (currentType) => {
        if (selectedIds.size === 0) return;
        setLoading(true);

        try {
            const ids = Array.from(selectedIds);
            const itemsToDelete = items.filter(i => selectedIds.has(i.id));

            for (const item of itemsToDelete) {
                // 1. Delete Files from Storage (Simplified for now, focusing on DB)
                // In a real scenario, we'd trigger a cloud function or delete via client if possible

                // 2. DB Operations
                if (item.isDraft) {
                    const tableMap = {
                        'beat': 'beat_drafts',
                        'drumkit': 'drumkit_drafts',
                        'loopkit': 'loopkit_drafts',
                        'preset': 'preset_drafts'
                    };
                    const typeMap = {
                        'beats': 'beat',
                        'drumkits': 'drumkit',
                        'loopkits': 'loopkit',
                        'presets': 'preset'
                    };
                    const type = typeMap[currentType] || 'beat';
                    const table = tableMap[type];

                    await supabase.from(table).delete().eq('id', item.id);
                } else {
                    // Soft delete for analytics
                    await supabase.from('products').update({
                        status: 'deleted',
                        visibility: 'private'
                    }).eq('id', item.id);
                }
            }

            toast.success("Eliminado correctamente");
            deselectAll();
        } catch (err) {
            console.error("Bulk delete error:", err);
            toast.error("Error al eliminar productos");
        } finally {
            setLoading(false);
        }
    };

    return {
        items,
        loading,
        selectedIds,
        fetchProducts,
        toggleSelection,
        selectAll,
        deselectAll,
        bulkUpdateVisibility,
        bulkDelete
    };
};
