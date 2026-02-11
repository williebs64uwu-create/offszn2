import React, { useState, useEffect } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useAuth } from '../../store/authStore';
import { Search, UserPlus, Trash2, Edit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const ChatSidebar = () => {
    const { user } = useAuth();
    const {
        conversations,
        activeConversationId,
        setActiveConversationId,
        searchUsers,
        startNewChat,
        loading
    } = useChatStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [activeTab, setActiveTab] = useState('principal'); // 'principal' | 'solicitudes'
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.trim()) {
                setIsSearching(true);
                const results = await searchUsers(searchQuery, user?.id);
                setSearchResults(results);
                setIsSearching(false);
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, user?.id]);

    const handleStartChat = async (targetUser) => {
        await startNewChat(targetUser, user);
        setSearchQuery('');
        setSearchResults([]);
    };

    const renderAvatar = (url, name) => {
        if (url) {
            return <img src={url} alt={name} className="w-full h-full object-cover rounded-full" />;
        }
        const initial = name?.charAt(0).toUpperCase() || '?';
        return (
            <div className="w-full h-full flex items-center justify-center bg-[#333] text-white font-bold rounded-full">
                {initial}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-black">
            {/* Header */}
            <div className="p-5 flex justify-between items-center text-white">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    {user?.user_metadata?.nickname || 'Mensajes'}
                </h1>
                <button className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors">
                    <Edit size={20} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#262626] px-5">
                <button
                    onClick={() => setActiveTab('principal')}
                    className={`py-3 px-4 font-semibold text-sm relative transition-colors ${activeTab === 'principal' ? 'text-white' : 'text-gray-500'
                        }`}
                >
                    Principal
                    {activeTab === 'principal' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white" />}
                </button>
                <button
                    onClick={() => setActiveTab('solicitudes')}
                    className={`py-3 px-4 font-semibold text-sm relative transition-colors ${activeTab === 'solicitudes' ? 'text-white' : 'text-gray-500'
                        }`}
                >
                    Solicitudes
                    {activeTab === 'solicitudes' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white" />}
                </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 px-5">
                <div className="relative group">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#262626] text-white rounded-lg py-2 pl-10 pr-4 outline-none text-sm border border-transparent focus:border-gray-700 transition-all"
                    />
                </div>
            </div>

            {/* Conversations / Search Results List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {searchQuery.trim() ? (
                    <div className="p-2">
                        <h3 className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Resultados</h3>
                        {isSearching ? (
                            <div className="p-4 text-center text-gray-500 text-sm">Buscando...</div>
                        ) : searchResults.length > 0 ? (
                            searchResults.map(profile => (
                                <div
                                    key={profile.id}
                                    onClick={() => handleStartChat(profile)}
                                    className="flex items-center gap-3 p-3 hover:bg-[#121212] rounded-xl cursor-pointer transition-all group"
                                >
                                    <div className="w-12 h-12 flex-shrink-0">
                                        {renderAvatar(profile.avatar_url, profile.nickname)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-semibold text-sm truncate">{profile.nickname}</p>
                                        <p className="text-[#8b5cf6] text-xs font-medium">Click para iniciar chat</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-gray-500 text-sm">No se encontraron usuarios</div>
                        )}
                    </div>
                ) : activeTab === 'principal' ? (
                    <div className="flex flex-col">
                        {conversations.length > 0 ? (
                            conversations.map(chat => (
                                <div
                                    key={chat.id}
                                    onClick={() => setActiveConversationId(chat.id)}
                                    className={`flex items-center gap-3 p-3 px-5 cursor-pointer transition-all relative ${activeConversationId === chat.id ? 'bg-[#121212]' : 'hover:bg-[#121212]'
                                        }`}
                                >
                                    <div className="w-14 h-14 flex-shrink-0">
                                        {renderAvatar(chat.otherUser.avatar_url, chat.otherUser.nickname)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline gap-2">
                                            <p className="text-white font-medium text-sm truncate">{chat.otherUser.nickname}</p>
                                            <span className="text-[10px] text-gray-500 flex-shrink-0">
                                                {chat.updatedAt && formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: false, locale: es })}
                                            </span>
                                        </div>
                                        <p className={`text-xs truncate ${activeConversationId === chat.id ? 'text-white' : 'text-gray-500'}`}>
                                            {chat.lastMessage}
                                        </p>
                                    </div>
                                    {chat.unreadCount > 0 && (
                                        <div className="w-2 h-2 bg-[#7c3aed] rounded-full absolute right-5" />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center bg-black">
                                <div className="w-16 h-16 rounded-full border border-gray-800 flex items-center justify-center mx-auto mb-4">
                                    <UserPlus size={24} className="text-gray-700" />
                                </div>
                                <p className="text-gray-500 text-sm">No tienes chats aún.</p>
                                <p className="text-xs text-gray-600 mt-1 italic">¡Busca a alguien para empezar!</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-10 text-center flex flex-col items-center">
                        <UserPlus size={48} className="text-gray-800 mb-4 opacity-30" />
                        <p className="text-gray-500 text-sm">Aún no tienes solicitudes.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;
