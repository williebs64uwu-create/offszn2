import React, { useState } from 'react';
import { useUploadStore } from '../../../store/uploadStore';
import { Tag as TagIcon, X, ImageIcon, Youtube, Info, Music2, Mic, Star, Sliders, Music } from 'lucide-react';
import ImageCropper from '../../../components/ImageCropper';

export default function Step1Details() {
    const {
        title, description, tags, coverImage, productType, youtubeSync, category,
        updateField, addTag, removeTag
    } = useUploadStore();

    const PRESET_CATEGORIES = [
        { id: 'vocal', label: 'Voces', icon: Mic },
        { id: 'template', label: 'Plantilla', icon: Star },
        { id: 'plugin', label: 'Plugin', icon: Sliders },
        { id: 'instrument', label: 'Instrumento', icon: Music },
    ];

    const [tagInput, setTagInput] = useState('');
    const [showCropper, setShowCropper] = useState(false);
    const [tempImage, setTempImage] = useState(null);

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = tagInput.trim().replace(/^#/, '');
            if (val && tags.length < 8) {
                addTag(val);
                setTagInput('');
            }
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setTempImage(reader.result);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const onCropComplete = (croppedDataUrl) => {
        updateField('coverImage', {
            preview: croppedDataUrl,
            url: null,
            file: null
        });
        setShowCropper(false);
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">

            {/* --- CATEGORY SELECTOR (Solo para PRESET) --- */}
            {productType === 'preset' && (
                <div className="space-y-6">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1 block">Categoría del Preset</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {PRESET_CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            const isActive = category === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => updateField('category', cat.id)}
                                    className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 group
                                    ${isActive
                                            ? 'bg-violet-500/10 border-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.2)]'
                                            : 'bg-[#111] border-white/5 text-gray-600 hover:border-white/10 hover:text-gray-400'}`}
                                >
                                    <div className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-violet-500' : ''}`}>
                                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-12">

                {/* --- IZQUIERDA: PORTADA --- */}
                <div className="space-y-4">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1 block">Portada del Item</label>
                    <div className="relative aspect-square w-full">
                        <div
                            className={`relative w-full h-full rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden cursor-pointer group
                                ${coverImage?.preview ? 'border-transparent' : 'border-white/10 hover:border-violet-500/50 bg-white/[0.02]'}`}
                        >
                            {coverImage?.preview ? (
                                <>
                                    <img src={coverImage.preview} alt="Cover" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Cambiar Portada</span>
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 group-hover:text-violet-500 transition-colors">
                                    <ImageIcon size={40} strokeWidth={1.5} />
                                    <p className="mt-4 text-[10px] font-bold uppercase tracking-widest">Subir Imagen</p>
                                    <p className="mt-2 text-[9px] uppercase tracking-widest opacity-50">3000x3000px</p>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                onChange={handleImageChange}
                            />
                        </div>
                    </div>

                    {/* YouTube Sync Toggle (Solo para Beats) */}
                    {productType === 'beat' && (
                        <div className="pt-6">
                            <button
                                onClick={() => updateField('youtubeSync', !youtubeSync)}
                                className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 group
                                    ${youtubeSync
                                        ? 'bg-red-500/5 border-red-500/20 text-red-500'
                                        : 'bg-white/[0.02] border-white/5 text-gray-500 hover:border-white/10'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
                                    ${youtubeSync ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-white/5 text-gray-500'}`}>
                                    <Youtube size={18} fill={youtubeSync ? "currentColor" : "none"} />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Sync YouTube</p>
                                    <p className={`text-[9px] uppercase tracking-widest mt-0.5 ${youtubeSync ? 'text-red-500/70' : 'text-gray-600'}`}>
                                        {youtubeSync ? 'Activado' : 'Desactivado'}
                                    </p>
                                </div>
                            </button>
                        </div>
                    )}
                </div>

                {/* --- DERECHA: FORMULARIO --- */}
                <div className="space-y-8">

                    {/* Título */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1 block">Título del Producto <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            placeholder="Ej: Lunar Echoes (Beat)"
                            value={title}
                            onChange={(e) => updateField('title', e.target.value)}
                            className="w-full bg-[#111] border border-white/5 rounded-xl px-6 py-4 text-lg font-medium text-white placeholder-gray-700 focus:outline-none focus:border-violet-500 transition-all shadow-xl"
                        />
                    </div>

                    {/* Descripción */}
                    <div className="space-y-3 text-right">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Descripción</label>
                            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{description.length} / 1000</span>
                        </div>
                        <textarea
                            placeholder="Cuéntanos más sobre este item..."
                            rows={6}
                            value={description}
                            onChange={(e) => updateField('description', e.target.value)}
                            className="w-full bg-[#111] border border-white/5 rounded-xl px-6 py-4 text-sm text-gray-300 placeholder-gray-700 focus:outline-none focus:border-violet-500 transition-all resize-none h-[140px] shadow-xl"
                        />
                    </div>

                    {/* Etiquetas */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Etiquetas (Tags)</label>
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${tags.length >= 8 ? 'text-red-500' : 'text-gray-600'}`}>
                                {tags.length} / 8
                            </span>
                        </div>

                        <div className="bg-[#111] border border-white/5 rounded-xl p-3 min-h-[56px] flex flex-wrap gap-2 focus-within:border-violet-500 transition-all shadow-xl">
                            {tags.map((tag) => (
                                <div key={tag} className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg group">
                                    {tag}
                                    <button
                                        onClick={() => removeTag(tag)}
                                        className="text-gray-600 hover:text-red-500 transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}

                            <input
                                type="text"
                                placeholder={tags.length < 8 ? "Añadir etiqueta..." : ""}
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                disabled={tags.length >= 8}
                                className="flex-1 bg-transparent border-none outline-none text-white text-sm font-medium px-2 min-w-[120px] disabled:opacity-0"
                            />
                        </div>

                        <div className="flex items-center gap-2 px-1 opacity-50">
                            <Info size={12} className="text-violet-500" />
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                Pulsa Enter o Coma para añadir una etiqueta.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Cropper Modal */}
            {showCropper && (
                <ImageCropper
                    image={tempImage}
                    onCrop={onCropComplete}
                    onCancel={() => setShowCropper(false)}
                />
            )}
        </div>
    );
}
