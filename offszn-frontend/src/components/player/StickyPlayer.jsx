import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { usePlayerStore } from '../../store/playerStore';
import { useCurrencyStore } from '../../store/currencyStore';
import { useSecureUrl } from '../../hooks/useSecureUrl';
import { Link } from 'react-router-dom';
import {
  BiSkipPrevious,
  BiPlay,
  BiPause,
  BiSkipNext,
  BiVolumeFull,
  BiVolumeMute,
  BiCartAdd,
  BiX,
  BiHeart,
  BiDownload
} from 'react-icons/bi';

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
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [totalTime, setTotalTime] = useState('--:--');
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);

  // Secure URLs
  const { url: secureCover } = useSecureUrl(currentTrack?.image_url);

  // Resolve Audio URL
  // Priority: demo -> mp3 -> generic audio_url
  const rawAudioUrl = currentTrack ? (currentTrack.demo_audio_url || currentTrack.download_url_mp3 || currentTrack.audio_url) : null;
  const { url: secureAudio } = useSecureUrl(rawAudioUrl);

  // 1. Inicializar WaveSurfer cuando cambia el track Y tenemos la URL segura
  useEffect(() => {
    if (!currentTrack || !waveformRef.current || !secureAudio) return;

    if (wavesurfer.current) {
      wavesurfer.current.destroy();
    }

    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#444',
      progressColor: '#8b5cf6',
      cursorColor: 'transparent',
      barWidth: 2,
      barGap: 3,
      barRadius: 2,
      height: 30,
      normalize: true,
      backend: 'MediaElement',
    });

    wavesurfer.current.load(secureAudio);
    wavesurfer.current.setVolume(volume);

    wavesurfer.current.on('ready', () => {
      // Check validation: Duration might be Infinity/NaN if streaming? Usually fine with MediaElement
      const duration = wavesurfer.current.getDuration();
      if (isFinite(duration)) setTotalTime(formatTime(duration));

      if (isPlaying) {
        const playPromise = wavesurfer.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => console.error("Auto-play prevented:", error));
        }
      }
    });

    wavesurfer.current.on('audioprocess', () => {
      setCurrentTime(formatTime(wavesurfer.current.getCurrentTime()));
    });

    wavesurfer.current.on('finish', () => {
      playNext();
    });

    return () => {
      if (wavesurfer.current) wavesurfer.current.destroy();
    };
  }, [currentTrack?.id, secureAudio]); // Re-run if track ID changes OR secure URL resolves

  // 2. Controlar Play/Pause
  useEffect(() => {
    if (!wavesurfer.current) return;
    try {
      isPlaying ? wavesurfer.current.play() : wavesurfer.current.pause();
    } catch (err) { console.warn(err); }
  }, [isPlaying]);

  // 3. Controlar Volumen
  useEffect(() => {
    if (wavesurfer.current) {
      wavesurfer.current.setVolume(isMuted ? 0 : volume);
    }
  }, [volume, isMuted]);

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleVolumeToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(prevVolume);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      setVolume(0);
    }
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full h-[90px] bg-[#0A0A0A] border-t border-white/5 flex items-center justify-between px-4 md:px-8 z-[9999] backdrop-blur-xl shadow-2xl">

      {/* LEFT: INFO */}
      <div className="flex items-center gap-4 w-[25%] min-w-[180px]">
        <Link to={`/producto/${currentTrack.id}`} className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 group">
          <img
            src={secureCover || '/placeholder.jpg'}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <i className="bi bi-arrows-fullscreen text-white text-xs"></i>
          </div>
        </Link>
        <div className="flex flex-col overflow-hidden">
          <Link to={`/producto/${currentTrack.id}`} className="text-white text-sm font-bold truncate hover:text-violet-400 transition-colors">
            {currentTrack.name}
          </Link>
          <Link to={`/u/${currentTrack.users?.nickname || currentTrack.producer_nickname}`} className="text-[11px] text-zinc-500 truncate hover:text-zinc-300">
            {currentTrack.users?.nickname || currentTrack.producer_nickname || 'Productor'}
          </Link>
        </div>
      </div>

      {/* CENTER: CONTROLS & WAVEFORM */}
      <div className="flex flex-col items-center justify-center flex-1 max-w-[600px] px-4">
        <div className="flex items-center gap-6 mb-2">
          <button onClick={playPrev} className="text-zinc-400 hover:text-white text-2xl transition-all hover:scale-110">
            <BiSkipPrevious />
          </button>

          <button
            onClick={togglePlay}
            className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center text-2xl hover:scale-105 transition-all shadow-lg active:scale-95"
          >
            {isPlaying ? <BiPause /> : <BiPlay className="ml-1" />}
          </button>

          <button onClick={playNext} className="text-zinc-400 hover:text-white text-2xl transition-all hover:scale-110">
            <BiSkipNext />
          </button>
        </div>

        <div className="flex items-center w-full gap-3 text-[10px] font-bold text-zinc-600">
          <span className="w-8 text-right tabular-nums">{currentTime}</span>
          <div ref={waveformRef} className="flex-1 min-w-[200px]" />
          <span className="w-8 text-left tabular-nums">{totalTime}</span>
        </div>
      </div>

      {/* RIGHT: ACTIONS & VOLUME */}
      <div className="flex items-center justify-end gap-6 w-[25%] min-w-[200px]">
        <div className="hidden lg:flex items-center gap-3">
          <button onClick={handleVolumeToggle} className="text-zinc-400 hover:text-white text-xl transition-colors">
            {isMuted || volume === 0 ? <BiVolumeMute /> : <BiVolumeFull />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (parseFloat(e.target.value) > 0) setIsMuted(false);
            }}
            className="w-24 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
          />
        </div>

        <button className="bg-violet-600 text-white px-5 py-2.5 rounded-full text-xs font-black flex items-center gap-2 hover:bg-violet-500 transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0">
          <BiCartAdd size={18} />
          <span>{currentTrack.is_free ? 'GRATIS' : formatPrice(currentTrack.price_basic)}</span>
        </button>

        <button onClick={closePlayer} className="text-zinc-600 hover:text-white transition-colors">
          <BiX size={24} />
        </button>
      </div>
    </div>
  );
};

export default StickyPlayer;
