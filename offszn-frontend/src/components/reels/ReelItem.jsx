import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, VolumeX, Volume2, CheckCircle } from 'lucide-react';
import { useReelsStore } from '../../store/useReelsStore';
import { useAuthStore } from '../../store/authStore';
import ReelActions from './ReelActions';
import ReelComments from './ReelComments';

const ReelItem = ({ reel, isActive }) => {
    const { user } = useAuthStore();
    const { toggleLike, incrementView } = useReelsStore();
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [showHeart, setShowHeart] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [isTitleExpanded, setIsTitleExpanded] = useState(false);

    // Autoplay Logic
    useEffect(() => {
        if (isActive) {
            videoRef.current?.play().catch(() => { });
            setIsPlaying(true);
            incrementView(reel.id);
        } else {
            videoRef.current?.pause();
            setIsPlaying(false);
        }
    }, [isActive]);

    const togglePlay = () => {
        if (videoRef.current?.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current?.pause();
            setIsPlaying(false);
        }
    };

    const handleTimeUpdate = () => {
        const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        setProgress(p);
    };

    const handleSeek = (e) => {
        const container = e.currentTarget;
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        videoRef.current.currentTime = percentage * videoRef.current.duration;
    };

    // Double Tap to Like
    let lastTap = 0;
    const handleDoubleTap = (e) => {
        const now = Date.now();
        if (now - lastTap < 300) {
            if (!reel.isLiked && user) {
                toggleLike(reel.id, user.id);
            }
            setShowHeart(true);
            setTimeout(() => setShowHeart(false), 800);
        } else {
            togglePlay();
        }
        lastTap = now;
    };

    return (
        <div className={`w-full h-full relative bg-black flex items-center justify-center transition-transform duration-500 overflow-hidden ${showComments ? 'md:-translate-x-[200px]' : ''}`}>

            {/* Video Player */}
            <video
                ref={videoRef}
                src={reel.video_url}
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-contain cursor-pointer"
                onTimeUpdate={handleTimeUpdate}
                onClick={handleDoubleTap}
            />

            {/* Overlay - Bottom Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

            {/* UI - Left Side Info */}
            <div className="absolute bottom-12 left-4 right-16 text-white z-10">

                {/* User Info */}
                <div className="flex items-center gap-3 mb-4">
                    <div
                        className="w-11 h-11 rounded-full border-2 border-white overflow-hidden cursor-pointer"
                        onClick={() => window.location.href = `/@${reel.users?.nickname}`}
                    >
                        {reel.users?.avatar_url ? (
                            <img src={reel.users.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-[#333] flex items-center justify-center font-bold">
                                {reel.users?.nickname?.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                            <span
                                className="font-bold text-sm cursor-pointer hover:underline"
                                onClick={() => window.location.href = `/@${reel.users?.nickname}`}
                            >
                                {reel.users?.nickname}
                            </span>
                            {reel.users?.is_verified && <CheckCircle size={14} className="text-[#3b82f6]" fill="currentColor" />}
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">OFFSZN Crew</span>
                    </div>
                </div>

                {/* Caption */}
                <div className="max-w-full">
                    <p
                        className={`text-sm leading-snug drop-shadow-md ${isTitleExpanded ? '' : 'line-clamp-2'}`}
                    >
                        {reel.description || reel.title}
                    </p>
                    {(reel.description?.length > 80 || reel.title?.length > 80) && (
                        <button
                            onClick={() => setIsTitleExpanded(!isTitleExpanded)}
                            className="text-xs font-bold text-gray-400 mt-1"
                        >
                            {isTitleExpanded ? 'Ver menos' : '...ver más'}
                        </button>
                    )}
                </div>
            </div>

            {/* Actions (Sidebar) */}
            <ReelActions
                reel={reel}
                onOpenComments={() => setShowComments(true)}
            />

            {/* Feedback Overlays */}
            {!isPlaying && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <Play size={80} fill="white" />
                </div>
            )}

            {showHeart && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-heart-pop text-white drop-shadow-[0_0_20px_rgba(255,0,0,0.5)]">
                    <Heart size={120} fill="white" />
                </div>
            )}

            {/* Mute/Unmute Toggle */}
            <button
                onClick={() => setIsMuted(!isMuted)}
                className="absolute top-4 right-4 p-2 bg-black/30 backdrop-blur-md rounded-full text-white z-20"
            >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            {/* Progress Bar */}
            <div
                className="absolute bottom-0 left-0 w-full h-[3px] bg-white/10 cursor-pointer z-30 group"
                onClick={handleSeek}
            >
                <div
                    className="h-full bg-[#8b5cf6] shadow-[0_0_10px_rgba(139,92,246,0.6)] transition-all"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Comments Drawer (Responsive) */}
            {showComments && (
                <ReelComments
                    reelId={reel.id}
                    onClose={() => setShowComments(false)}
                />
            )}

            <style>{`
        @keyframes heart-pop {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
          100% { transform: translate(-50%, -60%) scale(1); opacity: 0; }
        }
        .animate-heart-pop {
          animation: heart-pop 0.8s ease-out forwards;
        }
      `}</style>
        </div>
    );
};

export default ReelItem;
