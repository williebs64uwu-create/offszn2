import { create } from 'zustand';
import { supabase, apiClient } from '../api/client';
import toast from 'react-hot-toast';

export const formatTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (d.toDateString() === new Date().toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return `${d.getDate()}/${d.getMonth() + 1}`;
};

export const getAvatarUrl = (url, name) => {
    if (!url || url.includes('via.placeholder.com')) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=333&color=fff&size=512`;
    }
    return url;
};

export const useChatStore = create((set, get) => ({
    // UI States
    activeTab: 'principal',
    searchQuery: '',
    isNewChatModalOpen: false,
    isGroupModalOpen: false,
    activeConvId: null,
    activeChatData: null,
    messageInput: '',
    replyToMessage: null,
    activeMenuId: null,
    pinnedChats: JSON.parse(localStorage.getItem('offszn_pinned_chats') || '[]'),

    // Data States
    conversations: [],
    messages: {},
    isLoadingConversations: false,

    // Search States
    modalSearchQuery: '',
    modalSearchResults: [],
    isSearchingUsers: false,

    // Setters
    setIsNewChatModalOpen: (isOpen) => set({ isNewChatModalOpen: isOpen, modalSearchQuery: '', modalSearchResults: [] }),
    setIsGroupModalOpen: (isOpen) => set({ isGroupModalOpen: isOpen }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setSearchQuery: (q) => set({ searchQuery: q }),
    setMessageInput: (input) => set({ messageInput: input }),
    setActiveConvId: (id) => set({ activeConvId: id }),
    setReplyToMessage: (msg) => set({ replyToMessage: msg }),
    setActiveMenuId: (id) => set({ activeMenuId: id }),

    // Fetches
    fetchConversations: async (userId, isSilent = false) => {
        if (!userId) return;

        // Si no es silencioso y ya está cargando, evitamos doble llamada
        if (!isSilent && get().isLoadingConversations) return;

        // Solo mostramos Skeletons si NO es una recarga silenciosa
        if (!isSilent) set({ isLoadingConversations: true });

        try {
            const res = await apiClient.get('/chat/conversations');
            const data = res.data || [];

            const formatted = data.map(c => ({
                id: c.id,
                isGroup: c.isGroup,
                name: c.name,
                avatar: c.avatar,
                targetUserId: c.otherUserId,
                updatedAt: c.time,
                preview: c.lastMessage || 'Empieza conversación'
            })).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

            set(state => ({
                conversations: formatted,
                // Apagamos la carga solo si nosotros la encendimos
                isLoadingConversations: isSilent ? state.isLoadingConversations : false
            }));
        } catch (err) {
            console.error("Error fetching conversations:", err);
            set({ isLoadingConversations: false });
        }
    },

    openConversation: async (conv) => {
        set({ activeConvId: conv.id, activeChatData: conv, replyToMessage: null });

        try {
            // Use backend API to get messages - FIX PATH
            const res = await apiClient.get(`/chat/conversations/${conv.id}/messages`);
            const data = res.data || [];

            set(state => ({
                messages: { ...state.messages, [conv.id]: data || [] }
            }));
        } catch (err) {
            console.error("Error loading messages:", err);
        }
    },

    silentRefreshActiveChat: async () => {
        const { activeConvId } = get();
        if (!activeConvId) return; // Si no hay chat abierto, no hacemos nada

        try {
            const res = await apiClient.get(`/chat/conversations/${activeConvId}/messages`);
            const data = res.data || [];

            set(state => ({
                messages: { ...state.messages, [activeConvId]: data }
            }));
        } catch (err) {
            console.error("Error refreshing chat silently:", err);
        }
    },

    refreshSingleMessage: async (messageId) => {
        if (!messageId) return;
        try {
            const res = await apiClient.get(`/chat/messages/${messageId}`);
            const updatedMsg = res.data;

            if (updatedMsg) {
                set(state => {
                    const cid = updatedMsg.conversation_id;
                    const allMsgs = { ...state.messages };

                    if (allMsgs[cid]) {
                        const convMsgs = [...allMsgs[cid]];
                        const idx = convMsgs.findIndex(m => String(m.id) === String(messageId));
                        if (idx >= 0) {
                            convMsgs[idx] = updatedMsg;
                            allMsgs[cid] = convMsgs;
                            return { messages: allMsgs };
                        }
                    }
                    return state;
                });
            }
        } catch (err) {
            console.error("Error surgical refreshing message:", err);
        }
    },

    sendMessage: async (user) => {
        const { messageInput, activeConvId, replyToMessage } = get();
        if (!messageInput.trim() || !activeConvId || !user) return;

        const content = messageInput.trim();
        const replyId = replyToMessage?.id || null;
        set({ messageInput: '', replyToMessage: null });

        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        const optMsg = {
            id: tempId,
            conversation_id: activeConvId,
            sender_id: user.id,
            content,
            created_at: new Date().toISOString(),
            sender: { nickname: user.nickname, avatar_url: user.avatar_url },
            reply_to_id: replyId, // <--- ESTO ES NUEVO E IMPORTANTE
            parent: replyToMessage
        };

        set(state => ({
            messages: {
                ...state.messages,
                [activeConvId]: [...(state.messages[activeConvId] || []), optMsg]
            }
        }));

        try {
            // Use backend API to send message - FIX PATH
            const res = await apiClient.post('/chat/messages', {
                conversationId: activeConvId,
                content: content,
                replyToId: replyId
            });

            const data = res.data;
            if (data) {
                // Ensure parent context is preserved
                const confirmedMsg = {
                    ...data,
                    parent: data.parent || replyToMessage
                };

                set(state => ({
                    messages: {
                        ...state.messages,
                        [activeConvId]: state.messages[activeConvId].map(m => m.id === tempId ? confirmedMsg : m)
                    },
                    conversations: state.conversations.map(c =>
                        c.id === activeConvId ? { ...c, preview: content, updatedAt: data.created_at } : c
                    ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                }));
            }
        } catch (err) {
            toast.error("Error al enviar mensaje");
            set(state => ({
                messages: {
                    ...state.messages,
                    [activeConvId]: state.messages[activeConvId].filter(m => m.id !== tempId)
                }
            }));
        }
    },

    startNewChat: async (targetUser, currentUser) => {
        if (!targetUser || !currentUser) return;
        set({ isNewChatModalOpen: false });

        try {
            // Use backend API to start/get conversation
            const res = await apiClient.post('/chat/start', {
                targetUserId: targetUser.id
            });

            const { id, message } = res.data;

            // Refresh conversation list and open it
            await get().fetchConversations(currentUser.id);
            const conv = get().conversations.find(c => c.id === id);

            if (conv) {
                get().openConversation(conv);
            } else {
                // Fallback for new chats that might not be in the list yet
                get().openConversation({
                    id: id,
                    name: targetUser.nickname,
                    avatar: targetUser.avatar_url,
                    isGroup: false,
                    targetUserId: targetUser.id
                });
            }
        } catch (err) {
            console.error("Error starting chat:", err);
            toast.error("Error al iniciar chat");
        }
    },

    handleReaction: async (msgId, emoji, user) => {
        if (!user) return;
        const { activeConvId } = get();

        // Optimistic local update
        set(state => {
            const msgs = [...(state.messages[activeConvId] || [])];
            const msgIdx = msgs.findIndex(m => String(m.id) === String(msgId));
            if (msgIdx === -1) return state;

            const msg = { ...msgs[msgIdx] };
            let reactions = [...(msg.message_reactions || [])];
            const rIdx = reactions.findIndex(r => String(r.user_id) === String(user.id));

            if (rIdx >= 0) {
                if (reactions[rIdx].emoji === emoji) reactions.splice(rIdx, 1);
                else reactions[rIdx] = { ...reactions[rIdx], emoji };
            } else {
                reactions.push({ user_id: user.id, emoji, message_id: msgId });
            }

            msg.message_reactions = reactions;
            msgs[msgIdx] = msg;
            return { messages: { ...state.messages, [activeConvId]: msgs } };
        });

        try {
            await apiClient.post('/chat/reactions', { messageId: msgId, emoji });
        } catch (err) {
            console.error("Error toggleReaction:", err);
            toast.error("Error al procesar reacción");
            get().silentRefreshActiveChat(); // Revert local update on err
        }
    },


    handleModalSearchChange: async (e, userId) => {
        const val = e.target.value;
        set({ modalSearchQuery: val });
        if (!val.trim()) {
            set({ modalSearchResults: [] });
            return;
        }

        set({ isSearchingUsers: true });
        const { data } = await supabase.from('users')
            .select('id, nickname, avatar_url')
            .ilike('nickname', `%${val}%`)
            .neq('id', userId)
            .limit(10);

        set({ modalSearchResults: data || [], isSearchingUsers: false });
    },

    togglePinChat: (e, convId) => {
        e?.stopPropagation();
        const { pinnedChats } = get();
        let currentPinned = [...pinnedChats];

        if (currentPinned.includes(convId)) {
            currentPinned = currentPinned.filter(id => id !== convId);
        } else {
            if (currentPinned.length >= 3) {
                toast.error("Máximo 3 chats fijados");
                return;
            }
            currentPinned.push(convId);
        }
        set({ pinnedChats: currentPinned, activeMenuId: null });
        localStorage.setItem('offszn_pinned_chats', JSON.stringify(currentPinned));
    },

    getDisplayedChats: () => {
        const { conversations, activeTab, searchQuery, pinnedChats } = get();
        return conversations
            .filter(c => (activeTab === 'grupos' ? c.isGroup : !c.isGroup))
            .filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => {
                const aPinned = pinnedChats.includes(a.id);
                const bPinned = pinnedChats.includes(b.id);
                if (aPinned && !bPinned) return -1;
                if (!aPinned && bPinned) return 1;
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            });
    },

    setupRealtime: (userId) => {
        if (!userId) return;

        // Canal único para evitar ruidos de otras suscripciones
        const channel = supabase
            .channel(`chat_sync_${userId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                async (payload) => {
                    // 1. CORRECCIÓN: Agregamos eventType aquí
                    const { eventType, new: newMsg } = payload;
                    const activeConvId = get().activeConvId;

                    // NOTA: Borramos el fetchConversations que estaba aquí suelto y causaba los skeletons

                    if (eventType === 'INSERT') {
                        // 2. CORRECCIÓN: Esta es la única recarga que debe ocurrir, y es silenciosa (true)
                        get().fetchConversations(userId, true);

                        if (activeConvId === newMsg.conversation_id) {
                            const currentMsgs = get().messages[activeConvId] || [];

                            // Evitar duplicados del mensaje optimista local
                            if (currentMsgs.find(m => String(m.id) === String(newMsg.id) && !String(m.id).startsWith('temp-'))) return;

                            try {
                                const res = await apiClient.get(`/chat/messages/${newMsg.id}`);
                                const fullMsg = res.data;

                                if (fullMsg) {
                                    set(state => {
                                        const msgs = [...(state.messages[activeConvId] || [])];

                                        const tempIdx = msgs.findIndex(m =>
                                            String(m.id).startsWith('temp-') &&
                                            m.content === fullMsg.content &&
                                            m.sender_id === fullMsg.sender_id
                                        );

                                        if (tempIdx >= 0) {
                                            // Defendemos el mensaje padre (Corrección de respuestas)
                                            const isValidParent = fullMsg.parent && (Array.isArray(fullMsg.parent) ? fullMsg.parent.length > 0 : Object.keys(fullMsg.parent).length > 0);
                                            msgs[tempIdx] = {
                                                ...fullMsg,
                                                parent: isValidParent ? fullMsg.parent : msgs[tempIdx].parent
                                            };
                                        } else if (!msgs.find(m => String(m.id) === String(fullMsg.id))) {
                                            msgs.push(fullMsg);
                                        }

                                        return {
                                            messages: { ...state.messages, [activeConvId]: msgs }
                                        };
                                    });
                                }
                            } catch (err) {
                                console.error("Error al sincronizar mensaje en tiempo real:", err);
                            }
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'message_reactions' },
                () => {
                    // ¡A la basura la lógica manual compleja!
                    // Si alguien reacciona, simplemente recargamos el chat actual en silencio.
                    // 100% garantizado, a prueba de bugs.
                    get().silentRefreshActiveChat();
                }
            )
            .subscribe(); // Asegúrate de no borrar el subscribe() que está al final

        return () => {
            supabase.removeChannel(channel);
        };
    }
}));