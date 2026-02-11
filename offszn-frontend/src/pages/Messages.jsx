import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { useChatStore } from '../store/useChatStore';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatFeed from '../components/chat/ChatFeed';
import ChatInput from '../components/chat/ChatInput';
import { supabase } from '../api/client';
import { MessageSquare } from 'lucide-react';

const Messages = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const {
        activeConversationId,
        setActiveConversationId,
        fetchConversations,
        handleRealtimeMessage
    } = useChatStore();

    const channelRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchConversations(user.id);

            // Handle query params (?user=nickname or ?convId=uuid)
            const convId = searchParams.get('convId');
            if (convId) {
                setActiveConversationId(convId);
            }
        }
    }, [user, searchParams]);

    useEffect(() => {
        if (!user) return;

        // Realtime subscription for ALL messages for this user's conversations
        // (Simplified: sub to all message inserts, filter in store)
        const channel = supabase
            .channel('global-chat')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    handleRealtimeMessage(payload);
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-black text-white">
                <div className="text-center">
                    <MessageSquare size={48} className="mx-auto mb-4 text-gray-700" />
                    <h2 className="text-xl font-bold">Inicia sesión para ver tus mensajes</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-80px)] bg-black overflow-hidden border-t border-[#262626]">
            {/* Sidebar - Always visible on desktop, hidden on mobile if chat is active */}
            <div className={`w-full md:w-[350px] border-r border-[#262626] ${activeConversationId ? 'hidden md:block' : 'block'}`}>
                <ChatSidebar />
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col bg-black min-w-0 ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
                {activeConversationId ? (
                    <>
                        <ChatFeed />
                        <ChatInput />
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-white p-8">
                        <div className="w-24 h-24 rounded-full border-2 border-white flex items-center justify-center mb-6">
                            <MessageSquare size={40} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Tus Mensajes</h2>
                        <p className="text-gray-400 text-center max-w-xs">
                            Envía fotos y mensajes privados a tus productores y colaboradores favoritos.
                        </p>
                        <button className="mt-6 bg-[#7c3aed] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#6d28d9] transition-colors">
                            Enviar mensaje
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
