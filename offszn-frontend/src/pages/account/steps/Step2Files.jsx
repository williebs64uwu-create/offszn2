import React, { useState } from 'react';
import { useUploadStore } from '../../../store/uploadStore';
import { Music, FileAudio, Package, Hash, Zap, Eye, Calendar, Shield, Cpu, Activity, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Step2Files() {
    const {
        productType,
        files, bpm, musicalKey, visibility, date, soundCount,
        updateField, updateFiles
    } = useUploadStore();

    const [activeAudioTab, setActiveAudioTab] = useState('high'); // 'high' o 'low'

    const isBeat = productType === 'beat';
    const isLoop = productType === 'loopkit';
    const isKit = productType === 'drumkit' || productType === 'preset';

    const handleFileChange = (key, file) => {
        if (!file) return;
        updateFiles({ [key]: file });
    };

    const MUSIC_KEYS = [
        'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm',
        'C Maj', 'C# Maj', 'D Maj', 'D# Maj', 'E Maj', 'F Maj', 'F# Maj', 'G Maj', 'G# Maj', 'A Maj', 'A# Maj', 'B Maj'
    ];

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">

            {/* --- ARCHIVOS --- */}
            <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                    <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Package size={14} className="text-violet-500" />
                        Archivos de {productType === 'beat' ? 'Instrumental' : 'Producto'}
                    </h3>
                    {isKit && (
                        <div className="flex gap-2 bg-[#111] p-1 rounded-lg border border-white/5">
                            <button
                                onClick={() => setActiveAudioTab('high')}
                                className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all
                                ${activeAudioTab === 'high' ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-white'}`}
                            >
                                Alta
                            </button>
                            <button
                                onClick={() => setActiveAudioTab('low')}
                                className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all
                                ${activeAudioTab === 'low' ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-white'}`}
                            >
                                Baja
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {isBeat ? (
                        <>
                            <HorizontalUploadSlot
                                label="MP3 Tagged (Preview)"
                                description="Versión con marcas de agua para preescucha gratuita."
                                file={files.mp3_tagged}
                                accept=".mp3"
                                icon={<Music size={18} />}
                                onChange={(f) => handleFileChange('mp3_tagged', f)}
                            />
                            <HorizontalUploadSlot
                                label="WAV Untagged (Master)"
                                description="Producto final en alta calidad sin marcas de agua."
                                file={files.wav_untagged}
                                accept=".wav"
                                icon={<FileAudio size={18} />}
                                onChange={(f) => handleFileChange('wav_untagged', f)}
                            />
                            <HorizontalUploadSlot
                                label="Trackouts / Stems (.ZIP)"
                                description="Opcional: Archivos por separado para mezcla."
                                file={files.stems}
                                accept=".zip,.rar"
                                icon={<Package size={18} />}
                                onChange={(f) => handleFileChange('stems', f)}
                            />
                        </>
                    ) : (
                        <>
                            <HorizontalUploadSlot
                                label={activeAudioTab === 'high' ? "Audio Preview (Alta)" : "Audio Preview (Baja)"}
                                description="Previsualización de audio para los compradores."
                                file={activeAudioTab === 'high' ? files.mp3_tagged : files.mp3_low}
                                accept=".mp3"
                                icon={<Music size={18} />}
                                onChange={(f) => handleFileChange(activeAudioTab === 'high' ? 'mp3_tagged' : 'mp3_low', f)}
                            />
                            <HorizontalUploadSlot
                                label="Contenido Principal (.ZIP)"
                                description={`Sube el ${productType} completo comprimido.`}
                                file={files.zip_file}
                                accept=".zip,.rar"
                                icon={<Package size={18} />}
                                onChange={(f) => handleFileChange('zip_file', f)}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* --- METADATOS TÉCNICOS --- */}
            {(isBeat || isLoop || isKit) && (
                <div className="pt-12 border-t border-white/5 space-y-6">
                    <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-1">Datos Técnicos</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {isKit && (
                            <div className="space-y-3">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1 block text-right md:text-left">Número de Sonidos / Presets</label>
                                <div className="flex items-center h-[52px] bg-[#111] border border-white/5 rounded-xl px-4 focus-within:border-violet-500 transition-all">
                                    <Hash size={16} className="text-gray-600" />
                                    <input
                                        type="number"
                                        placeholder="Ej: 150"
                                        value={soundCount}
                                        onChange={(e) => updateField('soundCount', e.target.value)}
                                        className="w-full bg-transparent border-none outline-none text-white font-medium px-4"
                                    />
                                </div>
                            </div>
                        )}
                        {(isBeat || isLoop) && (
                            <>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1 block">Tempo (BPM)</label>
                                    <div className="flex items-center h-[52px] bg-[#111] border border-white/5 rounded-xl px-4 focus-within:border-violet-500 transition-all">
                                        <Hash size={16} className="text-gray-600" />
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={bpm}
                                            onChange={(e) => updateField('bpm', e.target.value)}
                                            className="w-full bg-transparent border-none outline-none text-white font-medium px-4"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1 block">Tonalidad (Key)</label>
                                    <div className="flex items-center h-[52px] bg-[#111] border border-white/5 rounded-xl px-4 focus-within:border-violet-500 transition-all">
                                        <Zap size={16} className="text-gray-600" />
                                        <select
                                            value={musicalKey}
                                            onChange={(e) => updateField('musicalKey', e.target.value)}
                                            className="w-full bg-transparent border-none outline-none text-white font-medium px-4 cursor-pointer"
                                        >
                                            <option value="" className="bg-[#111]">Seleccionar...</option>
                                            {MUSIC_KEYS.map(k => <option key={k} value={k} className="bg-[#111]">{k}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* --- ACCESO Y LANZAMIENTO --- */}
            <div className="pt-12 border-t border-white/5 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1 block">Visibilidad</label>
                        <div className="grid grid-cols-3 gap-2 bg-[#111] p-1.5 rounded-xl border border-white/5">
                            {[
                                { id: 'public', label: 'Público', icon: <Eye size={12} /> },
                                { id: 'private', label: 'Borrador', icon: <Shield size={12} /> },
                                { id: 'unlisted', label: 'Oculto', icon: <Activity size={12} /> }
                            ].map(v => (
                                <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => updateField('visibility', v.id)}
                                    className={`flex items-center justify-center gap-2 py-3.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all 
                                    ${visibility === v.id ? 'bg-violet-600 text-white shadow-xl' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    {v.icon}
                                    {v.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1 block">Fecha de Lanzamiento</label>
                        <div className="flex items-center h-[52px] bg-[#111] border border-white/5 rounded-xl px-4 focus-within:border-violet-500 transition-all">
                            <Calendar size={18} className="text-gray-600" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => updateField('date', e.target.value)}
                                className="w-full bg-transparent border-none outline-none text-white text-[10px] font-bold uppercase tracking-widest px-4 [color-scheme:dark]"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function HorizontalUploadSlot({ label, description, file, onChange, accept, icon }) {
    return (
        <div className={`relative flex items-center h-[72px] bg-[#111] border rounded-2xl px-6 transition-all duration-300 group overflow-hidden
            ${file ? 'border-violet-500/30' : 'border-white/5 hover:border-white/20'}`}>

            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                ${file ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-600 group-hover:text-white group-hover:bg-white/10'}`}>
                {file ? <CheckCircle2 size={20} /> : icon}
            </div>

            <div className="ml-6 flex-1 min-w-0">
                <div className="flex items-center gap-3">
                    <p className="text-[11px] font-bold text-white uppercase tracking-widest truncate">{file ? file.name : label}</p>
                    {file && <span className="text-[9px] text-gray-600 font-bold">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>}
                </div>
                {!file && <p className="text-[9px] text-gray-600 uppercase tracking-widest mt-0.5">{description}</p>}
                {file && (
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest">Listo para subir</span>
                    </div>
                )}
            </div>

            <div className="ml-4">
                <button className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all
                    ${file
                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'
                        : 'bg-white/5 text-white hover:bg-violet-600 shadow-xl'}`}>
                    {file ? 'Eliminar' : 'Añadir'}
                </button>
            </div>

            <input
                type="file"
                accept={accept}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                onChange={(e) => onChange(e.target.files[0])}
            />
        </div>
    );
}
