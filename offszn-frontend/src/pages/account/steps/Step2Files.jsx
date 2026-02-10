import React from 'react';
import { useUploadStore } from '../../../store/uploadStore';
import { Music, FileAudio, Package, Hash, Zap, Eye, Calendar } from 'lucide-react';

export default function Step2Files() {
    const {
        files, bpm, musicalKey, visibility, date,
        updateField, updateFiles
    } = useUploadStore();

    const handleFileChange = (key, file) => {
        if (!file) return;
        updateFiles({ [key]: file });
    };

    const MUSIC_KEYS = [
        'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm',
        'C Maj', 'C# Maj', 'D Maj', 'D# Maj', 'E Maj', 'F Maj', 'F# Maj', 'G Maj', 'G# Maj', 'A Maj', 'A# Maj', 'B Maj'
    ];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* 1. Zonas de Carga de Audio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UploadZone
                    label="MP3 con Tags (Gratis / Preescucha)"
                    file={files.mp3_tagged}
                    accept=".mp3"
                    icon={<Music size={24} />}
                    onChange={(f) => handleFileChange('mp3_tagged', f)}
                />
                <UploadZone
                    label="WAV Sin Tags (Producto Final)"
                    file={files.wav_untagged}
                    accept=".wav"
                    icon={<FileAudio size={24} />}
                    onChange={(f) => handleFileChange('wav_untagged', f)}
                />
            </div>

            <UploadZone
                label="Stems / Trackout (Opcional .ZIP)"
                file={files.stems}
                accept=".zip,.rar"
                icon={<Package size={24} />}
                onChange={(f) => handleFileChange('stems', f)}
            />

            <hr className="border-white/5" />

            {/* 2. Metadata Técnica e Información */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* BPM & Key */}
                <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Tempo (BPM)</label>
                        <div className="relative">
                            <input
                                type="number"
                                placeholder="Ej: 140"
                                value={bpm}
                                onChange={(e) => updateField('bpm', e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-3 pl-10 text-white font-bold focus:outline-none focus:border-violet-500/50 transition-all"
                            />
                            <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Tonalidad (Key)</label>
                        <div className="relative">
                            <select
                                value={musicalKey}
                                onChange={(e) => updateField('musicalKey', e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-3 pl-10 text-white font-bold focus:outline-none focus:border-violet-500/50 transition-all appearance-none"
                            >
                                <option value="">Seleccionar Tonalidad...</option>
                                {MUSIC_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                            <Zap size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                        </div>
                    </div>
                </div>

                {/* Visibilidad y Fecha */}
                <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Visibilidad</label>
                        <div className="grid grid-cols-3 gap-2 bg-[#0a0a0a] p-1 border border-white/5 rounded-xl">
                            {[
                                { id: 'public', label: 'Público', icon: <Eye size={12} /> },
                                { id: 'private', label: 'Privado', icon: <Eye size={12} /> },
                                { id: 'unlisted', label: 'Oculto', icon: <Eye size={12} /> }
                            ].map(v => (
                                <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => updateField('visibility', v.id)}
                                    className={`py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${visibility === v.id ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                                >
                                    {v.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Fecha de Lanzamiento</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => updateField('date', e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-3 pl-10 text-white font-bold focus:outline-none focus:border-violet-500/50 transition-all [color-scheme:dark]"
                            />
                            <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function UploadZone({ label, file, onChange, accept, icon }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">{label}</label>
            <div className={`relative group border-2 border-dashed rounded-2xl p-6 transition-all h-[120px] flex flex-col items-center justify-center text-center gap-2 ${file ? 'border-violet-500/50 bg-violet-500/5' : 'border-white/5 bg-[#0a0a0a] hover:border-white/10'}`}>
                <input
                    type="file"
                    accept={accept}
                    className="absolute inset-0 opacity-0 cursor-pointer z-20"
                    onChange={(e) => onChange(e.target.files[0])}
                />

                {file ? (
                    <>
                        <div className="text-violet-400 group-hover:scale-110 transition-transform">{icon}</div>
                        <span className="text-sm font-bold text-white max-w-[80%] truncate">{file.name}</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-violet-500 uppercase font-black tracking-widest">Listo para Procesar</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="text-gray-700 group-hover:text-gray-500 group-hover:scale-110 transition-all">{icon}</div>
                        <div className="text-xs font-bold text-gray-600 group-hover:text-gray-400 transition-colors">Arrastra o haz clic para subir</div>
                    </>
                )}
            </div>
        </div>
    );
}
