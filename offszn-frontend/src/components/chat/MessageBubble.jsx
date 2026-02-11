import React from 'react';
import { useAuth } from '../../store/authStore';
import { useChatStore } from '../../store/useChatStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Reply, Smile } from 'lucide-react';

const MessageBubble = ({ message, onReply }) => {
    const { user } = useAuth();
    const isMe = message.sender_id === user?.id;

    const renderAvatar = (url, name) => {
        if (url) {
            return <img src={url} alt={name} className="w-full h-full object-cover rounded-full" />;
        }
        const initial = name?.charAt(0).toUpperCase() || '?';
        return (
            <div className="w-full h-full flex items-center justify-center bg-[#333] text-white font-bold rounded-full text-[10px]">
                {initial}
            </div>
        );
    };

    const formatTime = (dateStr) => {
        try {
            return format(new Date(dateStr), 'HH:mm', { locale: es });
        } catch (e) {
            return '';
        }
    };

    return (
        <div className={`flex flex-col mb-4 group px-4 ${isMe ? 'items-end' : 'items-start'}`}>
            <div className={`flex max-w-[85%] md:max-w-[70%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>

                {/* Avatar (only for received) */}
                {!isMe && (
                    <div className="w-7 h-7 flex-shrink-0 self-end mb-1">
                        {/* Note: we might need to fetch the sender's avatar if not in the message object */}
                        {renderAvatar(message.sender?.avatar_url, message.sender?.nickname)}
                    </div>
                )}

                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>

                    {/* Reply Context */}
                    {message.parent && (
                        <div
                            className={`mb-[-10px] scale-95 origin-bottom opacity-60 flex flex-col gap-1 p-3 pb-5 rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden max-w-full cursor-pointer hover:opacity-100 transition-opacity ${isMe ? 'items-end rounded-br-none' : 'items-start rounded-bl-none'
                                }`}
                            onClick={() => {
                                const el = document.getElementById(`msg-${message.parent.id}`);
                                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                el?.classList.add('animate-pulse', 'bg-purple-900/30');
                                setTimeout(() => el?.classList.remove('animate-pulse', 'bg-purple-900/30'), 2000);
                            }}
                        >
                            <p className="text-[10px] font-bold text-gray-300">
                                {message.parent.sender_id === user?.id ? 'Tú' : (message.parent.sender?.nickname || 'Usuario')}
                            </p>
                            <p className="text-xs text-gray-400 truncate w-full italic">
                                {message.parent.content || '📷 Foto'}
                            </p>
                        </div>
                    )}

                    {/* Main Bubble */}
                    <div className="relative flex items-center gap-2 group/bubble">

                        {/* Hover Actions (Sent) */}
                        {isMe && (
                            <div className="flex gap-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onReply(message)}
                                    className="p-1.5 hover:bg-[#1a1a1a] rounded-full text-gray-500 hover:text-white transition-colors"
                                >
                                    <Reply size={14} />
                                </button>
                            </div>
                        )}

                        <div
                            id={`msg-${message.id}`}
                            className={`p-3 px-4 rounded-3xl text-sm leading-relaxed break-words shadow-sm ${isMe
                                    ? 'bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] text-white rounded-br-none'
                                    : 'bg-[#262626] text-white rounded-bl-none'
                                }`}
                        >
                            {message.content}
                        </div>

                        {/* Hover Actions (Received) */}
                        {!isMe && (
                            <div className="flex gap-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onReply(message)}
                                    className="p-1.5 hover:bg-[#1a1a1a] rounded-full text-gray-500 hover:text-white transition-colors"
                                >
                                    <Reply size={14} />
                                </button>
                                <button className="p-1.5 hover:bg-[#1a1a1a] rounded-full text-gray-500 hover:text-white transition-colors">
                                    <Smile size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Time & Reactions */}
                    <div className={`mt-1 flex items-center gap-2 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-[10px] text-gray-500 uppercase tracking-tighter">
                            {formatTime(message.created_at)}
                        </span>

                        {/* Reactions Overlay */}
                        {message.message_reactions?.length > 0 && (
                            <div className="flex -space-x-1">
                                {message.message_reactions.map((react, i) => (
                                    <span key={i} className="text-xs bg-[#1a1a1a] border border-[#262626] rounded-full px-1 py-0.5">
                                        {react.emoji}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
