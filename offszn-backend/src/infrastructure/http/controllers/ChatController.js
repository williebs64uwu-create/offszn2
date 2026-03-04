import { supabase } from '../../database/connection.js';
import { createNotification } from './NotificationController.js';

export const getConversations = async (req, res) => {
    try {
        const userId = req.user.userId;

        // 1. Get conversation IDs where the user is a participant
        const { data: participations, error: partError } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', userId);

        if (partError) throw partError;
        if (!participations?.length) return res.status(200).json([]);

        const convIds = participations.map(p => p.conversation_id);

        // 2. Get conversation details and all participants
        const { data: conversations, error } = await supabase
            .from('conversations')
            .select(`
                *,
                conversation_participants(user_id, users(id, nickname, avatar_url))
            `)
            .in('id', convIds)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        // 3. Resolve user profiles and fetch last messages manually (no last_message column)
        const formatted = await Promise.all(conversations.map(async (c) => {
            let name = c.group_name;
            let avatar = c.group_avatar_url;
            let otherUserId = null;

            if (!c.is_group) {
                const otherP = c.conversation_participants.find(p => p.user_id !== userId);
                let otherUser = otherP?.users;

                if (!otherUser && otherP?.user_id) {
                    const { data: fetchedUser } = await supabase
                        .from('users')
                        .select('id, nickname, avatar_url')
                        .eq('id', otherP.user_id)
                        .single();
                    if (fetchedUser) otherUser = fetchedUser;
                }

                if (otherUser) {
                    name = otherUser.nickname;
                    avatar = otherUser.avatar_url;
                    otherUserId = otherUser.id;
                } else {
                    name = 'Usuario Desconocido';
                }
            }

            // Fetch last message from messages table
            const { data: lastMsg } = await supabase
                .from('messages')
                .select('content, type, created_at')
                .eq('conversation_id', c.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            return {
                id: c.id,
                isGroup: c.is_group,
                name: name,
                avatar: avatar,
                otherUserId: otherUserId,
                lastMessage: lastMsg?.content || (lastMsg?.type === 'image' ? '📷 Imagen' : 'Inicia la conversación'),
                time: lastMsg?.created_at || c.updated_at,
                unread: false
            };
        }));

        res.status(200).json(formatted);
    } catch (err) {
        console.error("Error getConversations:", err);
        res.status(500).json({ error: 'Error al cargar conversaciones' });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;

        const { data: messages, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:users(nickname, avatar_url),
                parent:messages!reply_to_id(id, content, sender:users(nickname, avatar_url)),
                message_reactions(*)
            `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        res.status(200).json(messages);
    } catch (err) {
        console.error("Error getMessages:", err);
        res.status(500).json({ error: 'Error al cargar mensajes' });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { conversationId, content, type = 'text', mediaUrl, replyToId } = req.body;

        if (!conversationId || (!content && !mediaUrl)) {
            return res.status(400).json({ error: 'Faltan datos' });
        }

        const { data: msg, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: userId,
                content: content || '',
                type: type,
                media_url: mediaUrl,
                reply_to_id: replyToId
            })
            .select(`
                *,
                sender:users(nickname, avatar_url),
                parent:messages!reply_to_id(id, content, sender:users(nickname, avatar_url)),
                message_reactions(*)
            `)
            .single();

        if (error) throw error;

        // Update updated_at only, as last_message column is missing
        await supabase
            .from('conversations')
            .update({
                updated_at: new Date()
            })
            .eq('id', conversationId);

        // Fetch participants for notifications
        const { data: participants } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conversationId)
            .neq('user_id', userId);

        if (participants?.length) {
            const { data: sender } = await supabase.from('users').select('nickname').eq('id', userId).single();
            const senderName = sender?.nickname || 'Alguien';

            for (const p of participants) {
                await createNotification({
                    userId: p.user_id,
                    actorId: userId,
                    type: 'new_message',
                    message: `Tienes un nuevo mensaje de <strong>${senderName}</strong>.`,
                    link: `/messages/${conversationId}`
                });
            }
        }

        res.status(201).json(msg);
    } catch (err) {
        console.error("Error sendMessage:", err);
        res.status(500).json({ error: 'Error al enviar mensaje' });
    }
};

export const startConversation = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { targetUserId } = req.body;

        if (!targetUserId) return res.status(400).json({ error: 'ID de usuario requerido' });

        // Check if a 1v1 conversation already exists
        const { data: myParticipations } = await supabase.from('conversation_participants').select('conversation_id').eq('user_id', userId);

        let existingId = null;
        if (myParticipations?.length) {
            const myConvIds = myParticipations.map(p => p.conversation_id);
            const { data: common } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', targetUserId)
                .in('conversation_id', myConvIds);

            if (common?.length) {
                // Verify it's not a group
                const { data: conv } = await supabase
                    .from('conversations')
                    .select('id, is_group')
                    .in('id', common.map(c => c.conversation_id))
                    .eq('is_group', false)
                    .maybeSingle();

                if (conv) existingId = conv.id;
            }
        }

        if (existingId) {
            return res.status(200).json({ id: existingId, message: 'Conversación existente' });
        }

        const { data: newConv, error: convError } = await supabase
            .from('conversations')
            .insert({
                is_group: false
                // last_message column removed
            })
            .select()
            .single();

        if (convError) throw convError;

        await supabase.from('conversation_participants').insert([
            { conversation_id: newConv.id, user_id: userId },
            { conversation_id: newConv.id, user_id: targetUserId }
        ]);

        res.status(201).json({ id: newConv.id, message: 'Conversación creada' });
    } catch (err) {
        console.error("Error startConversation:", err);
        res.status(500).json({ error: 'Error al iniciar chat' });
    }
};

export const createGroup = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, avatarUrl, participantIds } = req.body;

        if (!name) return res.status(400).json({ error: 'Nombre del grupo requerido' });
        if (!participantIds || !participantIds.length) return res.status(400).json({ error: 'Se requieren integrantes' });

        // 1. Create conversation record
        const { data: conv, error: convErr } = await supabase
            .from('conversations')
            .insert({
                is_group: true,
                group_name: name,
                group_avatar_url: avatarUrl || null
                // last_message column removed
            })
            .select()
            .single();

        if (convErr) throw convErr;

        // 2. Prepare participants list (current user + selected users)
        const participants = [
            { conversation_id: conv.id, user_id: userId },
            ...participantIds.map(id => ({ conversation_id: conv.id, user_id: id }))
        ];

        const { error: partErr } = await supabase
            .from('conversation_participants')
            .insert(participants);

        if (partErr) throw partErr;

        res.status(201).json(conv);
    } catch (err) {
        console.error("Error createGroup:", err);
        res.status(500).json({ error: 'Error al crear grupo' });
    }
};

export const getMessageById = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { data: msg, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:users(id, nickname, avatar_url),
                parent:messages!reply_to_id(id, content, sender:users(id, nickname, avatar_url)),
                message_reactions(*)
            `)
            .eq('id', messageId)
            .single();

        if (error) throw error;
        res.status(200).json(msg);
    } catch (err) {
        console.error("Error getMessageById:", err);
        res.status(500).json({ error: 'Error al cargar mensaje' });
    }
};

export const toggleReaction = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { messageId, emoji } = req.body;

        if (!messageId || !emoji) return res.status(400).json({ error: 'Faltan datos' });

        const { data: existing } = await supabase
            .from('message_reactions')
            .select('*')
            .eq('message_id', messageId)
            .eq('user_id', userId)
            .maybeSingle();

        if (existing && existing.emoji === emoji) {
            await supabase
                .from('message_reactions')
                .delete()
                .eq('id', existing.id);
            return res.status(200).json({ action: 'deleted', id: existing.id });
        } else if (existing) {
            const { data: updated } = await supabase
                .from('message_reactions')
                .update({ emoji })
                .eq('id', existing.id)
                .select()
                .single();
            return res.status(200).json({ action: 'updated', data: updated });
        } else {
            const { data: created } = await supabase
                .from('message_reactions')
                .insert({
                    message_id: messageId,
                    user_id: userId,
                    emoji
                })
                .select()
                .single();
            return res.status(201).json({ action: 'created', data: created });
        }
    } catch (err) {
        console.error("Error toggleReaction:", err);
        res.status(500).json({ error: 'Error al procesar reacción' });
    }
};
