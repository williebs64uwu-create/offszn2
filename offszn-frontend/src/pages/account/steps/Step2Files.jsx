import React from 'react';
import { useUploadStore } from '../../../store/uploadStore';
import { Music, FileAudio, Package, Hash, Zap, Eye, Calendar, Shield, Cpu, Activity } from 'lucide-react';

export default function Step2Files() {
    const {
        productType,
        files, bpm, musicalKey, visibility, date,
        updateField, updateFiles
    } = useUploadStore();

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
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">

            {/* --- AUDIO ASSETS PIPELINE --- */}
            {isBeat ? (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <UploadZone
                            label="MP3 Preview (Tagged)"
                            description="Gratis / Preescucha con marcas de agua"
                            file={files.mp3_tagged}
                            accept=".mp3"
                            icon={<Music size={28} />}
                            onChange={(f) => handleFileChange('mp3_tagged', f)}
                        />
                        <UploadZone
                            label="High-Res WAV (Master)"
                            description="Producto final sin marcas de agua"
                            file={files.wav_untagged}
                            accept=".wav"
                            icon={<FileAudio size={28} />}
                            onChange={(f) => handleFileChange('wav_untagged', f)}
                        />
                    </div>

                    <UploadZone
                        label="Stems / Trackout Container"
                        description="Opcional: Archivo .ZIP con canales separados"
                        file={files.stems}
                        accept=".zip,.rar"
                        icon={<Package size={28} />}
                        onChange={(f) => handleFileChange('stems', f)}
                    />
                </>
            ) : (
                <UploadZone
                    label={productType === 'preset' ? "Preset Bank (.ZIP / .RAR)" : "Master Kit / Pack (.ZIP / .RAR)"}
                    description="Contenido completo del producto comprimido"
                    file={files.zip_file}
                    accept=".zip,.rar"
                    icon={<Package size={28} />}
                    onChange={(f) => handleFileChange('zip_file', f)}
                />
            )}

            {/* --- TECHNICAL METADATA --- */}
            <div className="pt-12 border-t border-white/5 space-y-10">
                {(isBeat || isLoop) && (
                    <>
                        <div className="flex items-center gap-4 text-[10px] font-black text-gray-700 uppercase tracking-[0.4em]">
                            <Cpu size={14} className="text-violet-500/40" /> Technical Data
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {/* BPM */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-4">Tempo (BPM)</label>
                                <div className="relative group">
                                    <input
                                        type="number"
                                        placeholder="140"
                                        value={bpm}
                                        onChange={(e) => updateField('bpm', e.target.value)}
                                        className="w-full bg-black border border-white/5 rounded-3xl px-6 py-5 pl-12 text-white font-black text-lg focus:outline-none focus:border-violet-500 transition-all shadow-inner placeholder:text-white/5"
                                    />
                                    <Hash size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-800 group-focus-within:text-violet-500 transition-colors" />
                                </div>
                            </div>

                            {/* Scale / Key */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-4">Root Key</label>
                                <div className="relative group">
                                    <select
                                        value={musicalKey}
                                        onChange={(e) => updateField('musicalKey', e.target.value)}
                                        className="w-full bg-black border border-white/5 rounded-3xl px-6 py-5 pl-12 text-white font-black text-lg focus:outline-none focus:border-violet-500 transition-all appearance-none cursor-pointer shadow-inner"
                                    >
                                        <option value="" className="bg-[#0A0A0A]">Select...</option>
                                        {MUSIC_KEYS.map(k => <option key={k} value={k} className="bg-[#0A0A0A]">{k}</option>)}
                                    </select>
                                    <Zap size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-800 group-focus-within:text-violet-500 transition-colors" />
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-800 group-focus-within:text-violet-500 transition-colors">
                                        <Activity size={16} className="rotate-90" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div className="space-y-10">
                    <div className="flex items-center gap-4 text-[10px] font-black text-gray-700 uppercase tracking-[0.4em]">
                        <Shield size={14} className="text-violet-500/40" /> Access Protocol
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Visibility */}
                        <div className="md:col-span-2 space-y-4">
                            <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-4">Visibility Setting</label>
                            <div className="grid grid-cols-3 gap-2 bg-black border border-white/5 p-1.5 rounded-3xl shadow-inner">
                                {[
                                    { id: 'public', label: 'Public', icon: <Eye size={12} /> },
                                    { id: 'private', label: 'Private (Draft)', icon: <Shield size={12} /> },
                                    { id: 'unlisted', label: 'Unlisted', icon: <Activity size={12} /> }
                                ].map(v => (
                                    <button
                                        key={v.id}
                                        type="button"
                                        onClick={() => updateField('visibility', v.id)}
                                        className={`flex items-center justify-center gap-2 py-4 text-[9px] font-black uppercase tracking-widest rounded-2xl transition-all duration-500 ${visibility === v.id ? 'bg-white text-black shadow-2xl scale-[1.02]' : 'text-gray-700 hover:text-white hover:bg-white/5'}`}
                                    >
                                        {v.icon}
                                        {v.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Release Schedule */}
                        <div className="md:col-span-2 space-y-4">
                            <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-4">Release Schedule</label>
                            <div className="relative group">
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => updateField('date', e.target.value)}
                                    className="w-full bg-black border border-white/5 rounded-[28px] px-8 py-5 pl-14 text-white font-black uppercase tracking-[0.2em] text-[11px] focus:outline-none focus:border-violet-500 transition-all [color-scheme:dark] shadow-inner"
                                />
                                <Calendar size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-800 group-focus-within:text-violet-500 transition-colors" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function UploadZone({ label, description, file, onChange, accept, icon }) {
    return (
        <div className="space-y-4">
            <div>
                <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-4 block">{label}</label>
                <span className="text-[9px] font-bold text-gray-800 uppercase tracking-widest ml-4">{description}</span>
            </div>
            <div className={`relative group border border-white/5 rounded-[40px] p-10 transition-all duration-700 min-h-[160px] flex flex-col items-center justify-center text-center gap-4 overflow-hidden shadow-2xl ${file ? 'bg-violet-500/[0.03] border-violet-500/30' : 'bg-black hover:bg-white/[0.01] hover:border-white/10'}`}>
                <div className={`absolute inset-0 bg-violet-500/5 transition-opacity duration-1000 ${file ? 'opacity-100' : 'opacity-0'}`} />

                <input
                    type="file"
                    accept={accept}
                    className="absolute inset-0 opacity-0 cursor-pointer z-20"
                    onChange={(e) => onChange(e.target.files[0])}
                />

                {file ? (
                    <div className="relative z-10 flex flex-col items-center gap-4 animate-in zoom-in duration-500">
                        <div className="w-16 h-16 rounded-[22px] bg-violet-500/20 flex items-center justify-center text-violet-500 shadow-2xl border border-violet-500/20 group-hover:scale-110 transition-transform duration-700">
                            {icon}
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm font-black text-white max-w-[280px] truncate block px-4">{file.name}</span>
                            <span className="text-[9px] text-emerald-500 uppercase font-black tracking-[0.3em] flex items-center justify-center gap-2">
                                <Shield size={10} /> Verified & Ready
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="relative z-10 flex flex-col items-center gap-6 transition-all duration-700 group-hover:translate-y-[-4px]">
                        <div className="w-16 h-16 rounded-[22px] bg-white/[0.02] flex items-center justify-center text-gray-800 group-hover:text-violet-500 transition-all border border-white/5 group-hover:border-violet-500/20 shadow-inner group-hover:scale-110">
                            {icon}
                        </div>
                        <div className="space-y-2">
                            <div className="text-[10px] font-black text-gray-600 group-hover:text-gray-300 transition-colors uppercase tracking-[0.2em]">Secure Upload Pipeline</div>
                            <div className="text-[9px] font-bold text-gray-800 uppercase tracking-widest">Supports {accept.toUpperCase()} formats</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
