import React, { useState, useRef, useEffect } from 'react';
import { CloudUpload, ChevronDown, ArrowRight, ArrowLeft, Send, X, AlertCircle, Music } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SCALES = ['Mayor', 'Menor'];

const CustomBeatModal = ({ isOpen, onClose, producer }) => {
    const { user } = useAuthStore();

    // Wizard State
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(''); // Uploaded URL
    const [keyNote, setKeyNote] = useState('C');
    const [keyScale, setKeyScale] = useState('Menor');
    const [bpm, setBpm] = useState(0);
    const [budget, setBudget] = useState(0);

    // Step 2 State
    const [description, setDescription] = useState('');
    const [reference1, setReference1] = useState('');
    const [reference2, setReference2] = useState('');

    // Ref Inputs
    const fileInputRef = useRef(null);

    // Reset state when closed
    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setFile(null);
            setPreviewUrl('');
            setKeyNote('C');
            setKeyScale('Menor');
            setBpm(0);
            setBudget(0);
            setDescription('');
            setReference1('');
            setReference2('');
            setError('');
            setLoading(false);
        }
    }, [isOpen]);

    if (!isOpen || !producer) return null;

    const handleNumericalAdjust = (setter, current, max, delta) => {
        let newVal = current + delta;
        if (newVal < 0) newVal = 0;
        if (newVal > max) newVal = max;
        setter(newVal);
    };

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (!selected) return;

        setError('');

        // Validate type
        if (selected.type !== 'audio/mpeg' && !selected.name.toLowerCase().endsWith('.mp3')) {
            setError('Por favor sube un archivo MP3 válido.');
            return;
        }

        // Validate size (30MB)
        if (selected.size > 30 * 1024 * 1024) {
            setError('El archivo es demasiado grande (máximo 30MB).');
            return;
        }

        // Note: Duration validation could be added using HTML5 Audio element like legacy, keeping it simple for now or adding if needed.
        setFile(selected);
    };

    const uploadFile = async () => {
        if (!file) return null;
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'mp3_tagged'); // Reusing existing mapping for maquetas

            const { data } = await apiClient.post('/storage/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (!data || !data.key) throw new Error('Error al subir el archivo');

            setPreviewUrl(data.key);
            return data.key;
        } catch (err) {
            console.error(err);
            throw new Error('No se pudo subir la maqueta.');
        }
    };

    const validateStep1 = () => {
        setError('');
        if (budget < 10 || budget > 1000) {
            setError('El presupuesto debe estar entre $10 y $1000 USD.');
            return false;
        }
        if (bpm < 40 || bpm > 250) {
            setError('El BPM debe estar entre 40 y 250.');
            return false;
        }
        return true;
    };

    const gotoStep2 = () => {
        if (validateStep1()) setStep(2);
    };

    const isValidUrl = (string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    };

    const isReferenceLink = (url) => {
        if (!url) return true;
        if (!isValidUrl(url)) return false;
        const lower = url.toLowerCase();
        return lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('spotify.com');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert("Debes iniciar sesión para solicitar un beat.");
            return;
        }

        setError('');
        if (description.length < 10) {
            setError("Por favor, describe mejor lo que buscas (mínimo 10 caracteres).");
            return;
        }
        if (!isReferenceLink(reference1) || !isReferenceLink(reference2)) {
            setError('Ingresa enlaces válidos de YouTube o Spotify para las referencias.');
            return;
        }

        setLoading(true);
        try {
            let finalPreviewUrl = previewUrl;
            if (file && !previewUrl) {
                finalPreviewUrl = await uploadFile();
            }

            const res = await apiClient.post('/custom-requests', {
                producerId: producer.id,
                description,
                budget,
                bpm,
                key: `${keyNote} ${keyScale}`,
                referenceLink1: reference1,
                referenceLink2: reference2,
                previewUrl: finalPreviewUrl
            });

            alert('✅ ¡SOLICITUD PUBLICADA! Te estamos redirigiendo al muro de anuncios.');
            onClose();
            // Optionally redirect to feed handling normally via window location or router hook
            window.location.href = '/feed';
        } catch (err) {
            if (err.response?.data?.limitReached) {
                setError(`Ya enviaste tu solicitud diaria y en 24 horas podrás enviar otra. ¡Pásate a PRO para ilimitadas!`);
            } else {
                setError(err.response?.data?.error || err.message || 'Error al enviar la solicitud');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-[24px] w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-[#111] p-6 sm:px-10 border-b border-white/10 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            <Music size={28} className="text-white" /> Solicitar Beat Personalizado
                        </h2>
                        <p className="text-zinc-500 mt-2 text-sm sm:text-base font-semibold">
                            Dinos qué sonido tienes en mente para <strong className="text-white">@{producer?.nickname || producer?.users?.nickname}</strong>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-white transition-colors p-2 -mr-2"
                    >
                        <X size={28} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 sm:p-10 overflow-y-auto w-full relative">
                    <form id="solicitarForm" onSubmit={handleSubmit}>

                        {error && (
                            <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-start gap-3 text-sm font-semibold">
                                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                                <p>{error}</p>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 items-start animate-in slide-in-from-right-4 duration-300">
                                {/* Left: Upload */}
                                <div>
                                    <label className="block mb-3 font-bold text-xs uppercase text-zinc-500 tracking-widest">
                                        MAQUETA / PREVIEW QUE QUIERES TRABAJAR
                                    </label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-[20px] p-8 text-center cursor-pointer transition-all flex flex-col justify-center items-center h-[260px] ${file
                                            ? 'border-green-500 bg-green-500/5'
                                            : 'border-[#222] bg-[#080808] hover:border-zinc-700'
                                            }`}
                                    >
                                        <CloudUpload size={48} className={file ? 'text-green-500 mb-4' : 'text-zinc-700 mb-4'} />
                                        {file ? (
                                            <div>
                                                <span className="text-green-500 font-bold block mb-1">Archivo Seleccionado:</span>
                                                <span className="text-sm font-semibold text-white truncate max-w-[200px] block">{file.name}</span>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-zinc-400 font-semibold mb-1 block">Haz click para subir tu idea</span>
                                                <small className="text-zinc-600 block">MP3, 50 segundos máximo (máx. 30MB)</small>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="audio/mpeg"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                </div>

                                {/* Right: Specs Inputs */}
                                <div className="flex flex-col gap-6">
                                    {/* Key */}
                                    <div>
                                        <label className="block mb-3 font-bold text-xs uppercase text-zinc-500 tracking-widest">KEY</label>
                                        <div className="flex gap-4">
                                            <div className="relative flex-1">
                                                <select
                                                    value={keyNote}
                                                    onChange={(e) => setKeyNote(e.target.value)}
                                                    className="w-full bg-[#0c0c0c] border border-[#222] rounded-xl text-white px-4 py-3.5 appearance-none outline-none focus:border-zinc-600 font-semibold"
                                                >
                                                    {NOTES.map(n => <option key={n} value={n}>{n}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                                            </div>
                                            <div className="relative flex-1">
                                                <select
                                                    value={keyScale}
                                                    onChange={(e) => setKeyScale(e.target.value)}
                                                    className="w-full bg-[#0c0c0c] border border-[#222] rounded-xl text-white px-4 py-3.5 appearance-none outline-none focus:border-zinc-600 font-semibold"
                                                >
                                                    {SCALES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* BPM */}
                                    <div>
                                        <label className="block mb-3 font-bold text-xs uppercase text-zinc-500 tracking-widest">BPM</label>
                                        <div className="flex items-center gap-3">
                                            <button type="button" onClick={() => handleNumericalAdjust(setBpm, bpm, 250, -1)} className="w-12 h-12 rounded-xl bg-[#151515] border border-[#222] text-white flex items-center justify-center font-bold text-lg hover:bg-[#222] active:scale-95 transition-all">-</button>
                                            <input
                                                type="number"
                                                value={bpm}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    if (val <= 250) setBpm(val);
                                                }}
                                                className="flex-1 bg-[#0c0c0c] border border-[#222] rounded-xl text-white px-4 py-3 text-center outline-none focus:border-zinc-600 font-bold font-mono"
                                            />
                                            <button type="button" onClick={() => handleNumericalAdjust(setBpm, bpm, 250, 1)} className="w-12 h-12 rounded-xl bg-[#151515] border border-[#222] text-white flex items-center justify-center font-bold text-lg hover:bg-[#222] active:scale-95 transition-all">+</button>
                                        </div>
                                    </div>

                                    {/* Budget */}
                                    <div>
                                        <label className="block mb-3 font-bold text-xs uppercase text-zinc-500 tracking-widest">PRESUPUESTO (USD) *</label>
                                        <div className="flex items-center gap-3">
                                            <button type="button" onClick={() => handleNumericalAdjust(setBudget, budget, 1000, -10)} className="w-12 h-12 rounded-xl bg-[#151515] border border-[#222] text-white flex items-center justify-center font-bold text-lg hover:bg-[#222] active:scale-95 transition-all">-</button>
                                            <div className="relative flex-1">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-lg">$</span>
                                                <input
                                                    type="number"
                                                    value={budget}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        if (val <= 1000) setBudget(val);
                                                    }}
                                                    className="w-full bg-[#0c0c0c] border border-[#222] rounded-xl text-white pl-10 pr-4 py-3 text-center outline-none focus:border-zinc-600 font-bold text-lg font-mono"
                                                />
                                            </div>
                                            <button type="button" onClick={() => handleNumericalAdjust(setBudget, budget, 1000, 10)} className="w-12 h-12 rounded-xl bg-[#151515] border border-[#222] text-white flex items-center justify-center font-bold text-lg hover:bg-[#222] active:scale-95 transition-all">+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-in slide-in-from-right-4 duration-300">
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="font-bold text-xs uppercase text-zinc-500 tracking-widest">DESCRIPCIÓN DEL SONIDO *</label>
                                        <span className={`text-xs font-bold ${description.length >= 300 ? 'text-red-500' : 'text-zinc-500'}`}>
                                            {description.length}/300
                                        </span>
                                    </div>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        maxLength={300}
                                        placeholder="Ej: Busco algo oscuro estilo Travis Scott..."
                                        rows={6}
                                        required
                                        className="w-full bg-[#080808] border border-[#1a1a1a] rounded-2xl text-white p-5 resize-none outline-none focus:border-zinc-700 transition-colors"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block mb-3 font-bold text-xs uppercase text-zinc-500 tracking-widest">REFERENCIA 1 (URL)</label>
                                        <input
                                            type="url"
                                            value={reference1}
                                            onChange={(e) => setReference1(e.target.value)}
                                            placeholder="YouTube / Spotify"
                                            className="w-full bg-[#0c0c0c] border border-[#222] rounded-xl text-white px-5 py-4 outline-none focus:border-zinc-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-3 font-bold text-xs uppercase text-zinc-500 tracking-widest">REFERENCIA 2 (URL)</label>
                                        <input
                                            type="url"
                                            value={reference2}
                                            onChange={(e) => setReference2(e.target.value)}
                                            placeholder="YouTube / Spotify"
                                            className="w-full bg-[#0c0c0c] border border-[#222] rounded-xl text-white px-5 py-4 outline-none focus:border-zinc-700"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Footers */}
                        <div className="mt-10 pt-8 border-t border-white/5 flex justify-end gap-4 shrink-0">
                            {step === 1 ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-3.5 text-zinc-500 font-bold uppercase tracking-wider hover:text-white transition-colors text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={gotoStep2}
                                        className="px-8 py-3.5 bg-white text-black rounded-xl font-black uppercase tracking-wider hover:-translate-y-0.5 transition-transform flex items-center gap-2 text-sm"
                                    >
                                        Siguiente <ArrowRight size={18} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        disabled={loading}
                                        className="px-6 py-3.5 text-zinc-500 font-bold uppercase tracking-wider hover:text-white transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                                    >
                                        <ArrowLeft size={18} /> Anterior
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-3.5 bg-white text-black rounded-xl font-black uppercase tracking-wider hover:bg-zinc-200 shadow-xl flex items-center gap-2 text-sm disabled:opacity-50 transition-all"
                                    >
                                        {loading ? (
                                            <span className="animate-pulse">Enviando...</span>
                                        ) : (
                                            <>Enviar Solicitud <Send size={16} /></>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default CustomBeatModal;
