import React, { useState } from 'react';
import { useUploadStore } from '../../../store/uploadStore';
import { Tag as TagIcon, Sparkles, X, ImageIcon, Info, Type, FileText } from 'lucide-react';
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
            url: null,
            file: null
        });
        setShowCropper(false);
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">

            {/* --- PRIMARY INFO GRID --- */}
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-12">

                {/* Cover Section */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-2 block">Visual Identity</label>
                    <div
                        className="group relative aspect-square rounded-[40px] bg-black border border-white/5 hover:border-violet-500/50 transition-all duration-700 overflow-hidden cursor-pointer shadow-2xl"
                    >
                        {coverImage?.preview ? (
                            <>
                                <img src={coverImage.preview} alt="Cover" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-4 backdrop-blur-md">
                                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                        <ImageIcon size={28} className="text-white" />
                                    </div>
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Update Artwork</span>
                                </div>
                            </>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 text-gray-800 transition-all duration-700 group-hover:text-violet-500">
                                <div className="w-20 h-20 rounded-[32px] bg-white/[0.02] flex items-center justify-center group-hover:bg-violet-500/10 transition-all border border-white/5 group-hover:border-violet-500/20 shadow-inner">
                                    <ImageIcon size={36} />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-black uppercase tracking-widest">Brand Image</p>
                                    <p className="text-[9px] uppercase mt-2 opacity-30 font-bold tracking-widest">3000 x 3000px recommended</p>
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
                </div>

                {/* Text Info Section */}
                <div className="space-y-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-4 flex items-center gap-2">
                            <Type size={12} className="text-violet-500/40" /> Product Title
                        </label>
                        <div className="relative group/input">
                            <input
                                type="text"
                                placeholder="E.g. Lunar Echoes (Prod. You)"
                                value={title}
                                onChange={(e) => updateField('title', e.target.value)}
                                className="w-full bg-black border border-white/5 rounded-[28px] px-8 py-6 text-2xl font-black text-white placeholder-white/5 focus:outline-none focus:border-violet-500 transition-all shadow-inner"
                            />
                            <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-focus-within/input:opacity-100 transition-opacity">
                                <Sparkles size={20} className="text-violet-500 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-4 flex items-center gap-2">
                            <FileText size={12} className="text-violet-500/40" /> Description & Story
                        </label>
                        <textarea
                            placeholder="Share the inspiration behind this piece, gear used, or special terms..."
                            rows={6}
                            value={description}
                            onChange={(e) => updateField('description', e.target.value)}
                            className="w-full bg-black border border-white/5 rounded-[32px] px-8 py-6 text-sm text-gray-400 font-bold placeholder-white/5 focus:outline-none focus:border-violet-500 transition-all resize-none shadow-inner leading-relaxed"
                        />
                    </div>
                </div>
            </div>

            {/* --- METADATA SECTION --- */}
            <div className="pt-12 border-t border-white/5 space-y-6">
                <div className="flex flex-col gap-5">
                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-4 flex justify-between items-center">
                        <span className="flex items-center gap-2">
                            <TagIcon size={12} className="text-violet-500/40" /> Discoverability Tags
                        </span>
                        <span className={`text-[9px] font-black tracking-widest ${tags.length >= 8 ? 'text-red-500' : 'text-gray-800'}`}>{tags.length} / 8</span>
                    </label>

                    <div className="flex flex-wrap items-center gap-3 p-4 bg-black border border-white/5 rounded-[32px] focus-within:border-violet-500 transition-all min-h-[80px] shadow-inner group/tags">
                        {tags.map((tag) => (
                            <div key={tag} className="flex items-center gap-2 bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-2xl border border-violet-400/20 shadow-2xl animate-in zoom-in slide-in-from-left-2 duration-300">
                                <span className="opacity-50">#</span>{tag}
                                <button
                                    onClick={() => removeTag(tag)}
                                    className="hover:scale-110 transition-transform ml-1 p-1 bg-black/20 rounded-full"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}

                        <input
                            type="text"
                            placeholder={tags.length < 8 ? "Type & Enter to add..." : ""}
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            disabled={tags.length >= 8}
                            className="flex-1 bg-transparent border-none outline-none text-white text-sm font-bold px-4 min-w-[200px] disabled:opacity-0 transition-opacity"
                        />
                    </div>

                    <div className="flex items-center gap-3 px-6 text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                        <Info size={12} className="text-violet-500/40" />
                        <span>Tags help buyers find your content through search. Add relevant genres or moods.</span>
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
