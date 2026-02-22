import React from 'react';
import { useUploadStore } from '../../../store/uploadStore';
import { CheckCircle2, HandCoins, Music, DollarSign, Tag, Info, AlertCircle, Calendar, Eye, Users, ShieldCheck, Zap, Globe, FileCheck, Layers } from 'lucide-react';

export default function Step4Review() {
    const {
        title, description, tags, coverImage,
        files, bpm, musicalKey, visibility, date,
        basePrice, promoPrice, isFree, collaborators
    } = useUploadStore();

    const minPrice = isFree ? 0 : Math.min(parseFloat(basePrice) || 0, parseFloat(promoPrice) || Infinity);

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-16">

            {/* --- CONFIRMATION HERO --- */}
            <div className="bg-emerald-500/[0.03] border border-emerald-500/20 rounded-[40px] p-8 flex items-center gap-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="relative z-10 p-4 bg-emerald-500/20 rounded-3xl text-emerald-400 shadow-2xl animate-bounce">
                    <CheckCircle2 size={32} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] mb-1">Infrastructure Ready</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Protocolo de validación completado. El beat está listo para sincronizar con el marketplace.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-16">

                {/* --- RENDER PREVIEW (MARKETPLACE CARD) --- */}
                <div className="space-y-6">
                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-4 block">Marketplace Visuals</label>

                    <div className="group relative bg-black rounded-[48px] overflow-hidden border border-white/5 transition-all duration-1000 hover:border-violet-500/40 shadow-3xl">
                        {/* Cover Image Engine */}
                        <div className="aspect-square relative overflow-hidden">
                            {coverImage?.preview ? (
                                <img src={coverImage.preview} alt="Preview" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full bg-[#050505] flex items-center justify-center text-gray-900">
                                    <Music size={80} strokeWidth={1} />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90 transition-opacity duration-1000 group-hover:opacity-70"></div>

                            {/* Dynamic Badges */}
                            <div className="absolute bottom-6 left-6 flex items-center gap-3">
                                <div className={`px-6 py-3 rounded-2xl text-[12px] font-black shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover:scale-110 ${isFree ? 'bg-emerald-500 text-black' : 'bg-white text-black'}`}>
                                    {isFree ? 'FREE DOWNLOAD' : `$${parseFloat(minPrice || 0).toFixed(2)}`}
                                </div>
                                {musicalKey && (
                                    <div className="bg-black/80 backdrop-blur-2xl px-4 py-3 rounded-2xl text-[10px] font-black text-white border border-white/10 uppercase tracking-widest">
                                        {musicalKey}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Metadata Details */}
                        <div className="p-8 space-y-4">
                            <h3 className="text-2xl font-black text-white truncate tracking-tight uppercase leading-tight">{title || 'Untitled Prototype'}</h3>
                            <div className="flex items-center gap-4 text-[10px] font-black uppercase text-gray-600 tracking-[0.2em]">
                                <span className="flex items-center gap-2"><Zap size={12} className="text-violet-500" /> {bpm || '--'} BPM</span>
                                <span className="w-1 h-1 rounded-full bg-white/10"></span>
                                <span className="flex items-center gap-2 capitalize"><Globe size={12} /> {visibility}</span>
                            </div>

                            {/* Tags Array */}
                            <div className="flex flex-wrap gap-2 pt-2">
                                {tags.length > 0 ? tags.map(tag => (
                                    <span key={tag} className="text-[9px] font-black uppercase tracking-widest bg-white/[0.02] text-gray-500 px-3 py-1.5 rounded-xl border border-white/5 group-hover:border-violet-500/20 group-hover:text-violet-400 transition-all">
                                        #{tag}
                                    </span>
                                )) : <div className="h-4 w-20 bg-white/5 rounded-full animate-pulse"></div>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- TECHNICAL BREAKDOWN --- */}
                <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <SummaryBlock
                            icon={<FileCheck size={18} className="text-violet-500" />}
                            title="Asset Pipeline"
                            content={
                                <div className="flex flex-wrap gap-3 mt-4">
                                    <FileBadge label="Encoded MP3" exists={files.mp3_tagged} color="emerald" />
                                    <FileBadge label="Lossless WAV" exists={files.wav_untagged} color="violet" />
                                    <FileBadge label="Multitrack ZIP" exists={files.stems} color="blue" />
                                </div>
                            }
                        />
                        <SummaryBlock
                            icon={<HandCoins size={18} className="text-violet-500" />}
                            title="Monetization"
                            content={
                                <div className="space-y-2 mt-4">
                                    <PriceRow label="Studio License" price={basePrice} />
                                    <PriceRow label="Commercial License" price={promoPrice} />
                                    {isFree && <div className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mt-2 border-t border-emerald-500/10 pt-2 flex items-center gap-2"> <Zap size={10} /> Free Download Enabled</div>}
                                </div>
                            }
                        />
                        <SummaryBlock
                            icon={<Users size={18} className="text-violet-500" />}
                            title="Royalties Split"
                            content={
                                <div className="mt-4 space-y-3">
                                    {collaborators.length > 0 ? collaborators.map(c => (
                                        <div key={c.id} className="text-[10px] font-black text-gray-500 flex justify-between uppercase tracking-widest group/split">
                                            <span className="flex items-center gap-2"><ShieldCheck size={10} className="text-emerald-500" /> {c.nickname}</span>
                                            <span className="text-violet-500 group-hover:text-white transition-colors">{c.split}%</span>
                                        </div>
                                    )) : <p className="text-[10px] text-gray-800 uppercase font-black tracking-widest italic flex items-center gap-2"> <Info size={12} /> No additional authors detected </p>}
                                </div>
                            }
                        />
                        <SummaryBlock
                            icon={<Calendar size={18} className="text-violet-500" />}
                            title="Deployment"
                            content={
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <span className="uppercase text-gray-700 text-[10px] font-black tracking-widest block">Scheduled Date</span>
                                        <span className="text-sm font-black text-white uppercase">{date || 'Immediate Pipeline'}</span>
                                    </div>
                                    <div className="w-10 h-10 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-gray-800">
                                        <Layers size={20} />
                                    </div>
                                </div>
                            }
                        />
                    </div>

                    {/* --- LEGAL DISCLAIMER --- */}
                    <div className="p-8 bg-amber-500/[0.02] border border-amber-500/10 rounded-[40px] flex gap-6 shadow-2xl">
                        <AlertCircle className="text-amber-500 shrink-0" size={24} />
                        <div className="space-y-2">
                            <p className="text-[11px] text-amber-500/80 font-black uppercase tracking-[0.1em]">Legal Protocol & Compliance</p>
                            <p className="text-[10px] text-amber-200/30 leading-relaxed font-bold uppercase tracking-tight">
                                Al ejecutar la publicación, certificas la propiedad intelectual total de este material. Cualquier infracción de copyright resultará en la suspensión inmediata de la cuenta y la incautación de fondos asociados.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SummaryBlock({ icon, title, content }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-700 uppercase">
                <div className="p-2 bg-white/[0.02] rounded-xl border border-white/5">
                    {icon}
                </div>
                <span className="text-[10px] font-black tracking-[0.3em]">{title}</span>
            </div>
            <div className="bg-black border border-white/5 rounded-[32px] p-6 min-h-[100px] shadow-inner group">
                {content}
            </div>
        </div>
    );
}

function FileBadge({ label, exists, color }) {
    if (!exists) return <span className="text-[9px] bg-white/[0.02] text-gray-900 border border-white/5 px-4 py-2 rounded-xl font-black uppercase tracking-widest">{label}</span>;

    const colors = {
        emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        violet: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
        blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    };

    return (
        <span className={`text-[9px] px-4 py-2 rounded-xl font-black uppercase tracking-widest border shadow-2xl flex items-center gap-2 ${colors[color]}`}>
            <div className="w-1 h-1 rounded-full bg-current animate-pulse"></div>
            {label}
        </span>
    );
}

function PriceRow({ label, price }) {
    return (
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest group/row">
            <span className="text-gray-700 group-hover:text-gray-400 transition-colors">{label}</span>
            <span className="text-white bg-white/5 px-3 py-1 rounded-lg border border-white/5 transition-all group-hover:scale-110">${parseFloat(price || 0).toFixed(2)}</span>
        </div>
    );
}
