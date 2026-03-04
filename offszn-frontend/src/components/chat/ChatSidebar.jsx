import React, { useMemo } from 'react';
import { useChatStore, formatTime, getAvatarUrl } from '../../store/useChatStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatSidebar() {
    const {
        activeTab, setActiveTab,
        searchQuery, setSearchQuery,
        setIsNewChatModalOpen, setIsGroupModalOpen, isLoadingConversations,
        conversations, activeConvId, openConversation,
        pinnedChats, togglePinChat,
        activeMenuId, setActiveMenuId
    } = useChatStore();

    const displayedChats = useMemo(() => {
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
    }, [conversations, activeTab, searchQuery, pinnedChats]);

    return (
        <div className="chat-sidebar">
            <div className="chat-sidebar-header">
                <div className="tabs-nav-wrapper">
                    <div className="tabs-nav-left">
                        {['principal', 'grupos'].map((tab) => (
                            <button
                                key={tab}
                                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="tab-underline"
                                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="tabs-nav-right flex items-center justify-end gap-2">
                        <button className="btn-new-chat hover:scale-110 active:scale-95 transition-all" onClick={() => setIsGroupModalOpen(true)} title="Nuevo Grupo">
                            <i className="bi bi-people-fill text-[#a855f7]"></i>
                        </button>
                        <button className="btn-new-chat hover:scale-110 active:scale-95 transition-all" onClick={() => setIsNewChatModalOpen(true)} title="Nuevo Mensaje">
                            <i className="bi bi-plus-lg"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div className="search-bar-container">
                <div className="search-input-wrapper group">
                    <i className="bi bi-search group-focus-within:text-[#8b5cf6] transition-colors"></i>
                    <input
                        type="text"
                        placeholder="Buscar chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="chat-list custom-scrollbar">
                {isLoadingConversations ? (
                    <div id="chatSidebarSkeletons">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="skeleton-chat-item skeleton-pulse py-3 px-5 flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex-shrink-0"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-[#1a1a1a] rounded w-1/3"></div>
                                    <div className="h-3 bg-[#1a1a1a] rounded w-2/3"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div id="conversationsList">
                        <AnimatePresence mode="popLayout">
                            {displayedChats.map(conv => {
                                const isPinned = pinnedChats.includes(conv.id);
                                return (
                                    <motion.div
                                        key={conv.id}
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className={`offszn-v3-chat-row ${activeConvId === conv.id ? 'active' : ''}`}
                                        onClick={() => openConversation(conv)}
                                    >
                                        <div className="oz-chat-avatar relative">
                                            {conv.isGroup && !conv.avatar ? (
                                                <div className="w-full h-full rounded-full bg-[#111] border border-white/5 flex items-center justify-center">
                                                    <i className="bi bi-people-fill text-[#a855f7] text-xl"></i>
                                                </div>
                                            ) : (
                                                <img src={getAvatarUrl(conv.avatar, conv.name)} alt={conv.name} className="w-full h-full object-cover rounded-full shadow-sm" />
                                            )}
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#050505] rounded-full shadow-sm"></div>
                                        </div>
                                        <div className="oz-chat-info">
                                            <div className="offszn-v3-chat-name flex items-center justify-between gap-2">
                                                <span className="truncate">{conv.name}</span>
                                                <span className="oz-chat-time text-xs whitespace-nowrap opacity-60 font-normal">{formatTime(conv.updatedAt)}</span>
                                            </div>
                                            <div className="oz-chat-preview-wrap flex items-center justify-between gap-2 mt-0.5">
                                                <span className="oz-chat-preview-text truncate text-sm text-[#9ca3af]">
                                                    {conv.preview}
                                                </span>
                                                {isPinned && <i className="bi bi-pin-fill text-[#a855f7] text-[10px] transform rotate-45"></i>}
                                            </div>
                                        </div>

                                        <div className="offszn-v3-dots flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === conv.id ? null : conv.id); }}>
                                            <i className="bi bi-three-dots text-gray-400"></i>
                                        </div>

                                        <AnimatePresence>
                                            {activeMenuId === conv.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                                    className="chat-action-menu show"
                                                >
                                                    <div className="chat-action-item flex items-center gap-2" onClick={(e) => togglePinChat(e, conv.id)}>
                                                        <i className={`bi ${isPinned ? 'bi-pin-angle' : 'bi-pin-angle-fill'}`}></i>
                                                        <span>{isPinned ? 'Desfijar' : 'Fijar'}</span>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                        {displayedChats.length === 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-gray-500 p-12 text-sm italic">
                                No hay conversaciones aún...
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
