import React from 'react';
import { useUploadStore } from '../../../store/uploadStore';
import { BsBoombox, BsInfinity, BsSliders, BsVinyl } from 'react-icons/bs';
import { ChevronRight } from 'lucide-react';

const TYPES = [
    {
        id: 'beat',
        title: 'Beat',
        description: 'Sube tus instrumentales y vendelas con licencias profesionales.',
        icon: BsVinyl,
        color: '#8B5CF6',
        bg: 'rgba(139, 92, 246, 0.1)',
        badge: 'Popular',
        badgeClass: 'bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-black shadow-[0_4px_15px_rgba(255,215,0,0.3)]',
        animDelay: '0.2s'
    },
    {
        id: 'drumkit',
        title: 'Drum Kit',
        description: 'Comparte tus mejores sonidos, one-shots y loops de batería.',
        icon: BsBoombox,
        color: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.1)',
        badge: null,
        animDelay: '0.3s'
    },
    {
        id: 'preset',
        title: 'Preset Banks',
        description: 'Vende bancos de sonidos para VSTs como Serum, Analog Lab, etc.',
        icon: BsSliders,
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.1)',
        badge: null,
        animDelay: '0.4s'
    },
    {
        id: 'loopkit',
        title: 'Loop Kit',
        description: 'Sube tus mejores melodías y loops de alta calidad.',
        icon: BsInfinity,
        color: '#06b6d4',
        bg: 'rgba(6, 182, 212, 0.1)',
        badge: null,
        animDelay: '0.5s'
    }
];

export default function TypeSelector() {
    const { selectType } = useUploadStore();

    return (
        <div className="relative w-full flex flex-col items-center justify-center font-sans selection:bg-violet-500/30 min-h-[calc(100vh-80px)]">
            <div className="relative z-10 w-full max-w-[800px]">
                {/* Header */}
                <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards" style={{ animationDelay: '0.1s' }}>
                    <h1 className="font-display text-5xl md:text-[48px] font-bold tracking-[-1.5px] mb-4 bg-gradient-to-br from-white to-[#e0e0e0] bg-clip-text text-transparent leading-tight">
                        ¿Qué quieres subir hoy?
                    </h1>
                    <p className="text-[#888] text-base">Selecciona el tipo de contenido para comenzar.</p>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                            <button
                                key={type.id}
                                onClick={() => selectType(type.id)}
                                className="group relative bg-[#111] border border-[#222] p-8 rounded-2xl text-center transition-all duration-300 hover:bg-[#141414] hover:-translate-y-1 flex flex-col items-center justify-center h-[240px] animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards shadow-lg hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                                style={{
                                    animationDelay: type.animDelay
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = type.color;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#222';
                                }}
                            >
                                {/* External Icon Overlay Effect (Subtle) */}
                                <div className="absolute top-5 right-5 text-[#666] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">
                                    <ChevronRight size={14} />
                                </div>

                                {/* Badge */}
                                {type.badge && (
                                    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${type.badgeClass}`}>
                                        {type.badge}
                                    </span>
                                )}

                                <div
                                    className="w-[70px] h-[70px] rounded-2xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-105 shadow-inner"
                                    style={{ backgroundColor: type.bg, color: type.color }}
                                >
                                    <Icon size={32} />
                                </div>

                                <h3 className="font-display text-white text-[22px] font-extrabold tracking-[-0.5px] mb-2">
                                    {type.title}
                                </h3>

                                <p className="text-[#888] text-sm leading-[1.5] max-w-[240px]">
                                    {type.description}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
