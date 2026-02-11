import React from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Eye } from 'lucide-react';
import { useReelsStore } from '../../store/useReelsStore';
import { useAuthStore } from '../../store/authStore';

const ReelActions = ({ reel, onOpenComments }) => {
    const { user } = useAuthStore();
    const { toggleLike } = useReelsStore();

    const handleLike = (e) => {
        e.stopPropagation();
        if (!user) {
            alert('Inicia sesión para dar like');
            return;
        }
        toggleLike(reel.id, user.id);
    };

    const handleShare = (e) => {
        e.stopPropagation();
        if (navigator.share) {
            navigator.share({
                title: reel.title,
                text: `Mira este reel en OFFSZN: ${reel.title}`,
                url: window.location.href,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Enlace copiado al portapapeles');
        }
    };

    return (
        <div className="absolute bottom-[100px] right-4 flex flex-col items-center gap-6 z-20">

            {/* Views */}
            <div className="flex flex-col items-center">
                <div className="p-3 text-white drop-shadow-lg">
                    <Eye size={24} />
                </div>
                <span className="text-white text-xs font-bold -mt-2 drop-shadow-md">
                    {reel.views_count || 0}
                </span>
            </div>

            {/* Like */}
            <div className="flex flex-col items-center">
                <button
                    onClick={handleLike}
                    className={`p-3 rounded-full backdrop-blur-md transition-all active:scale-125 ${reel.isLiked ? 'text-red-500 bg-red-500/10 scale-110' : 'text-white bg-black/20 hover:bg-white/10'
                        }`}
                >
                    <Heart size={28} fill={reel.isLiked ? 'currentColor' : 'none'} />
                </button>
                <span className="text-white text-xs font-bold mt-1 drop-shadow-md">
                    {reel.likesCount || 0}
                </span>
            </div>

            {/* Comments */}
            <div className="flex flex-col items-center">
                <button
                    onClick={(e) => { e.stopPropagation(); onOpenComments(); }}
                    className="p-3 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-white/10 transition-all active:scale-95"
                >
                    <MessageCircle size={28} />
                </button>
                <span className="text-white text-xs font-bold mt-1 drop-shadow-md">
                    {reel.commentsCount || 0}
                </span>
            </div>

            {/* Share */}
            <button
                onClick={handleShare}
                className="p-3 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-white/10 transition-all"
            >
                <Share2 size={24} />
            </button>

            {/* More */}
            <button className="p-3 text-white/70 hover:text-white transition-colors">
                <MoreVertical size={24} />
            </button>

        </div>
    );
};

export default ReelActions;
