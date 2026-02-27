import { useState, useCallback, useEffect } from 'react';
import apiClient, { supabase } from '../api/client';
import { useAuth } from '../store/authStore';
import toast from 'react-hot-toast';

export const useCollaborations = () => {
    const { user } = useAuth();
    const [invites, setInvites] = useState({ received: [], sent: [], active: [], rejected: [] });
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);

    const fetchCollaborations = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            // Fetch all invitations where user is either inviter or collaborator
            const { data, error } = await supabase
                .from('collab_invitations')
                .select(`
                    *,
                    products:product_id (id, name, image_url, cover_url, visibility),
                    inviter:inviter_id (id, email, nickname),
                    collaborator:collaborator_id (id, email, nickname)
                `)
                .or(`inviter_id.eq.${user.id},collaborator_id.eq.${user.id}`);

            if (error) throw error;

            // Filter by visibility (only public/unlisted counts for active collabs usually)
            const filteredData = data.filter(item =>
                item.products && (item.products.visibility === 'public' || item.products.visibility === 'unlisted')
            );

            const organized = {
                received: filteredData.filter(i => i.collaborator_id === user.id && i.status === 'pending'),
                sent: filteredData.filter(i => i.inviter_id === user.id && i.status === 'pending'),
                active: filteredData.filter(i => i.status === 'accepted'),
                rejected: filteredData.filter(i => i.status === 'rejected')
            };

            setInvites(organized);
        } catch (err) {
            console.error("Error fetching collaborations:", err);
            toast.error("Error al cargar colaboraciones");
        } finally {
            setLoading(false);
        }
    }, [user]);

    const fetchMyProducts = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('products')
                .select('id, name')
                .eq('producer_id', user.id)
                .order('name', { ascending: true });

            if (error) throw error;
            setProducts(data);
        } catch (err) {
            console.error("Error fetching products for collation:", err);
        }
    }, [user]);

    useEffect(() => {
        fetchCollaborations();
        fetchMyProducts();
    }, [fetchCollaborations, fetchMyProducts]);

    const respondToInvite = async (inviteId, status) => {
        try {
            // Find the invite details to know who to notify
            const { data: inviteInfo } = await supabase
                .from('collab_invitations')
                .select('inviter_id, product_id, products(name)')
                .eq('id', inviteId)
                .single();

            const { error } = await supabase
                .from('collab_invitations')
                .update({ status })
                .eq('id', inviteId);

            if (error) throw error;

            // Dispatch notification if accepted
            if (status === 'accepted' && inviteInfo) {
                try {
                    await apiClient.post('/notifications', {
                        targetUserId: inviteInfo.inviter_id,
                        type: 'collab_accept',
                        message: `<strong>${user.user_metadata?.nickname || 'Alguien'}</strong> aceptó tu invitación para colaborar en <strong>${inviteInfo.products?.name || 'un producto'}</strong>.`,
                        link: `/dashboard/collaborations`
                    });
                } catch (notifErr) {
                    console.warn("Could not dispatch collab_accept notification:", notifErr);
                }
            }

            toast.success(status === 'accepted' ? "Colaboración aceptada" : "Invitación rechazada");
            fetchCollaborations();
        } catch (err) {
            console.error("Error responding to invite:", err);
            toast.error("Error al actualizar estado");
        }
    };

    const saveSplits = async (productId, splits) => {
        if (!user) return;
        console.log('[DEBUG] saveSplits called. productId:', productId, 'splits:', splits);

        try {
            // 1. Delete existing for this product by THIS owner
            const { error: deleteError } = await supabase
                .from('collab_invitations')
                .delete()
                .eq('product_id', productId)
                .eq('inviter_id', user.id);

            if (deleteError) {
                console.error('[DEBUG] deleteError:', deleteError);
                throw deleteError;
            }

            // 2. Build invitations to insert
            const toInsert = splits
                .filter(s => !s.isOwner && s.email)
                .map(s => ({
                    inviter_id: user.id,
                    product_id: productId,
                    collaborator_email: s.email,
                    royalty_split: parseInt(s.percent),
                    status: 'pending'
                }));

            console.log('[DEBUG] toInsert array:', toInsert);

            if (toInsert.length > 0) {
                const { error: insertError } = await supabase
                    .from('collab_invitations')
                    .insert(toInsert);

                if (insertError) {
                    console.error('[DEBUG] insertError:', insertError);
                    throw insertError;
                }

                console.log('[DEBUG] DB insert success. Now calling /notifications/collab-invite...');

                // Ask the backend to resolve emails -> IDs and send notifications.
                try {
                    const { data: productInfo } = await supabase.from('products').select('name').eq('id', productId).single();
                    const emails = toInsert.map(s => s.collaborator_email);
                    console.log('[DEBUG] Sending to /notifications/collab-invite with emails:', emails, 'productName:', productInfo?.name);
                    const notifResult = await apiClient.post('/notifications/collab-invite', {
                        collaboratorEmails: emails,
                        productName: productInfo?.name || 'un producto'
                    });
                    console.log('[DEBUG] /notifications/collab-invite response:', notifResult.data);
                } catch (notifErr) {
                    console.error('[DEBUG] collab_invite notification ERROR:', notifErr);
                }
            } else {
                console.warn('[DEBUG] toInsert is empty - no collaborators to notify.');
            }

            toast.success("Reparto de royalties actualizado");
            fetchCollaborations();
            return true;
        } catch (err) {
            console.error("Error saving splits:", err);
            toast.error("Error al guardar splits");
            return false;
        }
    };

    return {
        invites,
        products,
        loading,
        respondToInvite,
        saveSplits,
        refresh: fetchCollaborations
    };
};
