import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUploadStore } from '../../store/uploadStore';
import { useAuth } from '../../store/authStore';
import { useBeatUpload } from '../../hooks/useBeatUpload';
import { PublishOverlay, ExitConfirmModal, FirstTimeModal } from '../../components/UploadModals';
import { X, ChevronRight, ChevronLeft, UploadCloud, Save, Sparkles, Youtube, Zap, Shield, HelpCircle } from 'lucide-react';

// New specialized steps
import Step1Details from './steps/Step1Details';
import Step2Files from './steps/Step2Files';
import Step3Pricing from './steps/Step3Pricing';
import Step4Review from './steps/Step4Review';
import TypeSelector from './steps/TypeSelector';

export default function UploadBeats() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    currentStep, productType, title, tags, coverImage, files,
    nextStep, prevStep, resetForm, updateField
  } = useUploadStore();

  const { handleSaveProduct, isPublishing, uploadProgress } = useBeatUpload();

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
    const result = await handleSaveProduct(fileObjects, formState, isDraft);

    if (result.success) {
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
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="absolute top-10 left-10 p-3 rounded-2xl hover:bg-white/10 text-gray-500 hover:text-white transition-all border border-transparent hover:border-white/5 group z-50"
        >
          <X size={20} className="group-hover:rotate-90 transition-transform duration-500" />
        </button>
        <TypeSelector />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-violet-500/30 pb-32">

      {/* --- PREMIUM HEADER --- */}
      <header className="sticky top-0 z-[50] bg-black/60 backdrop-blur-2xl border-b border-white/5 px-8 py-5 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate(-1)}
            className="p-3 rounded-2xl hover:bg-white/10 text-gray-500 hover:text-white transition-all border border-transparent hover:border-white/5 group"
          >
            <X size={20} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>

          <div className="h-10 w-px bg-white/5"></div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={10} className="text-violet-500" />
              <span className="text-[9px] font-black text-violet-500 uppercase tracking-[0.3em]">Studio Pipeline</span>
            </div>
            <h1 className="text-lg font-black uppercase tracking-widest text-white leading-none">
              Publishing <span className="text-violet-500">{productType === 'beat' ? 'Beat' : 'Item'}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Auto-Save Active</span>
          </div>

          <button
            onClick={() => handlePublish(true)}
            className="hidden lg:flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all shadow-xl"
          >
            <Save size={14} />
            Borrador
          </button>

          <button
            onClick={() => navigate('/dashboard/import-youtube')}
            className="hidden sm:flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all text-[10px] font-black uppercase tracking-widest group shadow-2xl"
          >
            <Youtube size={16} />
            <span>YT Import</span>
          </button>

          <button className="p-3 rounded-2xl bg-violet-500/5 border border-violet-500/10 text-violet-500 hover:text-white hover:bg-violet-500 transition-all shadow-2xl">
            <HelpCircle size={18} />
          </button>
        </div>
      </header>

      {/* --- STEPPER VISUAL --- */}
      <div className="max-w-5xl mx-auto mt-20 px-8">
        <div className="flex justify-between items-center relative mb-24">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5 -z-10 -translate-y-1/2"></div>

          {/* Active Progress Bar */}
          <div
            className="absolute top-1/2 left-0 h-[2px] bg-gradient-to-r from-violet-600 to-indigo-500 -z-10 -translate-y-1/2 transition-all duration-700 shadow-[0_0_30px_rgba(139,92,246,0.6)]"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>

          {steps.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-4 bg-black px-6 group">
              <div
                className={`w-14 h-14 rounded-3xl flex items-center justify-center text-sm font-black transition-all duration-700 border
                  ${currentStep >= s.id
                    ? 'border-violet-500 bg-violet-500 text-white shadow-[0_0_40px_rgba(139,92,246,0.4)] scale-110'
                    : 'border-white/5 bg-[#0a0a0a] text-gray-700 group-hover:border-white/20'}`}
              >
                {currentStep > s.id ? (
                  <Zap size={20} className="animate-pulse" />
                ) : (
                  s.id
                )}
              </div>
              <div className="flex flex-col items-center">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${currentStep >= s.id ? 'text-white' : 'text-gray-800'}`}>
                  {s.label}
                </span>
                {currentStep === s.id && (
                  <div className="w-1 h-1 rounded-full bg-violet-500 mt-2 animate-bounce"></div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* --- MAIN CONTENT HUB --- */}
        <main className="min-h-[600px] bg-[#050505] rounded-[64px] border border-white/5 p-12 shadow-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-20 text-white opacity-[0.01] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <UploadCloud size={400} />
          </div>

          <div className="relative z-10">
            {steps.find(s => s.id === currentStep)?.component}
          </div>
        </main>
      </div>

      {/* --- NAVIGATION FOOTER --- */}
      <footer className="fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-2xl border-t border-white/5 p-8 z-[50] shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
        <div className="max-w-5xl mx-auto flex justify-between items-center">

          <button
            onClick={prevStep}
            disabled={isPublishing}
            className={`group flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all
              ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-gray-500 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 shadow-2xl'}`}
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            {currentStep === 1 ? 'Volver al Selector' : 'Anterior Step'}
          </button>

          <div className="flex gap-6">
            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                className="group flex items-center gap-4 px-12 py-5 rounded-[28px] bg-white text-black text-[12px] font-black uppercase tracking-[0.3em] hover:bg-violet-500 hover:text-white transition-all shadow-2xl active:scale-95"
              >
                Continuar
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                onClick={() => handlePublish(false)}
                disabled={isPublishing}
                className="group flex items-center gap-4 px-16 py-5 rounded-[28px] bg-violet-600 text-white text-[12px] font-black uppercase tracking-[0.3em] hover:bg-violet-500 transition-all shadow-2xl shadow-violet-900/40 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
                {isPublishing ? 'Publishing...' : `Lanzar ${productType || 'Item'}`}
                {!isPublishing && <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />}
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* STATUS OVERLAYS */}
      <PublishOverlay isVisible={isPublishing} message={uploadProgress.message} />

    </div>
  );
}


