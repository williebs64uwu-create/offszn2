import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUploadStore } from '../../store/uploadStore';
import { useAuth } from '../../store/authStore';
import { useBeatUpload } from '../../hooks/useBeatUpload';
import { useYouTubeSync } from '../../hooks/useYouTubeSync';
import { initGoogleAuth, requestAuthToken } from '../../utils/YouTubeUploader';
import { PublishOverlay, ExitConfirmModal, FirstTimeModal } from '../../components/UploadModals';
import { X, ChevronRight, ChevronLeft, UploadCloud, Save, Sparkles, Youtube, Zap, Shield, HelpCircle, Play, Pause, Music } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';

// New specialized steps
import Step1Details from './steps/Step1Details';
import Step2Files from './steps/Step2Files';
import Step3Pricing from './steps/Step3Pricing';
import Step4Review from './steps/Step4Review';
import TypeSelector from './steps/TypeSelector';

export default function UploadWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    currentStep, productType, title, tags, coverImage, files,
    nextStep, prevStep, resetForm, updateField,
    youtubeSync, youtubeStatus, youtubeProgress
  } = useUploadStore();

  const { handleSaveProduct, isPublishing, uploadProgress } = useBeatUpload();
  const { handleSync } = useYouTubeSync();

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const wavesurferRef = useRef(null);
  const waveformRef = useRef(null);

  // Determinar qué archivo usar para el player
  const previewFile = files.mp3_tagged || files.mp3_low || files.wav_untagged;

  useEffect(() => {
    if (!waveformRef.current) return;

    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'rgba(255, 255, 255, 0.1)',
      progressColor: '#8b5cf6',
      cursorColor: 'transparent',
      barWidth: 2,
      barGap: 3,
      responsive: true,
      height: 32,
      barRadius: 2,
    });

    wavesurferRef.current.on('play', () => setIsPlaying(true));
    wavesurferRef.current.on('pause', () => setIsPlaying(false));
    wavesurferRef.current.on('ready', () => {
      setDuration(wavesurferRef.current.getDuration());
    });
    wavesurferRef.current.on('timeupdate', () => {
      setCurrentTime(wavesurferRef.current.getCurrentTime());
    });

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (wavesurferRef.current && previewFile && previewFile instanceof File) {
      const url = URL.createObjectURL(previewFile);
      wavesurferRef.current.load(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [previewFile]);

  const togglePlay = () => {
    if (wavesurferRef.current && previewFile) {
      wavesurferRef.current.playPause();
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Confirmation on exit if form is partially filled
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (title || tags.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [title, tags]);

  // Initialize Google Auth script early to preserve user gesture on click
  useEffect(() => {
    // We load it unconditionally on mount so it's ready when/if the user decides to sync
    initGoogleAuth().catch(err => console.error("Early Google Auth init failed:", err));
  }, []);

  const handlePublish = async (isDraft = false) => {
    // Prepare files for the hook
    const fileObjects = {
      coverFile: coverImage?.file || null,
      mp3File: files.mp3_tagged,
      wavFile: files.wav_untagged,
      stemsFile: files.stems,
      zipFile: files.zip_file // New mapping for Kits/Presets
    };

    const formState = useUploadStore.getState();

    // Acquire YouTube Token EARLY (preserving user gesture)
    let ytToken = null;
    if (youtubeSync && !isDraft) {
      try {
        console.log('🎬 Starting Publish Flow with YouTube Sync...');
        useUploadStore.setState({ youtubeStatus: 'authorizing', youtubeProgress: 0 });

        // IMPORTANT: requestAuthToken MUST succeed here. If it's not ready, we wait a tiny bit
        // but not too much or we lose the gesture.
        ytToken = await requestAuthToken();

        console.log('🎫 YouTube Token acquired, proceeding with OFFSZN upload...');
        useUploadStore.setState({ youtubeStatus: 'idle' }); // Reset for OFFSZN stage
      } catch (err) {
        console.error("YouTube Auth failed:", err);
        useUploadStore.setState({ youtubeStatus: 'idle' });
        if (!confirm("Fallo la autorización de YouTube. ¿Quieres continuar publicando solo en OFFSZN?")) {
          return;
        }
      }
    }

    const result = await handleSaveProduct(fileObjects, formState, isDraft);

    if (result.success) {
      // Phase 20: YouTube Sync Logic
      if (youtubeSync && !isDraft && result.data?.[0]?.id) {
        try {
          await handleSync(result.data[0].id, ytToken);
        } catch (err) {
          console.error("YouTube Sync failed, but product was saved:", err);
          alert('Tu beat se publicó con éxito en OFFSZN, pero la sincronización con YouTube falló: ' + err.message);
        }
      }

      resetForm();
      navigate('/dashboard');
    } else {
      alert('Error al publicar: ' + result.error);
    }
  };

  const steps = [
    { id: 1, label: 'Detalles', component: <Step1Details /> },
    { id: 2, label: 'Archivos', component: <Step2Files /> },
    { id: 3, label: 'Precios', component: <Step3Pricing /> },
    { id: 4, label: 'Revisión', component: <Step4Review /> },
  ];

  // Si estamos en el paso 0, solo mostrar el selector de tipo
  if (currentStep === 0) {
    return <TypeSelector />;
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-violet-500/30 overflow-x-hidden">

      {/* --- PREMIUM HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between items-center shadow-2xl h-[72px]">
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2.5 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all border border-transparent hover:border-white/10 group"
          >
            <X size={18} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>

          <div className="h-8 w-px bg-white/10"></div>

          <div className="flex flex-col">
            <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-white">
              STUDIO <span className="text-violet-500">PIPELINE</span>
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">
              Publicando {productType === 'beat' ? 'Instrumental' : 'Producto'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => handlePublish(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-all"
          >
            <Save size={14} />
            Borrador
          </button>

          <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-widest">Live Auto-Save</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto pt-[120px] pb-[140px] px-6 min-h-screen">

        {/* --- LEGACY STEP INDICATOR --- */}
        <div className="relative flex justify-between items-center mb-16 max-w-2xl mx-auto px-4">
          {/* Background Line */}
          <div className="absolute top-1/2 left-5 right-5 h-[2px] bg-white/5 -translate-y-1/2 z-0"></div>

          {/* Progress Line */}
          <div
            className="absolute top-1/2 left-5 h-[2px] bg-gradient-to-r from-violet-600 to-indigo-500 -translate-y-1/2 z-0 transition-all duration-700 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
            style={{ width: `calc(${((currentStep - 1) / (steps.length - 1)) * 100}% - 10px)` }}
          ></div>

          {steps.map((s) => (
            <div
              key={s.id}
              className="relative z-10 flex flex-col items-center group cursor-pointer"
              onClick={() => {
                if (s.id < currentStep) useUploadStore.setState({ currentStep: s.id });
              }}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 border-2
                  ${currentStep === s.id
                    ? 'bg-violet-600 border-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] scale-110'
                    : currentStep > s.id
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : 'bg-black border-white/10 text-gray-600 group-hover:border-white/30'}`}
              >
                {currentStep > s.id ? <Zap size={14} fill="currentColor" /> : s.id}
              </div>
              <span className={`absolute top-12 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${currentStep >= s.id ? 'text-white' : 'text-gray-600'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* --- STEP CONTENT --- */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {steps.find(s => s.id === currentStep)?.component}
        </div>
      </main>

      {/* --- LEGACY FIXED FOOTER --- */}
      <footer className="fixed bottom-0 left-0 right-0 h-[80px] bg-black/90 backdrop-blur-xl border-t border-white/10 z-[100] px-8 flex items-center justify-center shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        <div className="w-full max-w-[1200px] grid grid-cols-[200px_1fr_200px] items-center gap-8">

          {/* Navigation Left */}
          <div className="flex justify-start">
            <button
              onClick={prevStep}
              disabled={isPublishing}
              className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-all disabled:opacity-0
                ${currentStep === 1 ? 'pointer-events-none opacity-0' : ''}`}
            >
              <ChevronLeft size={16} />
              Volver
            </button>
          </div>

          {/* Player Center */}
          <div className="flex items-center gap-6 bg-white/[0.03] border border-white/5 rounded-2xl p-2 px-6 h-14 flex-1 max-w-2xl mx-auto">
            <button
              onClick={togglePlay}
              disabled={!previewFile}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90
                ${previewFile
                  ? 'bg-violet-600 text-white hover:bg-violet-500 hover:shadow-violet-500/20'
                  : 'bg-white/5 text-gray-700 cursor-not-allowed'}`}
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="ml-0.5" fill="currentColor" />}
            </button>

            <div className="flex-1 flex flex-col justify-center">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Music size={10} className={previewFile ? 'text-violet-500' : 'text-gray-700'} />
                  {previewFile ? previewFile.name : 'Ningún archivo seleccionado'}
                </p>
                <span className="text-[9px] font-mono text-gray-500">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              <div ref={waveformRef} className="w-full opacity-80 hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Navigation Right */}
          <div className="flex justify-end gap-4">
            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-violet-500 hover:text-white transition-all shadow-xl active:scale-95"
              >
                Continuar
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={() => handlePublish(false)}
                disabled={isPublishing || youtubeStatus === 'authorizing'}
                className="flex items-center gap-2 bg-violet-600 text-white px-10 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-violet-500 transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)] disabled:opacity-50 active:scale-95 translate-y-0 hover:-translate-y-0.5"
              >
                {isPublishing || youtubeStatus === 'authorizing' ? 'Publicando...' : `Lanzar ${productType === 'beat' ? 'Beat' : 'Item'}`}
                <Sparkles size={14} />
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* STATUS OVERLAYS */}
      <PublishOverlay
        isVisible={isPublishing || ['authorizing', 'rendering', 'uploading'].includes(youtubeStatus)}
        message={
          youtubeStatus === 'authorizing' ? 'Esperando Autorización de Google' :
            youtubeStatus === 'rendering' ? 'Renderizando Video' :
              youtubeStatus === 'uploading' ? 'Sincronizando YouTube' :
                uploadProgress.message
        }
        progress={youtubeStatus !== 'idle' ? youtubeProgress : uploadProgress.progress}
        subMessage={
          youtubeStatus === 'authorizing' ? 'Por favor, acepta el permiso en la ventana emergente.' :
            youtubeStatus === 'rendering' || youtubeStatus === 'uploading' ? 'Procesando visualizer 1080p, por favor espera.' :
              ''
        }
      />

    </div>
  );
}
