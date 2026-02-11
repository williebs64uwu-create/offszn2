import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../api/client';
import { X, Send, Heart, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const ReelComments = ({ reelId, onClose }) => {
    const { user } = useAuthStore();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchComments();
    }, [reelId]);

    const fetchComments = async () => {
        try {
            const { data, error } = await supabase
                .from('reel_comments')
                .select('*, users(nickname, avatar_url)')
                .eq('reel_id', reelId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setComments(data || []);
        } catch (e) {
            console.error('Error fetching comments:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user || !newComment.trim()) return;

        const content = newComment;
        setNewComment('');

        try {
            const { data, error } = await supabase
                .from('reel_comments')
                .insert({
                    reel_id: reelId,
                    user_id: user.id,
                    content: content
                })
                .select('*, users(nickname, avatar_url)')
                .single();

            if (error) throw error;
            setComments([data, ...comments]);
        } catch (e) {
            console.error('Error posting comment:', e);
        }
    };

    return (
        <div
            className="absolute bottom-0 left-0 w-full h-[70%] md:h-full md:left-full md:bottom-0 md:w-[400px] bg-[#0F0F0F] rounded-t-3xl md:rounded-none z-[100] flex flex-col shadow-2xl animate-in slide-in-from-bottom md:slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="p-4 px-6 border-b border-[#222] flex justify-between items-center bg-[#0F0F0F] sticky top-0 rounded-t-3xl md:rounded-none z-10">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">Comentarios</h3>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-[#222] rounded-full text-gray-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar bg-[#050505]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2">
                        <div className="w-8 h-8 border-2 border-gray-800 border-t-gray-400 rounded-full animate-spin" />
                        <p className="text-xs font-bold uppercase tracking-widest">Cargando...</p>
                    </div>
                ) : comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-4 group">
                            <div className="w-9 h-9 flex-shrink-0 cursor-pointer">
                                {comment.users?.avatar_url ? (
                                    <img src={comment.users.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-white font-bold rounded-full text-xs">
                                        {comment.users?.nickname?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-white font-bold text-sm cursor-pointer hover:underline">
                                        {comment.users?.nickname}
                                    </span>
                                    <span className="text-[10px] text-gray-600 font-bold uppercase">
                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: false, locale: es })}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    {comment.content}
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                    <button className="text-[10px] font-bold text-gray-600 hover:text-white uppercase transition-colors">Responder</button>
                                    <button className="flex items-center gap-1 text-[10px] font-bold text-gray-600 hover:text-red-500 transition-colors uppercase">
                                        <Heart size={10} /> {comment.likes_count || 0}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-700 py-10 opacity-30">
                        <MessageSquare size={48} className="mb-4" />
                        <p className="font-bold text-sm uppercase tracking-widest">Aún no hay comentarios</p>
                        <p className="text-xs mt-1">¡Sé el primero en comentar!</p>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 px-6 border-t border-[#222] bg-[#0F0F0F] pb-8 md:pb-6">
                <form
                    onSubmit={handleSubmit}
                    className="bg-[#1a1a1a] rounded-2xl flex items-center p-2 px-4 border border-transparent focus-within:border-gray-700 transition-colors"
                >
                    <input
                        type="text"
                        placeholder="Añadir comentario..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 bg-transparent text-white border-none outline-none text-sm py-2"
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className={`p-2 rounded-xl transition-all ${newComment.trim() ? 'bg-[#7c3aed] text-white scale-110 shadow-lg shadow-purple-900/40' : 'text-gray-600'
                            }`}
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      `}</style>
        </div>
    );
};

export default ReelComments;
