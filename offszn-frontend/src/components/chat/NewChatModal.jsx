import React from 'react';
import { useChatStore, getAvatarUrl } from '../../store/useChatStore';
import { useAuth } from '../../store/authStore';

export default function NewChatModal() {
    const { user } = useAuth();
    const {
        isNewChatModalOpen, setIsNewChatModalOpen,
        modalSearchQuery, handleModalSearchChange,
        modalSearchResults, isSearchingUsers, startNewChat
    } = useChatStore();

    if (!isNewChatModalOpen) return null;

    return (
        <div className="chat-modal-overlay" onClick={() => setIsNewChatModalOpen(false)}>
            <div className="chat-modal-container" onClick={e => e.stopPropagation()}>
                <div className="chat-modal-header">
                    <span className="chat-modal-title">Nuevo Mensaje</span>
                </div>

                <div className="p-6">
                    <div className="search-bar-container">
                        <div className="search-input-wrapper">
                            <i className="bi bi-search"></i>
                            <input
                                type="text"
                                placeholder="Buscar usuarios..."
                                value={modalSearchQuery}
                                onChange={(e) => handleModalSearchChange(e, user?.id)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="chat-modal-results">
                        {isSearchingUsers ? (
                            <div className="flex justify-center p-8">
                                <div className="w-8 h-8 border-3 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : modalSearchResults.length > 0 ? (
                            modalSearchResults.map(u => (
                                <div key={u.id} className="result-user-row" onClick={() => startNewChat(u, user)}>
                                    <img
                                        src={getAvatarUrl(u.avatar_url, u.nickname)}
                                        className="w-10 h-10 rounded-full border border-white/10"
                                        alt=""
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold">{u.nickname}</span>
                                        <span className="text-gray-500 text-xs uppercase tracking-tighter">@{u.nickname.toLowerCase()}</span>
                                    </div>
                                </div>
                            ))
                        ) : modalSearchQuery.trim() !== '' ? (
                            <div className="text-center p-8 text-gray-500 text-sm">No se encontraron usuarios</div>
                        ) : (
                            <div className="text-center p-8 text-gray-500 text-sm italic">Escribe para empezar a buscar</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}