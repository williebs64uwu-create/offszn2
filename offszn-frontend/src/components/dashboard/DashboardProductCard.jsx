import React from 'react';
import {
    MoreVertical, Edit3, Trash2, Eye, EyeOff, Link,
    Clock, CheckCircle, Copy, AlertCircle
} from 'lucide-react';

export default function DashboardProductCard({
    item,
    isSelected,
    onToggleSelection,
    onEdit,
    onDelete,
    onUpdateVisibility
}) {
    const isDraft = item.isDraft;
    const visibility = item.visibility;
    const title = item.title || item.name || 'Sin título';
    const imageUrl = item.image_url || item.signed_cover_url || '/images/portada-default.png';

    const getVisibilityIcon = () => {
        if (isDraft) return <Clock size={12} className="text-amber-500" />;
        switch (visibility) {
            case 'public': return <CheckCircle size={12} className="text-emerald-500" />;
            case 'private': return <EyeOff size={12} className="text-gray-500" />;
            case 'unlisted': return <Link size={12} className="text-blue-500" />;
            default: return <AlertCircle size={12} />;
        }
    };

    const getVisibilityLabel = () => {
        if (isDraft) return 'Borrador';
        switch (visibility) {
            case 'public': return 'Público';
            case 'private': return 'Privado';
            case 'unlisted': return 'Oculto';
            default: return 'Desconocido';
        }
    };

    return (
        <div className={`group relative bg-[#0a0a0a] border ${isSelected ? 'border-violet-500/50 bg-violet-500/5' : 'border-white/5'} rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/20 shadow-xl shadow-black/50`}>

            {/* Selection Overlay (Top Left) */}
            <div className={`absolute top-3 left-3 z-10 transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <button
                    onClick={() => onToggleSelection(item.id)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'bg-violet-500 border-violet-500' : 'bg-black/40 border-white/20 hover:border-white/40'}`}
                >
                    {isSelected && <CheckCircle size={14} className="text-white fill-white" />}
                </button>
            </div>

            {/* Thumbnail */}
            <div className="aspect-square relative overflow-hidden bg-white/5">
                <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Actions Overlay (Hidden by default, shown on hover) */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                    <button
                        onClick={() => onEdit(item)}
                        className="p-3 bg-white text-black rounded-xl hover:bg-gray-200 transition-all transform translate-y-2 group-hover:translate-y-0 duration-300 delay-[50ms]"
                        title="Editar"
                    >
                        <Edit3 size={18} />
                    </button>
                    <button
                        onClick={() => onDelete(item)}
                        className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all transform translate-y-2 group-hover:translate-y-0 duration-300 delay-[100ms]"
                        title="Eliminar"
                    >
                        <Trash2 size={18} />
                    </button>
                    <button
                        className="p-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all transform translate-y-2 group-hover:translate-y-0 duration-300 delay-[150ms]"
                        title="Duplicar"
                    >
                        <Copy size={18} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                    <h3 className="text-xs font-black uppercase tracking-tight text-white line-clamp-1 flex-1">
                        {title}
                    </h3>
                    <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                        {getVisibilityIcon()}
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{getVisibilityLabel()}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <div className="flex gap-3">
                        {item.bpm && <span>{item.bpm} BPM</span>}
                        {item.musicalKey && <span>{item.musicalKey}</span>}
                    </div>
                    {!isDraft && (
                        <span className="text-violet-400">
                            ${parseFloat(item.price || 0).toFixed(2)}
                        </span>
                    )}
                </div>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="bg-white/5 border border-white/5 px-2 py-0.5 rounded text-[8px] font-bold text-gray-400">
                                #{tag}
                            </span>
                        ))}
                        {item.tags.length > 2 && (
                            <span className="text-[8px] text-gray-600">+{item.tags.length - 2}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
