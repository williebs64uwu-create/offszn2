import React from 'react';
import toast from 'react-hot-toast';
import { useChatStore, getAvatarUrl, formatTime } from '../../store/useChatStore';
import { useAuth } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function MessageBubble({ msg, isMine }) {
    const { user } = useAuth();
    // Importamos 'messages' y 'activeConvId' para buscar el padre localmente
    const { setReplyToMessage, handleReaction, messages, activeConvId } = useChatStore();
    const [showReactions, setShowReactions] = React.useState(false);

    // --- LA MAGIA CONTRA EL BUG DE LAS RESPUESTAS ---
    const activeMessages = messages[activeConvId] || [];

    // 1. Buscamos el mensaje original en nuestra memoria local
    let parentData = msg.reply_to_id
        ? activeMessages.find(m => String(m.id) === String(msg.reply_to_id))
        : null;

    // 2. Si es un mensaje muy viejo y no está cargado, usamos el del backend (evitando el bug del array)
    if (!parentData && msg.parent) {
        parentData = Array.isArray(msg.parent) ? null : msg.parent;
    }

    const hasParentQuote = !!parentData;
    const parentSender = parentData?.sender;

    const reactions = msg.message_reactions || [];

    const onCopy = () => {
        navigator.clipboard.writeText(msg.content);
        toast.success('Copiado');
    };

    return (
        <div className={`oz-message-row ${isMine ? 'sent' : 'received'} group mb-0.5 px-1 md:px-2`}>
            {!isMine && (
                <div className="oz-msg-avatar flex-shrink-0 self-end mb-1 mr-1 transition-opacity">
                    <img src={getAvatarUrl(msg.sender?.avatar_url, msg.sender?.nickname)} className="w-6 h-6 rounded-full border border-white/10" alt="" />
                </div>
            )}
            <div className={`oz-msg-body flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[90%] md:max-w-[85%]`}>

                {/* Reply Quote Corregido */}
                {hasParentQuote && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="reply-quote-container text-[11px] bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-t-xl rounded-bl-sm border-l-2 border-[#8b5cf6] mb-[-2px] z-0 opacity-50 hover:opacity-100 transition-opacity"
                    >
                        <span className="font-bold text-[#8b5cf6]">{parentSender?.nickname || 'Usuario'}</span>
                        <span className="truncate block max-w-[150px] md:max-w-[300px]">{parentData.content}</span>
                    </motion.div>
                )}

                <div className={`oz-msg-container relative flex items-center gap-1.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                    <motion.div whileHover={{ scale: 1.005 }} className="oz-bubble relative z-10">
                        <span className="block">{msg.content}</span>

                        {/* Reactions render */}
                        <AnimatePresence>
                            {reactions.length > 0 && (
                                <motion.div
                                    initial={{ scale: 0, y: 10 }}
                                    animate={{ scale: 1, y: 0 }}
                                    className="absolute -bottom-2 -right-1 bg-[#1a1a1a] rounded-full px-1.5 py-0.5 text-[9px] border border-white/10 shadow-lg flex gap-1 z-20"
                                >
                                    {Array.from(new Set(reactions.map(r => r.emoji))).slice(0, 3).map((emoji, i) => (
                                        <span key={i}>{emoji}</span>
                                    ))}
                                    {reactions.length > 1 && <span className="font-bold text-white/40">{reactions.length}</span>}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Quick Actions Panel */}
                    <div className={`oz-message-actions opacity-0 group-hover:opacity-100 transition-all flex items-center gap-0.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                        <button onClick={() => setReplyToMessage(msg)} title="Responder" className="w-7 h-7 flex items-center justify-center text-[#666] hover:text-white transition-colors rounded-full hover:bg-white/5">
                            <i className="bi bi-reply-fill text-sm"></i>
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setShowReactions(!showReactions)}
                                className={`w-7 h-7 flex items-center justify-center transition-colors rounded-full hover:bg-white/5 ${showReactions ? 'text-white' : 'text-[#666]'}`}
                            >
                                <i className="bi bi-emoji-smile text-sm"></i>
                            </button>
                            <AnimatePresence>
                                {showReactions && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                        className="absolute bottom-full mb-2 bg-[#111] border border-white/10 rounded-full shadow-2xl p-1 flex gap-1 z-[100] left-0 md:-translate-x-1/2 md:left-1/2"
                                    >
                                        {['👍', '🔥', '❤️', '😂', '😮'].map(emoji => (
                                            <motion.button key={emoji} whileHover={{ scale: 1.3, y: -2 }} whileTap={{ scale: 0.9 }} onClick={() => { handleReaction(msg.id, emoji, user); setShowReactions(false); }} className="w-8 h-8 flex items-center justify-center text-lg">
                                                {emoji}
                                            </motion.button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button onClick={onCopy} title="Copiar" className="w-7 h-7 flex items-center justify-center text-[#666] hover:text-white transition-colors rounded-full hover:bg-white/5">
                            <i className="bi bi-clipboard text-sm"></i>
                        </button>
                    </div>
                </div>

                <div className="oz-time opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-[#333] mt-0.5 px-2 font-bold uppercase">
                    {formatTime(msg.created_at)}
                </div>
            </div>
        </div>
    );
}