import React, { useState } from 'react';
import {
    MoreHorizontal, Pencil, Trash2, Share2,
    Lock, Globe, Link, Clock, Activity, Music, Disc
} from 'lucide-react';

export default function DashboardProductCard({
    item,
    isSelected,
    onToggleSelection,
    onEdit,
    onDelete,
    onUpdateVisibility
}) {
    const [showMenu, setShowMenu] = useState(false);
    const isDraft = item.status === 'draft' || item.isDraft;
    const title = item.title || item.name || (isDraft ? 'Sin Título (Borrador)' : 'Sin Título');
    const imageUrl = item.signed_cover_url || item.image_url || '/images/portada-default.png';
    const dateObj = new Date(item.created_at || item.updated_at || Date.now());
    const dateStr = dateObj.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' });

    const getBadge = () => {
        if (isDraft) return (
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-[#6c757d] text-white text-[9px] font-bold rounded flex items-center gap-1.5 border border-[#495057] z-10">
                <Pencil size={8} /> BORRADOR
            </div>
        );
        switch (item.visibility) {
            case 'private': return (
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-gray-600 text-white text-[9px] font-bold rounded flex items-center gap-1.5 border border-gray-700 z-10">
                    <Lock size={9} /> PRIVADO
                </div>
            );
            case 'unlisted': return (
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-[#222] text-[#888] text-[9px] font-bold rounded flex items-center gap-1.5 border border-[#333] z-10">
                    <Link size={10} /> NO LISTADO
                </div>
            );
            default: return (
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-[#10B981] text-black text-[9px] font-bold rounded flex items-center gap-1.5 border border-[#059669] z-10">
                    <Globe size={9} /> PUBLICADO
                </div>
            );
        }
    };

    return (
        <div
            className={`group bg-[#0F0F0F] border ${isSelected ? 'border-violet-500 ring-1 ring-violet-500' : 'border-[#222]'} rounded-lg overflow-hidden transition-all duration-200 hover:border-[#333] flex flex-col`}
            id={`card-${item.id}`}
        >
            {/* Cover Area */}
            <div className="relative aspect-square bg-[#111]">
                <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover transition-opacity duration-300"
                    loading="lazy"
                />

                {/* Badge Overlay */}
                {getBadge()}

                {/* Selection Overlay (Legacy Style) */}
                <div
                    onClick={() => onToggleSelection(item.id)}
                    className="absolute inset-0 cursor-pointer hidden group-hover:block"
                />
            </div>

            {/* Content Area */}
            <div className="p-3 flex flex-col flex-1">
                <h4 className="text-white text-[15px] font-bold mb-1.5 line-clamp-2 leading-tight h-[38px] font-display">
                    {title}
                </h4>

                <div className="flex items-center gap-3 text-[#666] text-[12px] mb-3">
                    <span className="flex items-center gap-1">
                        <Clock size={12} /> {dateStr}
                    </span>
                    {item.bpm && (
                        <span className="flex items-center gap-1">
                            <Activity size={12} /> {item.bpm} BPM
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                    <FormatTag label="MP3" />
                    <FormatTag label="WAV" />
                    {item.product_type !== 'beat' && <FormatTag label="ZIP" />}
                </div>

                {/* Footer Action Row */}
                <div className="mt-auto pt-3 border-t border-[#222] flex items-center justify-between">
                    <div
                        onClick={() => onToggleSelection(item.id)}
                        className={`w-4 h-4 rounded-sm border transition-all cursor-pointer flex items-center justify-center ${isSelected ? 'bg-violet-500 border-violet-500' : 'border-[#333] hover:border-[#444]'}`}
                    >
                        {isSelected && (
                            <svg viewBox="0 0 16 16" fill="white" className="w-3 h-3">
                                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                            </svg>
                        )}
                    </div>

                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            className="p-1.5 text-[#666] hover:text-white transition-colors rounded-full hover:bg-white/5"
                        >
                            <MoreHorizontal size={18} />
                        </button>

                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowMenu(false)}
                                />
                                <div className="absolute bottom-full right-0 mb-2 w-40 bg-[#111] border border-[#333] rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <MenuAction icon={Pencil} label="Editar" onClick={() => onEdit(item)} />
                                    <MenuAction icon={Share2} label="Compartir" onClick={() => { }} />
                                    <div className="h-px bg-[#222]" />
                                    <MenuAction icon={Trash2} label="Eliminar" onClick={() => onDelete(item)} variant="danger" />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function FormatTag({ label }) {
    return (
        <span className="px-1.5 py-0.5 bg-[#222] border border-[#333] text-[#aaa] text-[9px] font-bold rounded-sm uppercase tracking-wider">
            {label}
        </span>
    );
}

function MenuAction({ icon: Icon, label, onClick, variant }) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors ${variant === 'danger' ? 'text-red-500 hover:bg-red-500/10' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
        >
            <Icon size={14} />
            {label}
        </button>
    );
}
