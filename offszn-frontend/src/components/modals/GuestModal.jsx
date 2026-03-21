import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { X, Rocket, Music, Lock } from 'lucide-react';

const GuestModal = () => {
    const { isGuestModalOpen, closeGuestModal } = useAuthStore();

    if (!isGuestModalOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={(e) => e.target === e.currentTarget && closeGuestModal()}
        >
            <div className="relative w-[440px] max-w-[calc(100vw-32px)] bg-[#111] border border-white/10 rounded-[24px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">

                {/* Close Button */}
                <button
                    onClick={closeGuestModal}
                    className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 border border-white/10 text-[#888] hover:text-white hover:bg-white/10 transition-all"
                >
                    <X size={18} />
                </button>

                {/* Header Background */}
                <div className="h-32 bg-gradient-to-br from-violet-600/30 to-purple-900/10 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                    <div className="w-16 h-16 bg-black/50 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center shadow-xl">
                        <Lock className="w-8 h-8 text-white/90" />
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 text-center">
                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                        Acción Exclusiva
                    </h3>
                    <p className="text-sm text-[#888] mb-8 leading-relaxed">
                        Para poder continuar necesitas ser parte de la comunidad OFFSZN. Únete ahora para desbloquear todas las funcionalidades.
                    </p>

                    <div className="flex flex-col gap-3">
                        <Link
                            to="/auth/register"
                            onClick={closeGuestModal}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)]"
                        >
                            Crear cuenta gratis <Rocket size={18} />
                        </Link>

                        <Link
                            to="/auth/login"
                            onClick={closeGuestModal}
                            className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all"
                        >
                            Ya tengo cuenta
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default GuestModal;
