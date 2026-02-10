import React from 'react';
import { useUploadStore } from '../../../store/uploadStore';
import { CheckCircle2, Music, DollarSign, Tag, Info, AlertCircle, Calendar, Eye, Users } from 'lucide-react';

export default function Step4Review() {
    const {
        title, description, tags, coverImage,
        files, bpm, musicalKey, visibility, date,
        basePrice, promoPrice, isFree, collaborators
    } = useUploadStore();

    const minPrice = isFree ? 0 : Math.min(parseFloat(basePrice) || 0, parseFloat(promoPrice) || Infinity);

    return (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500 pb-10">

            {/* 1. Header de Confirmación */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 flex items-start gap-4">
                <div className="p-2 bg-emerald-500/20 rounded-full text-emerald-400">
                    <CheckCircle2 size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">¡Todo listo para brillar!</h3>
                    <p className="text-sm text-gray-400">Tu beat se ve increíble. Revisa los últimos detalles antes de publicarlo en el marketplace.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-12">

                {/* 2. Vista Previa de la Tarjeta (Fiel al Marketplace) */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Vista Previa</h4>

                    <div className="group relative bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/5 transition-all duration-500 hover:border-violet-500/30 shadow-2xl">
                        {/* Imagen de Portada */}
                        <div className="aspect-square relative overflow-hidden">
                            {coverImage?.preview ? (
                                <img src={coverImage.preview} alt="Preview" className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-800">
                                    <Music size={64} />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80"></div>

                            {/* Badge de Precio */}
                            <div className="absolute bottom-4 left-4 flex items-center gap-2">
                                <div className={`px-4 py-2 rounded-xl text-sm font-black shadow-xl ${isFree ? 'bg-emerald-500 text-black' : 'bg-white text-black'}`}>
                                    {isFree ? 'FREE' : `$${parseFloat(minPrice).toFixed(2)}`}
                                </div>
                                {musicalKey && (
                                    <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl text-[10px] font-black text-white border border-white/10 uppercase">
                                        {musicalKey}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info del Beat */}
                        <div className="p-6 space-y-3">
                            <h3 className="text-xl font-black text-white truncate tracking-tight">{title || 'Título del Beat'}</h3>
                            <div className="flex items-center gap-3 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                                <span className="flex items-center gap-1"><Music size={12} /> {bpm || '--'} BPM</span>
                                <span>•</span>
                                <span>{visibility}</span>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 pt-1">
                                {tags.map(tag => (
                                    <span key={tag} className="text-[9px] font-black uppercase tracking-widest bg-white/5 text-gray-400 px-2 py-1 rounded-md border border-white/5">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Desglose Técnico */}
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SummaryBlock
                            icon={<Music size={18} />}
                            title="Archivos"
                            content={
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <FileBadge label="MP3" exists={files.mp3_tagged} color="emerald" />
                                    <FileBadge label="WAV" exists={files.wav_untagged} color="violet" />
                                    <FileBadge label="ZIP" exists={files.stems} color="blue" />
                                </div>
                            }
                        />
                        <SummaryBlock
                            icon={<DollarSign size={18} />}
                            title="Precios"
                            content={
                                <div className="space-y-1 mt-2">
                                    <PriceRow label="Básico" price={basePrice} />
                                    <PriceRow label="Premium" price={promoPrice} />
                                </div>
                            }
                        />
                        <SummaryBlock
                            icon={<Users size={18} />}
                            title="Colaboradores"
                            content={
                                <div className="mt-2 space-y-1">
                                    {collaborators.length > 0 ? collaborators.map(c => (
                                        <div key={c.id} className="text-[10px] font-bold text-gray-400 flex justify-between uppercase">
                                            <span>{c.nickname}</span>
                                            <span className="text-violet-500">{c.split}%</span>
                                        </div>
                                    )) : <p className="text-[10px] text-gray-700 uppercase italic">Sin colaboradores</p>}
                                </div>
                            }
                        />
                        <SummaryBlock
                            icon={<Calendar size={18} />}
                            title="Lanzamiento"
                            content={
                                <div className="mt-2 text-xs font-bold text-white flex items-center gap-2">
                                    <span className="uppercase text-gray-600 text-[10px]">Fecha:</span> {date || 'Inmediato'}
                                </div>
                            }
                        />
                    </div>

                    {/* Disclaimer */}
                    <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-4">
                        <AlertCircle className="text-amber-500 shrink-0" size={20} />
                        <p className="text-[10px] text-amber-200/50 leading-relaxed font-bold uppercase tracking-tight">
                            Al hacer clic en <span className="text-amber-500 font-black">"Publicar Beat"</span>, confirmas que posees todos los derechos necesarios para este trabajo y aceptas nuestros términos de servicio. El contenido será procesado y estará disponible en breves momentos.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SummaryBlock({ icon, title, content }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-500 uppercase">
                {icon}
                <span className="text-xs font-black tracking-widest">{title}</span>
            </div>
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 min-h-[80px]">
                {content}
            </div>
        </div>
    );
}

function FileBadge({ label, exists, color }) {
    if (!exists) return <span className="text-[9px] bg-white/5 text-gray-700 border border-white/5 px-2 py-1 rounded-md font-black uppercase">{label}</span>;

    const colors = {
        emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        violet: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
        blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    };

    return (
        <span className={`text-[9px] px-2 py-1 rounded-md font-black uppercase border animate-pulse ${colors[color]}`}>
            {label} ✓
        </span>
    );
}

function PriceRow({ label, price }) {
    return (
        <div className="flex justify-between items-center text-[10px] font-bold uppercase">
            <span className="text-gray-600">{label}</span>
            <span className="text-white">${parseFloat(price || 0).toFixed(2)}</span>
        </div>
    );
}
