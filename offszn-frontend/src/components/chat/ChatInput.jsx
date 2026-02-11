import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useAuth } from '../../store/authStore';
import { Smile, Send, X, Image as ImageIcon } from 'lucide-react';

const ChatInput = () => {
    const { user } = useAuth();
    const {
        activeConversationId,
        sendMessage,
        replyToId,
        setReplyToId,
        messages
    } = useChatStore();

    const [content, setContent] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const textareaRef = useRef(null);

    const replyMessage = replyToId
        ? messages[activeConversationId]?.find(m => m.id === replyToId)
        : null;

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [content]);

    const handleSend = async () => {
        if (!content.trim() && !replyToId) return;

        const messageContent = content;
        const currentReplyId = replyToId;

        setContent('');
        setReplyToId(null);
        setShowEmojiPicker(false);

        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        await sendMessage(activeConversationId, user.id, messageContent, currentReplyId);
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const addEmoji = (emoji) => {
        setContent(prev => prev + emoji);
        textareaRef.current?.focus();
    };

    const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😻', '😼', '😽', '🙀', '😿', '😾'];

    return (
        <div className="flex flex-col w-full bg-black relative">

            {/* Reply Preview */}
            {replyMessage && (
                <div className="bg-[#121212] border-t border-[#262626] px-10 py-3 flex justify-between items-center animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-wider">
                            Respondiendo a {replyMessage.sender?.nickname || 'Usuario'}
                        </span>
                        <p className="text-xs text-gray-500 truncate italic pr-4">
                            {replyMessage.content || '📷 Foto'}
                        </p>
                    </div>
                    <button
                        onClick={() => setReplyToId(null)}
                        className="p-1 hover:bg-[#262626] rounded-full text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Emoji Picker Overlay */}
            {showEmojiPicker && (
                <div className="absolute bottom-full left-10 mb-2 w-72 h-56 bg-[#1a1a1a] border border-[#262626] rounded-2xl shadow-2xl p-3 z-50 overflow-hidden flex flex-col">
                    <div className="grid grid-cols-8 gap-1 overflow-y-auto custom-scrollbar pr-1">
                        {emojis.map((e, i) => (
                            <button
                                key={i}
                                onClick={() => addEmoji(e)}
                                className="text-xl p-1 hover:bg-[#262626] rounded-lg transition-colors text-center"
                            >
                                {e}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 md:px-10 pb-6 flex items-end gap-3">
                <div className="flex-1 bg-[#1a1a1a] rounded-3xl border border-[#262626] flex items-end p-2 px-4 gap-3 focus-within:border-gray-700 transition-all shadow-lg">
                    <button
                        className={`p-1.5 rounded-full transition-colors ${showEmojiPicker ? 'text-[#7c3aed] bg-[#7c3aed]/10' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                        <Smile size={22} />
                    </button>

                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="Mensaje..."
                        className="flex-1 bg-transparent text-white border-none outline-none resize-none py-2 text-sm max-h-32 custom-scrollbar"
                    />

                    <button className="p-1.5 text-gray-400 hover:text-white transition-colors">
                        <ImageIcon size={22} />
                    </button>
                </div>

                <button
                    onClick={handleSend}
                    disabled={!content.trim() && !replyToId}
                    className={`p-3 rounded-full flex items-center justify-center transition-all ${content.trim() || replyToId
                            ? 'bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/20 scale-100 hover:scale-110 active:scale-95'
                            : 'bg-[#262626] text-gray-600 scale-95 opacity-50'
                        }`}
                >
                    <Send size={20} className={content.trim() || replyToId ? '' : 'ml-0.5'} />
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
