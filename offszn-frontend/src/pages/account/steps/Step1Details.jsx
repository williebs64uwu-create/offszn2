import React, { useState } from 'react';
import { useUploadStore } from '../../../store/uploadStore';
import { Tag as TagIcon, X, ImageIcon, Info } from 'lucide-react';
import ImageCropper from '../../../components/ImageCropper';

export default function Step1Details() {
    const {
        title, description, tags, coverImage,
        updateField, addTag, removeTag
    } = useUploadStore();

    const [tagInput, setTagInput] = useState('');
    const [showCropper, setShowCropper] = useState(false);
    const [tempImage, setTempImage] = useState(null);

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = tagInput.trim().replace(/^#/, '');
            if (val) {
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
            url: null, // To be uploaded later
            file: null // We'll convert dataUrl to file on publish or keep as is
        });
        setShowCropper(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Portada y Título Grid */}
            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">

                {/* Lado Izquierdo: Portada */}
                <div className="flex flex-col gap-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Portada del Producto</label>
                    <div
                        className="group relative aspect-square rounded-2xl bg-[#0a0a0a] border-2 border-dashed border-white/5 hover:border-violet-500/50 transition-all overflow-hidden cursor-pointer"
                    >
                        {coverImage?.preview ? (
                            <>
                                <img src={coverImage.preview} alt="Cover" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                                    <ImageIcon size={24} className="text-white" />
                                    <span className="text-xs font-bold text-white uppercase">Cambiar Imagen</span>
                                </div>
                            </>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-gray-600 transition-colors group-hover:text-gray-400">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-violet-500/10 transition-colors">
                                    <ImageIcon size={32} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold">Subir Portada</p>
                                    <p className="text-[10px] uppercase mt-1 opacity-50">JPG, PNG, WEBP</p>
                                </div>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            onChange={handleImageChange}
                        />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-600 px-1">
                        <Info size={12} />
                        <span>Se recomienda una imagen cuadrada de alta calidad.</span>
                    </div>
                </div>

                {/* Lado Derecho: Título y Descripción */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Título del {title ? 'Beat' : 'Producto'}</label>
                        <input
                            type="text"
                            placeholder="Ej: Dark Trap Banger (Prod. You)"
                            value={title}
                            onChange={(e) => updateField('title', e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-4 text-xl font-bold text-white placeholder-white/10 focus:outline-none focus:border-violet-500/50 transition-all"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Descripción</label>
                        <textarea
                            placeholder="Cuéntanos un poco sobre este beat, inspiración, equipo usado..."
                            rows={5}
                            value={description}
                            onChange={(e) => updateField('description', e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-300 placeholder-white/10 focus:outline-none focus:border-violet-500/50 transition-all resize-none"
                        />
                    </div>
                </div>
            </div>

            <hr className="border-white/5" />

            {/* Tags Section */}
            <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex justify-between">
                    <span>Etiquetas (Tags)</span>
                    <span className={`${tags.length >= 8 ? 'text-red-500' : 'text-gray-600'}`}>{tags.length}/8</span>
                </label>

                <div className="flex flex-wrap items-center gap-2 p-2 bg-[#0a0a0a] border border-white/5 rounded-xl focus-within:border-violet-500/50 transition-all min-h-[60px]">
                    <div className="pl-2 text-gray-600">
                        <TagIcon size={18} />
                    </div>

                    {tags.map((tag) => (
                        <span key={tag} className="flex items-center gap-1.5 bg-violet-500/10 text-violet-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-violet-500/20 animate-in zoom-in duration-200">
                            #{tag}
                            <button
                                onClick={() => removeTag(tag)}
                                className="hover:text-white transition-colors ml-1"
                            >
                                <X size={14} />
                            </button>
                        </span>
                    ))}

                    <input
                        type="text"
                        placeholder={tags.length < 8 ? "Escribe y pulsa Enter..." : ""}
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        disabled={tags.length >= 8}
                        className="flex-1 bg-transparent border-none outline-none text-white text-sm px-2 min-w-[150px] disabled:opacity-0"
                    />
                </div>
                <p className="text-[10px] text-gray-600 ml-1">
                    Las etiquetas ayudan a que los compradores encuentren tu contenido.
                </p>
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
