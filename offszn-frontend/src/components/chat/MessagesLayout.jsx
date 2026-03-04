import React, { useEffect } from 'react';
import { useAuth } from '../../store/authStore';
import { useChatStore } from '../../store/useChatStore';
import ChatSidebar from './ChatSidebar';
import ChatArea from './ChatArea';
import NewChatModal from './NewChatModal';
import GroupCreationModal from './GroupCreationModal';

export default function MessagesLayout() {
    const { user } = useAuth();
    const { fetchConversations, setupRealtime, isNewChatModalOpen, isGroupModalOpen } = useChatStore();

    useEffect(() => {
        if (user) {
            fetchConversations(user.id);
            const cleanup = setupRealtime(user.id);
            return () => cleanup && cleanup();
        }
    }, [user, fetchConversations, setupRealtime]);

    return (
        <div id="messages-layout-root" className="flex flex-col flex-1 h-full w-full overflow-hidden relative" style={{ minHeight: 0 }}>
            {/* The chat interface */}
            <div className="chat-wrapper">
                <ChatSidebar />
                <ChatArea />
            </div>

            {/* Modals rendered at the end to be on top */}
            {isNewChatModalOpen && <NewChatModal />}
            {isGroupModalOpen && <GroupCreationModal />}
        </div>
    );
}