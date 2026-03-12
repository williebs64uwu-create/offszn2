import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, ExternalLink, Calendar, DollarSign, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePlayerStore } from '../../store/playerStore';
import apiClient from '../../api/client';

const FeedCard = ({ request, viewMode, onViewDetails }) => {
    const { user } = useAuthStore();
    const { currentTrack, isPlaying: globalPlaying, playTrack, togglePlay } = usePlayerStore();

    const isPlaying = globalPlaying && currentTrack?.id === request.id;
    const waveformRef = useRef(null);
    const wavesurfer = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);

    const buyerName = request.buyer?.nickname || 'Usuario';
    const buyerAvatar = request.buyer?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(buyerName)}&background=random`;
    const budget = request.budget ? `$${request.budget}` : 'A convenir';

    // Formatear fecha relativa
    const getRelativeDate = (dateString) => {
        const now = new Date();
        const created = new Date(dateString);
        const diffMs = now - created;
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays}d`;
        return created.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    useEffect(() => {
        let isCancelled = false;

        const initWs = async () => {
            if (!request.preview_url || !waveformRef.current || wavesurfer.current) return;

            try {
                // Fetch signed URL for R2
                const { data } = await apiClient.post('/storage/sign-url', { key: request.preview_url });
                if (isCancelled) return;

                wavesurfer.current = WaveSurfer.create({
                    container: waveformRef.current,
                    waveColor: '#333',
                    progressColor: '#fff',
                    cursorColor: 'transparent',
                    barWidth: 2,
                    barGap: 3,
                    barRadius: 2,
                    height: 40,
                    normalize: true,
                    interact: true
                });

                wavesurfer.current.load(data.downloadUrl);

                wavesurfer.current.on('ready', () => setIsLoaded(true));
                wavesurfer.current.on('play', () => setIsPlaying(true));
                wavesurfer.current.on('pause', () => setIsPlaying(false));
                wavesurfer.current.on('finish', () => setIsPlaying(false));
            } catch (err) {
                console.error("Error loading preview:", err);
            }
        };

        initWs();

        return () => {
            isCancelled = true;
            if (wavesurfer.current) {
                wavesurfer.current.destroy();
                wavesurfer.current = null;
            }
        };
    }, [request.preview_url]);

    const handleTogglePlay = (e) => {
        e.stopPropagation();
        if (currentTrack?.id === request.id) {
            togglePlay();
        } else {
            playTrack({
                ...request,
                is_custom_request: true,
                producer_nickname: request.buyer?.nickname // Just for display if needed
            });
        }
    };

    const isOwnRequest = user?.id === request.buyer_id;

    if (viewMode === 'list') {
        return (
            <div
                onClick={onViewDetails}
                className="group bg-white/2 hover:bg-white/5 border border-white/5 hover:border-white/10 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-6 transition-all cursor-pointer"
            >
                <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
                    <img src={buyerAvatar} alt={buyerName} className="w-12 h-12 rounded-full border border-white/10 object-cover flex-shrink-0" />
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-white truncate">{buyerName}</span>
                            <span className="text-[10px] font-black bg-white/10 text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {request.request_type || 'Beat'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-400 truncate max-w-md">{request.description}</p>
                    </div>
                </div>

                {request.preview_url && (
                    <div className="flex items-center gap-4 w-full md:w-48 xl:w-64" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={handleTogglePlay}
                            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform"
                        >
                            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="translate-x-0.5" fill="currentColor" />}
                        </button>
                        <div ref={waveformRef} className="flex-1"></div>
                    </div>
                )}

                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="flex flex-col items-end">
                        <span className="text-lg font-black text-white">{budget}</span>
                        <span className="text-xs text-gray-500">{getRelativeDate(request.created_at)}</span>
                    </div>
                    <button
                        disabled={isOwnRequest}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${isOwnRequest
                            ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                            : 'bg-white text-black hover:bg-black hover:text-white border border-white'
                            }`}
                    >
                        {isOwnRequest ? 'Tu Solicitud' : 'Tomar'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={onViewDetails}
            className="group bg-[#0a0a0a] border border-white/5 hover:border-white/20 p-6 rounded-[2.5rem] flex flex-col gap-6 transition-all cursor-pointer shadow-xl relative overflow-hidden"
        >
            {/* Background Aesthetic Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/2 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/5 transition-colors"></div>

            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <img src={buyerAvatar} alt={buyerName} className="w-10 h-10 rounded-full border border-white/10 object-cover" />
                    <div>
                        <h4 className="font-bold text-sm leading-tight">{buyerName}</h4>
                        <span className="text-xs text-gray-500 font-medium">{getRelativeDate(request.created_at)}</span>
                    </div>
                </div>
                <div className="bg-black/60 border border-white/10 px-3 py-1.5 rounded-2xl">
                    <span className="text-sm font-black text-white">{budget}</span>
                </div>
            </div>

            <div className="flex-1">
                <div className="flex gap-2 mb-3">
                    <span className="text-[10px] font-black bg-white/10 text-gray-400 px-3 py-1 rounded-full uppercase tracking-widest border border-white/5">
                        {request.request_type || 'Beat'}
                    </span>
                    {request.bpm && (
                        <span className="text-[10px] font-black bg-white/5 text-gray-500 px-3 py-1 rounded-full uppercase tracking-widest">
                            {request.bpm} BPM
                        </span>
                    )}
                </div>
                <p className="text-[0.95rem] text-gray-400 line-clamp-3 leading-relaxed group-hover:text-gray-200 transition-colors">
                    {request.description}
                </p>
            </div>

            {request.preview_url && (
                <div
                    className="bg-white/2 border border-white/5 p-3 rounded-2xl flex items-center gap-3"
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={handleTogglePlay}
                        className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0"
                    >
                        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} className="translate-x-0.5" fill="currentColor" />}
                    </button>
                    <div ref={waveformRef} className="flex-1 opacity-60"></div>
                </div>
            )}

            <div className="flex gap-3 mt-2">
                <button
                    onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
                    className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all"
                >
                    Detalles
                </button>
                <button
                    disabled={isOwnRequest}
                    className={`flex-1 py-3.5 rounded-2xl font-black text-sm transition-all border ${isOwnRequest
                        ? 'bg-transparent border-white/10 text-gray-600 cursor-not-allowed'
                        : 'bg-white border-white text-black hover:bg-black hover:text-white'
                        }`}
                >
                    {isOwnRequest ? 'Tuyo' : 'Tomar Trabajo'}
                </button>
            </div>
        </div>
    );
};

export default FeedCard;
