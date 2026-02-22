import React from 'react';
import { useUploadStore } from '../../../store/uploadStore';
import { Music, Disc, Layers, Cpu, ArrowRight, Sparkles } from 'lucide-react';

const TYPES = [
    {
        id: 'beat',
        title: 'Beat / Instrumental',
        description: 'Single track with multiple licensing options (MP3, WAV, Stems).',
        icon: Music,
        color: 'text-violet-500',
        bg: 'bg-violet-500/10',
        border: 'border-violet-500/20'
    },
    {
        id: 'drumkit',
        title: 'Drum Kit / Pack',
        description: 'Collection of one-shots and loops inside a ZIP container.',
        icon: Disc,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20'
    },
    {
        id: 'loopkit',
        title: 'Loop / Sample Kit',
        description: 'Melodic libraries for other producers to build upon.',
        icon: Layers,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20'
    },
    {
        id: 'preset',
        title: 'Preset Bank',
        description: 'Sound banks for Serum, Vital, VSTs or FX chains.',
        icon: Cpu,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20'
    }
];

export default function TypeSelector() {
    const { selectType } = useUploadStore();

    return (
        <div className="max-w-4xl mx-auto space-y-16 py-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">

            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/5 border border-violet-500/10 mb-4">
                    <Sparkles size={12} className="text-violet-500" />
                    <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest">New Drop Pipeline</span>
                </div>
                <h2 className="text-5xl font-black uppercase tracking-tighter text-white">
                    What are you <span className="text-violet-500">dropping</span> today?
                </h2>
                <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px]">Select your asset type to initialize the upload sequence</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                        <button
                            key={type.id}
                            onClick={() => selectType(type.id)}
                            className="group relative bg-[#080808] border border-white/5 p-10 rounded-[48px] text-left transition-all duration-500 hover:border-violet-500/40 hover:bg-white/[0.02] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden"
                        >
                            {/* Ambient Glow */}
                            <div className={`absolute -right-20 -top-20 w-64 h-64 blur-[100px] transition-all duration-1000 ${type.bg} opacity-0 group-hover:opacity-40 animate-pulse`} />

                            <div className="flex flex-col gap-8 relative z-10">
                                <div className={`w-16 h-16 rounded-[24px] ${type.bg} ${type.border} border flex items-center justify-center ${type.color} group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-2xl`}>
                                    <Icon size={28} />
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-violet-400 transition-colors">
                                        {type.title}
                                    </h3>
                                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed uppercase tracking-wider">
                                        {type.description}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 text-[10px] font-black text-gray-700 uppercase tracking-widest group-hover:text-white transition-all">
                                    Initialize Sequence
                                    <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform duration-500" />
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="text-center pt-10">
                <p className="text-[9px] text-gray-800 font-black uppercase tracking-[0.5em] animate-pulse">
                    Encrypted Pipeline • Secure Storage Active
                </p>
            </div>

        </div>
    );
}
