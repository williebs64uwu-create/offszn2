import { supabase } from '../../database/connection.js';

export const getConversations = async (req, res) => {
    try {
        const userId = req.user.userId;

        const { data: conversations, error } = await supabase
            .from('conversations')
            .select(`
                *,
                p1:users!conversations_participant_1_fkey (id, nickname, first_name, last_name, avatar_url),
                p2:users!conversations_participant_2_fkey (id, nickname, first_name, last_name, avatar_url)
            `)
            .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        const formatted = conversations.map(c => {
            const otherUser = c.participant_1 === userId ? c.p2 : c.p1;
            const otherUserData = otherUser || { nickname: 'Usuario Desconocido' };

            return {
                id: c.id,
                name: otherUserData.nickname || `${otherUserData.first_name || ''} ${otherUserData.last_name || ''}`.trim(),
                avatar: otherUserData.avatar_url || null,
                otherUserId: otherUserData.id,
                lastMessage: c.last_message || 'Inicia la conversación',
                time: c.updated_at,
                unread: false
            };
        });

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
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        const formatted = messages.map(m => ({
            id: m.id,
            senderId: m.sender_id,
            content: m.content,
            type: m.type,
            mediaUrl: m.media_url,
            createdAt: m.created_at
        }));

        res.status(200).json(formatted);
    } catch (err) {
        console.error("Error getMessages:", err);
        res.status(500).json({ error: 'Error al cargar mensajes' });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { conversationId, content, type = 'text', mediaUrl } = req.body;

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
                media_url: mediaUrl
            })
            .select()
            .single();

        if (error) throw error;

        await supabase
            .from('conversations')
            .update({
                last_message: type === 'text' ? content : `Envió un ${type}`,
                updated_at: new Date()
            })
            .eq('id', conversationId);

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

        const { data: existing } = await supabase
            .from('conversations')
            .select('id')
            .or(`and(participant_1.eq.${userId},participant_2.eq.${targetUserId}),and(participant_1.eq.${targetUserId},participant_2.eq.${userId})`)
            .maybeSingle();

        if (existing) {
            return res.status(200).json({ id: existing.id, message: 'Conversación existente' });
        }

        const { data: newConv, error } = await supabase
            .from('conversations')
            .insert({
                participant_1: userId,
                participant_2: targetUserId,
                last_message: 'Nueva conversación iniciada'
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ id: newConv.id, message: 'Conversación creada' });
    } catch (err) {
        console.error("Error startConversation:", err);
        res.status(500).json({ error: 'Error al iniciar chat' });
    }
};
