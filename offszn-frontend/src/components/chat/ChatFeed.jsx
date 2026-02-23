import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useAuth } from '../../store/authStore';
import MessageBubble from './MessageBubble';
import { MoreVertical, Phone, Video, Info } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

const ChatFeed = () => {
    const { user } = useAuth();
    const {
        activeConversationId,
        conversations,
        messages,
        fetchMessages,
        setReplyToId
    } = useChatStore();

    const scrollRef = useRef(null);
    const activeChat = conversations.find(c => c.id === activeConversationId);
    const chatMessages = messages[activeConversationId] || [];

    useEffect(() => {
        if (activeConversationId) {
            fetchMessages(activeConversationId);
        }
    }, [activeConversationId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const renderDateHeader = (dateStr) => {
        return (
            <div className="flex justify-center my-6">
                <span className="bg-[#1a1a1a] text-gray-500 text-[10px] uppercase font-bold px-3 py-1 rounded-full border border-[#262626]">
                    {format(new Date(dateStr), 'd MMMM, yyyy', { locale: es })}
                </span>
            </div>
        );
    };

    const onReply = (msg) => {
        setReplyToId(msg.id);
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-black">
            {/* Header */}
            <div className="h-[70px] border-b border-[#262626] flex items-center justify-between px-4 md:px-10 flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 flex-shrink-0">
                        {activeChat?.otherUser.avatar_url ? (
                            <img src={activeChat.otherUser.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#333] text-white font-bold rounded-full">
                                {activeChat?.otherUser.nickname?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 leading-tight">
                        <h3
                            className="text-white font-bold text-sm truncate cursor-pointer hover:underline"
                            onClick={() => window.location.href = `/@${activeChat?.otherUser.nickname}`}
                        >
                            {activeChat?.otherUser.nickname}
                        </h3>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                            {activeChat?.otherUser.is_producer ? 'Productor Musical' : (activeChat?.otherUser.role || 'Usuario')}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-white">
                    <button className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors"><Info size={22} /></button>
                </div>
            </div>

            {/* Messages List */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto custom-scrollbar flex flex-col py-4"
            >
                {chatMessages.length > 0 ? (
                    chatMessages.map((msg, index) => {
                        const showDate = index === 0 || !isSameDay(new Date(msg.created_at), new Date(chatMessages[index - 1].created_at));

                        return (
                            <React.Fragment key={msg.id}>
                                {showDate && renderDateHeader(msg.created_at)}
                                <MessageBubble message={msg} onReply={onReply} />
                            </React.Fragment>
                        );
                    })
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 opacity-30 text-white">
                        <div className="w-20 h-20 rounded-full border-2 border-white flex items-center justify-center mb-4">
                            {activeChat?.otherUser.avatar_url ? (
                                <img src={activeChat.otherUser.avatar_url} alt="" className="w-full h-full object-cover rounded-full p-2" />
                            ) : (
                                <span className="text-3xl font-bold">{activeChat?.otherUser.nickname?.charAt(0)}</span>
                            )}
                        </div>
                        <p className="text-sm font-medium">No hay mensajes aún con {activeChat?.otherUser.nickname}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatFeed;
