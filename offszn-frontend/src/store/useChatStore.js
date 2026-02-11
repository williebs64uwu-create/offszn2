import { create } from 'zustand';
import { supabase } from '../api/client';

export const useChatStore = create((set, get) => ({
    conversations: [],
    messages: {}, // { conversationId: [messages] }
    activeConversationId: null,
    loading: false,
    replyToId: null,

    // --- ACTIONS ---

    setConversations: (conversations) => set({ conversations }),
    setActiveConversationId: (id) => set({ activeConversationId: id, replyToId: null }),
    setReplyToId: (id) => set({ replyToId: id }),

    fetchConversations: async (userId) => {
        if (!userId) return;
        set({ loading: true });

        try {
            // 1. Get participations
            const { data: participations } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', userId);

            if (!participations?.length) {
                set({ conversations: [], loading: false });
                return;
            }

            const conversationIds = participations.map(p => p.conversation_id);

            // 2. Get other participants and their profiles
            const { data: allParticipants } = await supabase
                .from('conversation_participants')
                .select('conversation_id, user_id')
                .in('conversation_id', conversationIds)
                .neq('user_id', userId);

            const otherUserIds = [...new Set(allParticipants.map(p => p.user_id))];
            const { data: profiles } = await supabase
                .from('users')
                .select('id, nickname, avatar_url, role, is_producer, socials')
                .in('id', otherUserIds);

            const profileMap = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

            // 3. Get last messages
            const lastMsgsPromises = conversationIds.map(cid =>
                supabase.from('messages')
                    .select('content, attachment_url, created_at')
                    .eq('conversation_id', cid)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()
            );
            const lastMsgResults = await Promise.all(lastMsgsPromises);
            const lastMsgMap = lastMsgResults.reduce((acc, res, idx) => {
                if (res.data) acc[conversationIds[idx]] = res.data;
                return acc;
            }, {});

            // 4. Get conversation metadata
            const { data: conversationsMetadata } = await supabase
                .from('conversations')
                .select('*')
                .in('id', conversationIds)
                .order('updated_at', { ascending: false });

            // 5. Assemble
            const formattedChats = conversationsMetadata.map(conv => {
                const otherParticipancy = allParticipants.find(p => p.conversation_id === conv.id);
                const profile = otherParticipancy ? profileMap[otherParticipancy.user_id] : null;
                const lastMsgObj = lastMsgMap[conv.id];

                return {
                    id: conv.id,
                    otherUser: profile || { nickname: 'Usuario', id: otherParticipancy?.user_id },
                    lastMessage: lastMsgObj ? (lastMsgObj.content || '📷 Foto') : 'Empezar conversación',
                    updatedAt: lastMsgObj?.created_at || conv.updated_at,
                    unreadCount: 0 // Fetch real unread count if needed later
                };
            });

            set({ conversations: formattedChats, loading: false });
        } catch (error) {
            console.error('Error fetching conversations:', error);
            set({ loading: false });
        }
    },

    fetchMessages: async (conversationId) => {
        if (!conversationId) return;

        try {
            const { data: messages } = await supabase
                .from('messages')
                .select(`
          *, 
          message_reactions(user_id, emoji),
          parent:messages!reply_to_id(
            content, 
            sender_id, 
            attachment_type,
            sender:users!sender_id(nickname)
          )
        `)
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            set((state) => ({
                messages: {
                    ...state.messages,
                    [conversationId]: messages || []
                }
            }));
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    },

    sendMessage: async (conversationId, senderId, content, replyToId = null) => {
        if (!content.trim() && !replyToId) return;

        const newMessage = {
            conversation_id: conversationId,
            sender_id: senderId,
            content,
            reply_to_id: replyToId,
            created_at: new Date().toISOString(),
            status: 'sending' // Optimistic state
        };

        // Optimistic Update
        set((state) => ({
            messages: {
                ...state.messages,
                [conversationId]: [...(state.messages[conversationId] || []), { ...newMessage, id: `temp-${Date.now()}` }]
            }
        }));

        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: senderId,
                    content,
                    reply_to_id: replyToId
                })
                .select(`
          *, 
          parent:messages!reply_to_id(
            content, 
            sender_id, 
            attachment_type,
            sender:users!sender_id(nickname)
          )
        `)
                .single();

            if (error) throw error;

            // Replace optimistic message with real one
            set((state) => ({
                messages: {
                    ...state.messages,
                    [conversationId]: state.messages[conversationId].map(m =>
                        m.status === 'sending' && m.content === content ? data : m
                    )
                }
            }));

            // Update conversation's last message in list
            set((state) => ({
                conversations: state.conversations.map(c =>
                    c.id === conversationId
                        ? { ...c, lastMessage: content, updatedAt: data.created_at }
                        : c
                ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            }));

        } catch (error) {
            console.error('Error sending message:', error);
            // Mark as failed in UI if needed
        }
    },

    handleRealtimeMessage: (payload) => {
        const { new: newMsg, eventType } = payload;
        const { activeConversationId, conversations } = get();

        if (eventType === 'INSERT') {
            // 1. Add to messages if it's the active conversation
            if (newMsg.conversation_id === activeConversationId) {
                // Avoid duplicates (if we sent it, it's already there)
                set((state) => {
                    const chatMsgs = state.messages[newMsg.conversation_id] || [];
                    if (chatMsgs.find(m => m.id === newMsg.id)) return state;

                    return {
                        messages: {
                            ...state.messages,
                            [newMsg.conversation_id]: [...chatMsgs, newMsg]
                        }
                    };
                });
            }

            // 2. Update conversation list preview
            set((state) => ({
                conversations: state.conversations.map(c =>
                    c.id === newMsg.conversation_id
                        ? { ...c, lastMessage: newMsg.content || '📷 Foto', updatedAt: newMsg.created_at }
                        : c
                ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            }));
        }
    },

    handleRealtimeReaction: (payload) => {
        // Logic for live reactions
    },

    searchUsers: async (query, currentUserId) => {
        if (!query) return [];
        try {
            const { data: profiles, error } = await supabase
                .from('users')
                .select('id, nickname, avatar_url')
                .ilike('nickname', `%${query}%`)
                .neq('id', currentUserId)
                .limit(10);

            if (error) throw error;
            return profiles || [];
        } catch (error) {
            console.error('Error searching users:', error);
            return [];
        }
    },

    startNewChat: async (targetUser, currentUser) => {
        if (!targetUser || !currentUser || targetUser.id === currentUser.id) return;

        try {
            // 1. Check if conversation already exists
            const { data: participations } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', currentUser.id);

            if (participations?.length > 0) {
                const myConvIds = participations.map(p => p.conversation_id);
                const { data: commonParticipation } = await supabase
                    .from('conversation_participants')
                    .select('conversation_id')
                    .eq('user_id', targetUser.id)
                    .in('conversation_id', myConvIds)
                    .limit(1)
                    .maybeSingle();

                if (commonParticipation) {
                    get().setActiveConversationId(commonParticipation.conversation_id);
                    return commonParticipation.conversation_id;
                }
            }

            // 2. Create new conversation
            const { data: conv, error: convError } = await supabase
                .from('conversations')
                .insert({ is_group: false })
                .select()
                .single();

            if (convError) throw convError;

            await supabase.from('conversation_participants').insert([
                { conversation_id: conv.id, user_id: currentUser.id },
                { conversation_id: conv.id, user_id: targetUser.id }
            ]);

            // 3. Refresh list and set active
            await get().fetchConversations(currentUser.id);
            get().setActiveConversationId(conv.id);
            return conv.id;

        } catch (error) {
            console.error('Error starting new chat:', error);
        }
    }
}));
