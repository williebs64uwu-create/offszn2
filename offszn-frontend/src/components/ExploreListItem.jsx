import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { usePlayerStore } from '../store/playerStore';
import { useSecureUrl } from '../hooks/useSecureUrl';
import { Play, Pause } from 'lucide-react';
import SecureImage from './ui/SecureImage';

const ExploreListItem = ({ product, index }) => {
    const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
    const waveformRef = useRef(null);
    const wavesurfer = useRef(null);
    const [isReady, setIsReady] = useState(false);

    // Get the audio URL (it could be an R2 key or a full URL)
    const rawAudioUrl = product.mp3_url || product.download_url_mp3 || product.preview_url ||
        product.audio_url || product.tagged_file || product.file_url;

    const { url: audioUrl } = useSecureUrl(rawAudioUrl);

    const isCurrent = currentTrack?.id === product.id;

    useEffect(() => {
        if (!waveformRef.current || !audioUrl) return;

        wavesurfer.current = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#444',
            progressColor: '#8b5cf6',
            cursorColor: 'transparent',
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 24,
            normalize: true,
            interact: true,
            url: audioUrl,
            backend: 'MediaElement',
        });

        wavesurfer.current.on('ready', () => {
            setIsReady(true);
        });

        wavesurfer.current.on('interaction', () => {
            if (isCurrent) {
                // If the user clicks the waveform of the currently playing track,
                // we could sync the seek position, but for now we let the global player handle it.
            } else {
                playTrack(product);
            }
        });

        return () => {
            if (wavesurfer.current) {
                wavesurfer.current.destroy();
            }
        };
    }, [audioUrl, product, playTrack, isCurrent]);

    // Sync WaveSurfer with global player state
    useEffect(() => {
        if (!wavesurfer.current || !isReady) return;

        if (isCurrent && isPlaying) {
            // Technically, the global player is playing, but this inline waveform
            // is just a "preview" or "visualizer". 
            // In the legacy code, the inline wavesurfer was often NOT playing if the global footer was.
            // But the user wants a 1:1 feel.
        } else {
            wavesurfer.current.pause();
        }
    }, [isCurrent, isPlaying, isReady]);

    const handlePlayClick = (e) => {
        e.stopPropagation();
        if (isCurrent) {
            togglePlay();
        } else {
            playTrack(product);
        }
    };

    return (
        <div
            className={`group flex items-center gap-3 p-2 rounded-xl transition-all duration-200 cursor-pointer overflow-hidden relative ${isCurrent ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5'}`}
            onClick={() => window.location.href = `/${product.product_type || 'beat'}/${product.id}`}
        >
            <div className={`w-6 text-[10px] font-black tracking-tighter transition-colors text-center shrink-0 ${isCurrent ? 'text-primary' : 'text-zinc-700 group-hover:text-zinc-400'}`}>
                {index < 10 ? `0${index}` : index}
            </div>

            <div className="w-12 h-12 shrink-0 relative rounded-lg overflow-hidden bg-zinc-900 border border-white/5">
                <SecureImage
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {isCurrent && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className={`text-stone-100 text-sm font-extrabold truncate uppercase tracking-tight group-hover:text-primary transition-colors ${isCurrent ? 'text-primary' : ''}`}>
                    {product.name}
                </div>
                <div className="text-zinc-600 text-[10px] font-bold uppercase tracking-wide truncate">
                    @{product.producer_nickname || product.users?.nickname || 'OFFSZN Artist'}
                </div>
            </div>

            <div
                ref={waveformRef}
                className={`hidden md:block flex-1 h-6 mx-4 transition-all duration-300 ${!isReady ? 'opacity-20' : (isCurrent ? 'opacity-100' : 'opacity-40 group-hover:opacity-100')}`}
                onClick={(e) => e.stopPropagation()}
            >
                {!isReady && (
                    <div className="flex items-center justify-center gap-[2px] h-full opacity-30">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="w-[2px] bg-zinc-600 rounded-full" style={{ height: `${Math.random() * 12 + 4}px` }}></div>
                        ))}
                    </div>
                )}
            </div>

            <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <button
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${isCurrent ? 'bg-primary text-white scale-100' : 'bg-white/5 text-zinc-500 opacity-0 group-hover:opacity-100 group-hover:bg-white group-hover:text-black scale-90 group-hover:scale-100'}`}
                    onClick={handlePlayClick}
                >
                    {isCurrent && isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                </button>
            </div>
        </div>
    );
};

export default ExploreListItem;
