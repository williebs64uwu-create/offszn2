import { supabase } from '../../database/connection.js';

// Internal service to create notifications from other controllers
export const createNotification = async ({ userId, actorId = null, type, title = 'Notificación', message, link = null }) => {
    try {
        if (!userId) return null;

        // Prevent notifying oneself for actions like follow or like, but allow specific types
        const allowedSelfNotifications = ['product_upload', 'purchase_complete', 'collab_invite'];
        if (actorId && userId === actorId && !allowedSelfNotifications.includes(type)) {
            return null;
        }

        console.log(`[NotificationController] Attempting to insert notification for user ${userId}, type: ${type}`);
        const { data, error } = await supabase
            .from('notifications')
            .insert([{
                user_id: userId,
                actor_id: actorId,
                type,
                title,
                message,
                link,
                read: false
            }])
            .select();

        if (error) {
            console.error('[NotificationController] ❌ Error creating notification (DB):', JSON.stringify(error, null, 2));
            return null;
        }

        console.log(`[NotificationController] ✅ Notification created successfully for ${userId}`);
        return data;
    } catch (err) {
        console.error('[NotificationController] Exception creating notification:', err.message);
        return null;
    }
};

// HTTP Handlers
export const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;

        const { data, error } = await supabase
            .from('notifications')
            .select(`
                *,
                actor:users!notifications_actor_id_fkey(nickname, avatar_url)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50); // Fetch latest 50 notifications

        // If relation 'users!actor_id' causes error (due to foreign key setup unknown),
        // we might fallback to basic fetch but let's try assuming the FK is correct or actor_id is UUID.
        if (error) {
            // Fallback without join if foreign key to users table isn't explicitly set in PostgREST
            console.warn('[NotificationController] Could not fetch with actor relation, fetching basics...', error.message);
            const basic = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            // Map actor info manually if relation join failed
            if (basic.data && basic.data.length > 0) {
                const actorIds = [...new Set(basic.data.map(n => n.actor_id).filter(Boolean))];
                if (actorIds.length > 0) {
                    const { data: users } = await supabase.from('users').select('id, nickname, avatar_url').in('id', actorIds);
                    const userMap = {};
                    users?.forEach(u => userMap[u.id] = u);
                    const enriched = basic.data.map(n => ({ ...n, actor: n.actor_id ? userMap[n.actor_id] : null }));
                    return res.status(200).json(enriched);
                }
            }
            return res.status(200).json(basic.data || []);
        }

        return res.status(200).json(data);
    } catch (err) {
        console.error('[NotificationController] Error in getMyNotifications:', err);
        return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        const notificationId = req.params.id;

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId)
            .eq('user_id', userId);

        if (error) throw error;
        return res.status(200).json({ message: 'Marked as read' });
    } catch (err) {
        console.error('[NotificationController] Error in markAsRead:', err);
        return res.status(500).json({ error: 'Failed to mark as read' });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false);

        if (error) throw error;
        return res.status(200).json({ message: 'All marked as read' });
    } catch (err) {
        console.error('[NotificationController] Error in markAllAsRead:', err);
        return res.status(500).json({ error: 'Failed to mark all as read' });
    }
};

export const createNotificationEndpoint = async (req, res) => {
    try {
        const { targetUserId, type, message, link } = req.body;
        const actorId = req.user.userId;

        if (!targetUserId || !type || !message) {
            return res.status(400).json({ error: 'Faltan parámetros requeridos (targetUserId, type, message)' });
        }

        const data = await createNotification({
            userId: targetUserId,
            actorId,
            type,
            title: 'Notificación',
            message,
            link
        });

        if (!data) {
            return res.status(500).json({ error: 'Error al insertar notificación en BD o regla de autoprevención.' });
        }

        return res.status(201).json({ success: true, notification: data });
    } catch (err) {
        console.error('[NotificationController] Error in createNotificationEndpoint:', err);
        return res.status(500).json({ error: 'Failed to create notification via HTTP' });
    }
};

// Dedicated endpoint: resolve collaborator emails -> IDs server-side (Service Role bypasses RLS) and notify them
export const collabInviteNotification = async (req, res) => {
    try {
        const { collaboratorEmails, productName } = req.body;
        const actorId = req.user.userId;

        if (!collaboratorEmails || !Array.isArray(collaboratorEmails) || collaboratorEmails.length === 0) {
            return res.status(400).json({ error: 'collaboratorEmails array is required' });
        }

        const results = [];

        for (const email of collaboratorEmails) {
            if (!email || !email.includes('@')) continue;

            // Service Role client bypasses RLS - can read any user's email
            const { data: targetUser, error: lookupError } = await supabase
                .from('users')
                .select('id')
                .eq('email', email.toLowerCase().trim())
                .maybeSingle();

            if (lookupError) {
                console.warn(`[NotificationController] Could not lookup user for email ${email}:`, lookupError.message);
                results.push({ email, status: 'error', reason: lookupError.message });
                continue;
            }

            if (!targetUser) {
                console.warn(`[NotificationController] No registered user found for email: ${email}`);
                results.push({ email, status: 'not_found' });
                continue;
            }

            // Don't notify yourself
            if (targetUser.id === actorId) {
                results.push({ email, status: 'skipped_self' });
                continue;
            }

            await createNotification({
                userId: targetUser.id,
                actorId,
                type: 'collab_invite',
                title: 'Invitación de Colaboración',
                message: `Has sido invitado a colaborar en <strong>${productName || 'un producto'}</strong>.`,
                link: `/dashboard/collaborations`
            });

            results.push({ email, status: 'sent', userId: targetUser.id });
        }

        console.log('[NotificationController] Collab invite notification results:', results);
        return res.status(200).json({ success: true, results });
    } catch (err) {
        console.error('[NotificationController] Error in collabInviteNotification:', err);
        return res.status(500).json({ error: 'Failed to send collab invite notifications' });
    }
};
