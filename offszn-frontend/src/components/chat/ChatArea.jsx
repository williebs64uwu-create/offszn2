import React, { useEffect, useRef } from 'react';
import { useChatStore, getAvatarUrl } from '../../store/useChatStore';
import { useAuth } from '../../store/authStore';
import MessageBubble from './MessageBubble';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatArea() {
    const { user } = useAuth();

    const {
        activeConvId, activeChatData, messages,
        messageInput, setMessageInput, sendMessage,
        replyToMessage, setReplyToMessage, setActiveConvId, setIsNewChatModalOpen
    } = useChatStore();

    const messagesEndRef = useRef(null);
    const activeMessages = messages[activeConvId] || [];

    useEffect(() => {
        if (activeMessages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeMessages.length, activeConvId]);

    if (!activeConvId) {
        return (
            <div className="chat-main" id="chatMainArea">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="chat-placeholder flex flex-col items-center justify-center h-full text-center px-6"
                >
                    <div className="w-24 h-24 mb-6 relative">
                        <i className="bi bi-send-fill text-6xl text-[#8b5cf6] absolute inset-0 flex items-center justify-center opacity-20 blur-xl"></i>
                        <i className="bi bi-send text-6xl text-white absolute inset-0 flex items-center justify-center -rotate-12"></i>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Tus mensajes</h2>
                    <p className="text-[#9ca3af] mb-8 max-w-xs">Conecta con otros productores y artistas de la comunidad.</p>
                    <button
                        onClick={() => setIsNewChatModalOpen(true)}
                        className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-all active:scale-95 shadow-xl shadow-white/10"
                    >
                        Enviar mensaje
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="chat-main" id="chatMainArea">
            <div id="activeChatContainer" className="flex flex-col h-full w-full overflow-hidden">
                {/* Header */}
                <div className="chat-header h-[72px] flex items-center px-6 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-20">
                    <div className="flex items-center gap-4 flex-1">
                        <button className="md:hidden text-white" onClick={() => setActiveConvId(null)}>
                            <i className="bi bi-chevron-left text-2xl"></i>
                        </button>
                        <div className="oz-chat-avatar relative group cursor-pointer">
                            <img
                                src={getAvatarUrl(activeChatData.avatar, activeChatData.name)}
                                alt={activeChatData.name}
                                className="w-10 h-10 rounded-full ring-2 ring-white/10 group-hover:ring-[#8b5cf6] transition-all"
                            />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>
                        </div>
                        <div className="flex flex-col">
                            <h3 className="font-bold text-white text-lg leading-tight">{activeChatData?.name}</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-[11px] text-[#9ca3af] font-medium uppercase tracking-wider">Activo ahora</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-[#9ca3af] hover:text-white transition-colors text-xl">
                            <i className="bi bi-info-circle"></i>
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="messages-feed flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar" id="messagesFeed">
                    <div className="messages-feed-inner max-w-full mx-auto flex flex-col gap-1 py-4">
                        <AnimatePresence initial={false}>
                            {activeMessages.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#444] space-y-4">
                                    <div className="w-16 h-16 rounded-full border border-dashed border-[#222] flex items-center justify-center text-2xl">
                                        <i className="bi bi-chat-dots"></i>
                                    </div>
                                    <p className="text-sm">Sin mensajes todavía...</p>
                                </div>
                            ) : (
                                activeMessages.map((msg, idx) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ duration: 0.2, delay: idx * 0.01 }}
                                    >
                                        <MessageBubble msg={msg} isMine={msg.sender_id === user?.id} />
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                        <div ref={messagesEndRef} className="pt-4" />
                    </div>
                </div>

                {/* Input Area */}
                <div className="chat-input-area border-t border-white/5 bg-black/80 backdrop-blur-xl p-4 md:p-6">
                    <AnimatePresence>
                        {replyToMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="flex items-center justify-between bg-white/5 border-l-4 border-[#8b5cf6] px-4 py-2 rounded-t-2xl mb-2 backdrop-blur-md"
                            >
                                <div className="text-xs truncate">
                                    <p className="font-bold text-[#8b5cf6] mb-0.5">Respondiendo a</p>
                                    <p className="text-[#9ca3af] italic">"{replyToMessage.content}"</p>
                                </div>
                                <button onClick={() => setReplyToMessage(null)} className="text-[#444] hover:text-white transition-colors">
                                    <i className="bi bi-x-lg"></i>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="input-container relative flex items-center bg-[#111] border border-white/5 rounded-[24px] px-2 py-1.5 focus-within:ring-2 focus-within:ring-[#8b5cf6]/20 transition-all">
                        <button className="p-2 text-[#444] hover:text-white transition-colors">
                            <i className="bi bi-plus-circle text-xl"></i>
                        </button>
                        <input
                            type="text"
                            className="flex-1 bg-transparent border-none text-white outline-none px-3 py-2 text-[0.95rem] placeholder-[#444]"
                            placeholder="Escribe algo increíble..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage(user)}
                        />
                        <div className="flex items-center gap-1 pr-1">
                            <button className="p-2 text-[#444] hover:text-[#8b5cf6] transition-colors">
                                <i className="bi bi-emoji-smile text-xl"></i>
                            </button>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                className={`p-2.5 rounded-full transition-all flex items-center justify-center ${messageInput.trim() ? 'bg-[#8b5cf6] text-white' : 'text-[#444]'}`}
                                onClick={() => sendMessage(user)}
                            >
                                <i className="bi bi-send-fill text-lg"></i>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
