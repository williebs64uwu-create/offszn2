import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUploadStore } from '../../store/uploadStore';
import { useAuth } from '../../store/authStore';
import { useBeatUpload } from '../../hooks/useBeatUpload';
import { PublishOverlay, ExitConfirmModal, FirstTimeModal } from '../../components/UploadModals';
import { X, ChevronRight, ChevronLeft, UploadCloud, Save, Sparkles, Youtube } from 'lucide-react';

// New specialized steps
import Step1Details from './steps/Step1Details';
import Step2Files from './steps/Step2Files';
import Step3Pricing from './steps/Step3Pricing';
import Step4Review from './steps/Step4Review';

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
      coverFile: coverImage?.file || null, // Note: Step1 needs to handle file conversion if using DataUrl
      mp3File: files.mp3_tagged,
      wavFile: files.wav_untagged,
      stemsFile: files.stems
    };

    // We get the full state from store
    const formState = useUploadStore.getState();

    const result = await handleSaveProduct(fileObjects, formState, isDraft);

    if (result.success) {
      resetForm();
      navigate('/dashboard'); // Or to success page
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

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-32">

      {/* 1. Header Minimalista */}
      <header className="sticky top-0 z-[40] bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-black uppercase tracking-[0.2em] text-white">
              Subir {productType === 'beat' ? 'Nuevo Beat' : 'Producto'}
            </h1>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{steps[currentStep - 1].label}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handlePublish(true)}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border border-white/5 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all"
          >
            <Save size={14} />
            Guardar Borrador
          </button>
          <div className="h-4 w-[1px] bg-white/10 hidden md:block mx-1"></div>
          <button
            onClick={() => navigate('/dashboard/import-youtube')}
            className="p-2 text-red-500 hover:text-red-400 transition-colors flex items-center gap-2 group"
          >
            <Youtube size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:block transition-all">Importar Beats</span>
          </button>
          <button className="p-2 text-violet-400 hover:text-violet-300 transition-colors">
            <Sparkles size={18} />
          </button>
        </div>
      </header>

      {/* 2. Stepper Visual */}
      <div className="max-w-4xl mx-auto mt-12 px-6">
        <div className="flex justify-between items-center relative mb-16">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5 -z-10 -translate-y-1/2"></div>
          {/* Barra de progreso activa */}
          <div
            className="absolute top-1/2 left-0 h-[1.5px] bg-violet-500 -z-10 -translate-y-1/2 transition-all duration-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>

          {steps.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-3 bg-black px-4">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-500 border
                  ${currentStep >= s.id
                    ? 'border-violet-500 bg-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] scale-110'
                    : 'border-white/10 bg-[#0a0a0a] text-gray-600'}`}
              >
                {s.id}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-500 ${currentStep >= s.id ? 'text-white' : 'text-gray-700'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* 3. Contenedor del Paso Actual */}
        <div className="min-h-[500px]">
          {steps[currentStep - 1].component}
        </div>
      </div>

      {/* 4. Footer de Navegación */}
      <footer className="fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-xl border-t border-white/5 p-6 z-[40]">
        <div className="max-w-4xl mx-auto flex justify-between items-center">

          <button
            onClick={prevStep}
            disabled={currentStep === 1 || isPublishing}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
              ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            <ChevronLeft size={16} />
            Anterior
          </button>

          <div className="flex gap-4">
            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-white text-black text-[12px] font-black uppercase tracking-[0.2em] hover:bg-gray-200 transition-all shadow-xl shadow-white/5 active:scale-[0.98]"
              >
                Siguiente
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={() => handlePublish(false)}
                disabled={isPublishing}
                className="flex items-center gap-3 px-12 py-4 rounded-2xl bg-violet-600 text-white text-[12px] font-black uppercase tracking-[0.2em] hover:bg-violet-500 transition-all shadow-2xl shadow-violet-900/40 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isPublishing ? 'Procesando...' : 'Publicar Beat'}
                {!isPublishing && <UploadCloud size={20} />}
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Modales de Estado */}
      <PublishOverlay isVisible={isPublishing} message={uploadProgress.message} />
      {/* Aquí podrías añadir un ExitConfirmModal si es necesario */}

    </div>
  );
}


