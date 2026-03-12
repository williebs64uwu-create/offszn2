import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { usePlayerStore } from '../../store/playerStore';
import { useCurrencyStore } from '../../store/currencyStore';
import { useSecureUrl } from '../../hooks/useSecureUrl';
import { Link, useNavigate } from 'react-router-dom';
import { useFavorites } from '../../hooks/useFavorites';
import { apiClient } from '../../api/client';
import ShareModal from '../modals/ShareModal';
import ComparisonModal from '../modals/ComparisonModal';

const StickyPlayer = () => {
  const {
    currentTrack,
    isPlaying,
    volume,
    togglePlay,
    playNext,
    playPrev,
    closePlayer,
    setVolume
  } = usePlayerStore();

  const { formatPrice } = useCurrencyStore();
  const navigate = useNavigate();

  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const audioEl = useRef(null);

  const [currentTime, setCurrentTime] = useState('0:00');
  const [totalTime, setTotalTime] = useState('--:--');
  const [isMuted, setIsMuted] = useState(false);
  const { toggleFavorite } = useFavorites();
  const [isLiked, setIsLiked] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Modals state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);

  // Sync local liked state when track changes
  useEffect(() => {
    setIsLiked(!!currentTrack?.is_liked);
  }, [currentTrack?.id ? String(currentTrack.id) : null, currentTrack?.is_liked]);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentTrack) return;
    const result = await toggleFavorite(currentTrack.id);
    if (result !== null) setIsLiked(result);
  };

  // Secure URLs
  const { url: secureCover } = useSecureUrl(currentTrack?.image_url);
  const rawAudioUrl = useMemo(() => {
    if (!currentTrack) return null;
    return (
      currentTrack.demo_audio_url ||
      currentTrack.mp3_url ||
      currentTrack.demo_url ||
      currentTrack.audio_url ||
      currentTrack.download_url_mp3 ||
      currentTrack.preview_url ||
      currentTrack.demo_file ||
      currentTrack.tagged_file ||
      currentTrack.file_url ||
      currentTrack.url_file
    );
  }, [currentTrack?.id ? String(currentTrack.id) : null]);
  const { url: secureAudio } = useSecureUrl(rawAudioUrl);

  const formatTime = (s) => {
    if (isNaN(s) || s === Infinity) return '0:00';
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current) {
      console.log("[StickyPlayer] WaveformRef not ready");
      return;
    }

    if (!wavesurfer.current) {
      console.log("[StickyPlayer] Initializing WaveSurfer...");

      // Create hidden audio element
      const el = document.createElement('audio');
      el.crossOrigin = "anonymous";
      el.preload = "auto";
      el.style.display = "none";
      document.body.appendChild(el);
      audioEl.current = el;

      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        media: el,
        waveColor: '#333',
        progressColor: '#fff',
        cursorColor: '#fff',
        cursorWidth: 2,
        barWidth: 2,
        barGap: 2,
        barRadius: 2,
        height: 40,
        normalize: true,
        interact: true,
      });

      wavesurfer.current.on('ready', () => {
        const duration = wavesurfer.current.getDuration();
        console.log("[StickyPlayer] WaveSurfer Ready. Duration:", duration);
        setTotalTime(formatTime(duration));
        setIsReady(true);
      });

      wavesurfer.current.on('error', (err) => {
        console.error("[StickyPlayer] WaveSurfer Error:", err);
      });

      wavesurfer.current.on('timeupdate', () => {
        setCurrentTime(formatTime(wavesurfer.current.getCurrentTime()));
      });

      wavesurfer.current.on('finish', () => {
        console.log("[StickyPlayer] Track finished");
        playNext();
      });

      const handleResize = () => {
        // WaveSurfer 7 handles most resizing automatically,
        // but we can trigger a redraw if layout shift occurs.
        // wavesurfer.current?.redraw(); // Optional in v7
      };
      window.addEventListener('resize', handleResize);

      return () => {
        console.log("[StickyPlayer] Destroying WaveSurfer");
        window.removeEventListener('resize', handleResize);
        if (wavesurfer.current) {
          wavesurfer.current.destroy();
          wavesurfer.current = null;
        }
        if (audioEl.current && audioEl.current.parentNode) {
          audioEl.current.parentNode.removeChild(audioEl.current);
        }
      };
    }
  }, [waveformRef.current]); // Using .current here is risky but often works with state-triggering re-renders

  // Track loading
  useEffect(() => {
    if (wavesurfer.current && secureAudio) {
      console.log("[StickyPlayer] Loading new track:", secureAudio);

      // IMPORTANT: Stop and reset current audio immediately
      // to prevent the "3-second overlap" during loading.
      setIsReady(false);
      wavesurfer.current.pause();
      if (audioEl.current) {
        audioEl.current.src = "";
        audioEl.current.load(); // Reset media state
      }

      wavesurfer.current.load(secureAudio);
    } else if (wavesurfer.current && !secureAudio) {
      console.log("[StickyPlayer] SecureAudio is null, sitting idle");
      setIsReady(false);
    }
  }, [secureAudio]);

  // Volume & Play
  useEffect(() => {
    if (wavesurfer.current) {
      wavesurfer.current.setVolume(isMuted ? 0 : volume);
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const ws = wavesurfer.current;
    if (ws && isReady) {
      if (isPlaying) {
        console.log("[StickyPlayer] Playing...");
        const playPromise = ws.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn("[StickyPlayer] Playback prevented:", error);
          });
        }
      } else {
        console.log("[StickyPlayer] Pausing...");
        ws.pause();
      }
    }
  }, [isPlaying, isReady, currentTrack?.id ? String(currentTrack.id) : null]);

  // Volume drag
  const handleVolumeMove = useCallback((e) => {
    const track = document.getElementById('sp-vol-track');
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const offsetY = rect.bottom - e.clientY;
    let percent = offsetY / rect.height;
    setVolume(Math.max(0, Math.min(1, percent)));
  }, [setVolume]);

  const startVolumeDrag = (e) => {
    handleVolumeMove(e);
    const onMouseMove = (m) => handleVolumeMove(m);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Stats
  useEffect(() => {
    if (!isPlaying || !currentTrack) return;
    const timer = setTimeout(() => {
      apiClient.post(`/products/${currentTrack.id}/play`).catch(() => { });
    }, 30000);
    return () => clearTimeout(timer);
  }, [currentTrack?.id, isPlaying]);

  if (!currentTrack) return null;

  const navigateToProduct = () => {
    navigate(`/${currentTrack.product_type || 'beat'}/${currentTrack.public_slug || currentTrack.id}`);
  };

  const isOwnRequest = currentTrack.is_custom_request && currentTrack.buyer_id === localStorage.getItem('userId');

  return (
    <div className="fixed bottom-0 left-0 w-full z-[9990] bg-[#0a0a0a] border-t border-white/5 h-[90px] md:h-[100px] flex items-center justify-between px-4 md:px-10 transition-transform duration-300 translate-y-0 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">

      {/* SP-LEFT */}
      <div className="flex items-center gap-4 flex-1 min-w-0 md:max-w-[30%]">
        <img
          src={secureCover || '/placeholder.jpg'}
          alt="Cover"
          className="w-12 h-12 md:w-16 md:h-16 rounded shadow-lg object-cover cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
          onClick={navigateToProduct}
        />
        <div className="flex flex-col min-w-0">
          <div
            onClick={navigateToProduct}
            className="text-[#eee] font-bold text-sm md:text-base leading-tight truncate cursor-pointer hover:text-white transition-colors uppercase tracking-tight"
          >
            {currentTrack.name?.replace(/_/g, ' ').replace(/\.(mp3|wav|zip|rar)$/i, '') || 'Untitled'}
          </div>
          <div className="text-zinc-500 text-[10px] md:text-xs font-black uppercase tracking-[0.1em] truncate mt-0.5">
            <Link to={`/@${currentTrack.users?.nickname || currentTrack.producer_nickname}`} className="hover:text-zinc-300 transition-colors">
              {currentTrack.users?.nickname || currentTrack.producer_nickname || 'Productor'}
            </Link>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-3 ml-4">
          <button onClick={handleLike} className={`text-lg transition-colors ${isLiked ? 'text-red-500' : 'text-zinc-500 hover:text-white'}`}>
            <i className={`bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'}`}></i>
          </button>
          <button onClick={() => setIsShareModalOpen(true)} className="text-lg text-zinc-500 hover:text-white transition-colors">
            <i className="bi bi-share"></i>
          </button>
          <button onClick={navigateToProduct} className="text-lg text-zinc-500 hover:text-white transition-colors">
            <i className="bi bi-download"></i>
          </button>
        </div>
      </div>

      {/* SP-CENTER */}
      <div className="flex flex-col items-center flex-[2] max-w-[45%] gap-2">
        <div className="flex items-center w-full gap-3 text-[10px] font-black text-zinc-500 tracking-[0.1em]">
          <span className="w-8 text-right">{currentTime}</span>
          <div ref={waveformRef} className="flex-1 h-10 relative" id="sp-waveform-wrapper" />
          <span className="w-8 text-left">{totalTime}</span>
        </div>
        <div className="flex items-center gap-8 md:gap-12">
          <button onClick={playPrev} className="text-zinc-500 hover:text-white text-xl md:text-2xl transition-all">
            <i className="bi bi-skip-start-fill"></i>
          </button>
          <button
            onClick={togglePlay}
            className="w-10 h-10 md:w-12 md:h-12 bg-white text-black rounded-full flex items-center justify-center text-xl md:text-2xl hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'} ${!isPlaying ? 'ml-0.5' : ''}`}></i>
          </button>
          <button onClick={playNext} className="text-zinc-500 hover:text-white text-xl md:text-2xl transition-all">
            <i className="bi bi-skip-end-fill"></i>
          </button>
        </div>
      </div>

      {/* SP-RIGHT */}
      <div className="flex items-center justify-end gap-3 md:gap-5 flex-1 md:max-w-[25%] relative">
        <div className="hidden lg:block relative group/volume">
          <button onClick={() => setIsMuted(!isMuted)} className="text-zinc-500 hover:text-white text-2xl transition-colors">
            <i className={`bi ${isMuted || volume === 0 ? 'bi-volume-mute-fill' : (volume < 0.5 ? 'bi-volume-down-fill' : 'bi-volume-up-fill')}`}></i>
          </button>

          <div className="absolute bottom-[35px] left-1/2 -translate-x-1/2 w-8 h-32 bg-[#111] border border-white/5 rounded-lg p-2 opacity-0 group-hover/volume:opacity-100 transition-all pointer-events-none group-hover/volume:pointer-events-auto shadow-2xl flex flex-col items-center">
            <div
              id="sp-vol-track"
              className="w-1 h-full bg-[#333] rounded-full relative cursor-pointer"
              onMouseDown={startVolumeDrag}
            >
              <div
                className="absolute bottom-0 left-0 w-full bg-white rounded-full"
                style={{ height: `${volume * 100}%` }}
              />
            </div>
          </div>
        </div>

        {currentTrack.is_custom_request && (
          <button
            onClick={() => navigate('/feed')}
            className="hidden xl:flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-colors border border-white/5"
          >
            <i className="bi bi-eye"></i> <span>DETALLES</span>
          </button>
        )}

        <button
          onClick={() => currentTrack.is_custom_request ? navigate('/feed') : setIsLicenseModalOpen(true)}
          disabled={isOwnRequest}
          className="flex items-center gap-2 bg-white hover:bg-zinc-200 text-black px-4 md:px-7 py-2.5 rounded-full font-black text-[10px] md:text-xs uppercase tracking-[0.15em] transition-all disabled:opacity-50 shadow-md"
        >
          <i className={`bi ${currentTrack.is_custom_request ? 'bi-briefcase' : 'bi-cart-plus'}`}></i>
          <span>
            {currentTrack.is_custom_request
              ? (isOwnRequest ? 'TU SOLICITUD' : 'TOMAR TRABAJO')
              : (currentTrack.is_free ? 'FREE' : formatPrice(currentTrack.price_basic))}
          </span>
        </button>

        <button onClick={closePlayer} className="text-zinc-500 hover:text-white transition-colors ml-1">
          <i className="bi bi-x-lg text-lg md:text-xl"></i>
        </button>
      </div>

      {/* Progress Bar top of player on mobile */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-white/5 md:hidden">
        <div
          className="h-full bg-white transition-all duration-200"
          style={{ width: `${(wavesurfer.current?.getCurrentTime() / wavesurfer.current?.getDuration()) * 100 || 0}%` }}
        />
      </div>

      {/* Modals */}
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} product={currentTrack} />
      <ComparisonModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
        licenses={currentTrack.licenses || []}
        onSelect={(licenseId) => navigate(`/checkout?productId=${currentTrack.id}&licenseId=${licenseId}`)}
      />
    </div>
  );
};

export default StickyPlayer;
