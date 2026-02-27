import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../api/client';
import { useAuth } from '../../store/authStore';
import ImageCropper from '../../components/ImageCropper';
import {
    ArrowLeft, Save, Loader2, Sparkles, Image as ImageIcon,
    Music, Tag, DollarSign, Eye, EyeOff, Globe, Trash2,
    RotateCcw, X, Check, AlertTriangle, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const VISIBILITY_OPTIONS = [
    { value: 'public', label: 'Público', icon: Globe, color: 'text-emerald-500' },
    { value: 'private', label: 'Privado', icon: EyeOff, color: 'text-orange-500' },
    { value: 'unlisted', label: 'Oculto', icon: Eye, color: 'text-gray-500' },
];

export default function EditBeat() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [product, setProduct] = useState(null);
    const [error, setError] = useState(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [bpm, setBpm] = useState('');
    const [musicalKey, setMusicalKey] = useState('');
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [priceBasic, setPriceBasic] = useState('');
    const [pricePremium, setPricePremium] = useState('');
    const [isFree, setIsFree] = useState(false);
    const [visibility, setVisibility] = useState('public');
    const [coverPreview, setCoverPreview] = useState(null);
    const [newCoverFile, setNewCoverFile] = useState(null);
    const [showCropper, setShowCropper] = useState(false);
    const [cropSource, setCropSource] = useState(null);
    const fileInputRef = useRef(null);

    // Fetch product on mount
    useEffect(() => {
        if (authLoading || !user) return;

        const fetchProduct = async () => {
            setLoading(true);
            try {
                const { data, error: fetchError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', id)
                    .eq('producer_id', user.id)
                    .single();

                if (fetchError) throw fetchError;
                if (!data) throw new Error('Producto no encontrado');

                setProduct(data);
                setTitle(data.name || '');
                setDescription(data.description || '');
                setBpm(data.bpm || '');
                setMusicalKey(data.key || '');
                setTags(data.tags || []);
                setPriceBasic(data.price_basic || '');
                setPricePremium(data.price_premium || '');
                setIsFree(data.is_free || false);
                setVisibility(data.visibility || 'public');
                setCoverPreview(data.image_url || null);
            } catch (err) {
                console.error('Error fetching product:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id, user, authLoading]);

    // Cover image handling
    const handleCoverSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setCropSource(reader.result);
            setShowCropper(true);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleCrop = (croppedDataUrl) => {
        setCoverPreview(croppedDataUrl);
        setNewCoverFile(croppedDataUrl);
        setShowCropper(false);
        setCropSource(null);
    };

    // Tags
    const addTag = () => {
        const t = tagInput.trim().toLowerCase();
        if (t && !tags.includes(t) && tags.length < 20) {
            setTags([...tags, t]);
            setTagInput('');
        }
    };

    const removeTag = (tag) => setTags(tags.filter(t => t !== tag));

    // Save
    const handleSave = async () => {
        if (saving) return;
        if (!title.trim()) {
            toast.error('El título es obligatorio');
            return;
        }

        setSaving(true);
        try {
            const updateData = {
                name: title.trim(),
                description: description.trim(),
                bpm: parseInt(bpm) || null,
                key: musicalKey || null,
                tags,
                price_basic: parseFloat(priceBasic) || 0,
                price_premium: parseFloat(pricePremium) || 0,
                is_free: isFree,
                visibility,
            };

            // Upload new cover if changed
            if (newCoverFile && newCoverFile.startsWith('data:')) {
                const arr = newCoverFile.split(',');
                const mime = arr[0].match(/:(.*?);/)[1];
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) { u8arr[n] = bstr.charCodeAt(n); }
                const blob = new Blob([u8arr], { type: mime });

                const path = `${user.id}/covers/${Date.now()}_cover_edit.jpg`;
                const { error: uploadErr } = await supabase.storage
                    .from('products')
                    .upload(path, blob, { contentType: 'image/jpeg' });
                if (uploadErr) throw uploadErr;

                const { data: publicUrl } = supabase.storage.from('products').getPublicUrl(path);
                updateData.image_url = publicUrl.publicUrl;
            }

            const { error: updateErr } = await supabase
                .from('products')
                .update(updateData)
                .eq('id', id)
                .eq('producer_id', user.id);

            if (updateErr) throw updateErr;

            toast.success('Producto actualizado exitosamente');
            navigate('/dashboard/my-products');
        } catch (err) {
            console.error('Error updating product:', err);
            toast.error(`Error: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    // Loading state
    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
                <div className="w-16 h-16 border-t-2 border-violet-500 rounded-full animate-spin shadow-[0_0_15px_rgba(139,92,246,0.5)]"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 animate-pulse">Cargando Producto...</span>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 p-8">
                <div className="p-6 bg-red-500/10 rounded-3xl border border-red-500/20">
                    <AlertTriangle size={48} className="text-red-500" />
                </div>
                <div className="text-center space-y-3">
                    <h2 className="text-xl font-black uppercase tracking-widest text-white">Error</h2>
                    <p className="text-sm text-gray-500 max-w-md">{error}</p>
                </div>
                <button
                    onClick={() => navigate('/dashboard/my-products')}
                    className="flex items-center gap-3 text-gray-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em] bg-white/5 px-8 py-4 rounded-2xl border border-white/5 hover:border-white/10"
                >
                    <ArrowLeft size={14} /> Regresar a Productos
                </button>
            </div>
        );
    }

    const visOption = VISIBILITY_OPTIONS.find(v => v.value === visibility) || VISIBILITY_OPTIONS[0];

    return (
        <div className="relative min-h-screen bg-black text-white selection:bg-violet-500/30 p-6 md:p-12">
            {/* Image Cropper Modal */}
            {showCropper && cropSource && (
                <ImageCropper
                    image={cropSource}
                    onCrop={handleCrop}
                    onCancel={() => { setShowCropper(false); setCropSource(null); }}
                />
            )}

            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleCoverSelect} className="hidden" />

            <div className="max-w-4xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* --- HEADER --- */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/dashboard/my-products')}
                            className="group p-4 rounded-2xl hover:bg-white/5 text-gray-600 hover:text-white transition-all border border-transparent hover:border-white/5"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <Sparkles size={14} className="text-violet-500" />
                                <span className="text-[9px] font-black text-violet-500 uppercase tracking-[0.3em]">Editor de Producto</span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-none">{title || 'Sin título'}</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard/my-products')}
                            className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all border border-white/5"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="group flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl hover:bg-violet-600 hover:text-white active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)] text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>

                {/* --- MAIN CONTENT --- */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">

                    {/* LEFT COLUMN - Form Fields */}
                    <div className="space-y-12">

                        {/* Title */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Título</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Nombre del producto..."
                                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-white placeholder-gray-700 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all text-lg font-bold"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Descripción</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe tu producto..."
                                rows={4}
                                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-white placeholder-gray-700 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all resize-none"
                            />
                        </div>

                        {/* BPM & Key Row */}
                        {product?.product_type === 'beat' && (
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">BPM</label>
                                    <input
                                        type="number"
                                        value={bpm}
                                        onChange={(e) => setBpm(e.target.value)}
                                        placeholder="140"
                                        className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-white placeholder-gray-700 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all font-bold"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Escala</label>
                                    <select
                                        value={musicalKey}
                                        onChange={(e) => setMusicalKey(e.target.value)}
                                        className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all font-bold appearance-none cursor-pointer"
                                    >
                                        <option value="">Sin escala</option>
                                        {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].flatMap(note =>
                                            ['Major', 'Minor'].map(mode => (
                                                <option key={`${note} ${mode}`} value={`${note} ${mode}`}>{note} {mode}</option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">
                                Tags <span className="text-gray-800">({tags.length}/20)</span>
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                    placeholder="Añadir tag..."
                                    className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-gray-700 focus:outline-none focus:border-violet-500/50 transition-all text-sm"
                                />
                                <button onClick={addTag} className="p-4 bg-violet-500/10 text-violet-500 rounded-2xl hover:bg-violet-500/20 transition-all border border-violet-500/20">
                                    <Tag size={16} />
                                </button>
                            </div>
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {tags.map(tag => (
                                        <span key={tag} className="group flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-full text-[10px] font-bold text-gray-400 hover:border-red-500/30 transition-all cursor-pointer" onClick={() => removeTag(tag)}>
                                            #{tag}
                                            <X size={10} className="text-gray-700 group-hover:text-red-500 transition-colors" />
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pricing */}
                        <div className="space-y-6">
                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Precios</label>

                            <label className="flex items-center gap-4 cursor-pointer group">
                                <div className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center ${isFree ? 'bg-emerald-500 justify-end' : 'bg-white/10 justify-start'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full mx-1 shadow-lg transition-transform duration-300`}></div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">
                                    {isFree ? 'Gratuito' : 'De pago'}
                                </span>
                            </label>

                            {!isFree && (
                                <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="space-y-3">
                                        <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Precio Base (USD)</span>
                                        <div className="relative">
                                            <DollarSign size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700" />
                                            <input
                                                type="number"
                                                value={priceBasic}
                                                onChange={(e) => setPriceBasic(e.target.value)}
                                                placeholder="29.99"
                                                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-12 pr-6 py-5 text-white placeholder-gray-700 focus:outline-none focus:border-violet-500/50 transition-all font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Precio Premium (USD)</span>
                                        <div className="relative">
                                            <DollarSign size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-700" />
                                            <input
                                                type="number"
                                                value={pricePremium}
                                                onChange={(e) => setPricePremium(e.target.value)}
                                                placeholder="49.99"
                                                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-12 pr-6 py-5 text-white placeholder-gray-700 focus:outline-none focus:border-violet-500/50 transition-all font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Visibility */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Visibilidad</label>
                            <div className="grid grid-cols-3 gap-4">
                                {VISIBILITY_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setVisibility(opt.value)}
                                        className={`group flex flex-col items-center gap-3 p-6 rounded-3xl border transition-all duration-300 ${visibility === opt.value
                                            ? 'bg-white/5 border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.1)]'
                                            : 'bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03]'
                                            }`}
                                    >
                                        <opt.icon size={20} className={visibility === opt.value ? opt.color : 'text-gray-700 group-hover:text-gray-500'} />
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${visibility === opt.value ? 'text-white' : 'text-gray-600'}`}>
                                            {opt.label}
                                        </span>
                                        {visibility === opt.value && (
                                            <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Cover Image & Metadata */}
                    <div className="space-y-10">

                        {/* Cover Preview */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Portada</label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="relative aspect-square bg-[#080808] border border-white/5 rounded-[40px] overflow-hidden cursor-pointer group hover:border-violet-500/30 transition-all duration-500 shadow-2xl"
                            >
                                {coverPreview ? (
                                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                                        <ImageIcon size={48} className="text-gray-800" />
                                        <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Sin portada</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Cambiar Portada</span>
                                </div>
                            </div>
                        </div>

                        {/* Metadata Card */}
                        <div className="bg-[#080808] border border-white/5 rounded-3xl p-8 space-y-6">
                            <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Metadatos</h4>
                            <div className="space-y-5">
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-gray-700 uppercase tracking-widest">Tipo</span>
                                    <span className="font-black text-white bg-white/5 px-4 py-1.5 rounded-full uppercase tracking-widest">
                                        {product?.product_type || 'beat'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-gray-700 uppercase tracking-widest">ID</span>
                                    <span className="font-mono text-gray-500">#{id}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-gray-700 uppercase tracking-widest">Estado</span>
                                    <span className={`font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${['published', 'approved'].includes(product?.status) ? 'text-emerald-500 bg-emerald-500/10' : 'text-orange-500 bg-orange-500/10'}`}>
                                        {product?.status || 'draft'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-gray-700 uppercase tracking-widest">Visibilidad</span>
                                    <span className={`font-black uppercase tracking-widest ${visOption.color}`}>
                                        {visOption.label}
                                    </span>
                                </div>
                                {product?.created_at && (
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="font-bold text-gray-700 uppercase tracking-widest">Creado</span>
                                        <span className="font-mono text-gray-500">{new Date(product.created_at).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
