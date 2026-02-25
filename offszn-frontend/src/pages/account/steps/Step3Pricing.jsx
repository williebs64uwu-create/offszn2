import React, { useState } from 'react';
import { useUploadStore } from '../../../store/uploadStore';
import { DollarSign, Users, Trash2, Search, Info, UserPlus, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../api/client';

export default function Step3Pricing() {
    const {
        productType, basePrice, promoPrice, isFree, collaborators,
        updateField, addCollaborator, removeCollaborator, updateCollaboratorSplit
    } = useUploadStore();

    const isBeat = productType === 'beat';

    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const searchUsers = async (val) => {
        setSearch(val);
        if (val.length < 2) { setResults([]); return; }

        setSearching(true);
        const { data } = await supabase
            .from('users')
            .select('id, nickname, avatar_url')
            .ilike('nickname', `%${val}%`)
            .limit(5);

        setResults(data || []);
        setSearching(false);
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">

            {/* --- CONFIGURACIÓN DE PRECIOS --- */}
            <div className="space-y-8">
                <div className="flex justify-between items-center px-1">
                    <div className="space-y-1">
                        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <DollarSign size={14} className="text-violet-500" />
                            Precios y Licencias
                        </h3>
                    </div>

                    <button
                        onClick={() => updateField('isFree', !isFree)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all
                        ${isFree ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/[0.02] border-white/5 text-gray-500 hover:border-white/10'}`}
                    >
                        <div className={`w-2 h-2 rounded-full ${isFree ? 'bg-emerald-500 animate-pulse' : 'bg-gray-700'}`} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Descarga Gratuita</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {isBeat ? (
                        <>
                            <PriceInput
                                label="Licencia Básica (MP3)"
                                description="Precio para leasing básico"
                                value={basePrice}
                                onChange={(v) => updateField('basePrice', v)}
                            />
                            <PriceInput
                                label="Licencia Exclusiva (WAV/Stem)"
                                description="Venta total del beat"
                                value={promoPrice}
                                onChange={(v) => updateField('promoPrice', v)}
                            />
                        </>
                    ) : (
                        <PriceInput
                            label="Precio Estándar"
                            description="Licencia de uso comercial"
                            value={basePrice}
                            onChange={(v) => updateField('basePrice', v)}
                        />
                    )}
                </div>
            </div>

            {/* --- COLABORACIONES --- */}
            <div className="pt-12 border-t border-white/5 space-y-8">
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-1">Colaboradores y Splits</h3>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-12">

                    {/* Lista de Colaboradores */}
                    <div className="space-y-4">
                        {collaborators.length === 0 ? (
                            <div className="h-[200px] border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-gray-600">
                                <Users size={32} strokeWidth={1.5} />
                                <p className="mt-4 text-[10px] font-bold uppercase tracking-widest">No hay más autores</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {collaborators.map(c => (
                                    <div key={c.id} className="flex items-center gap-4 bg-[#111] border border-white/5 px-6 py-4 rounded-2xl group transition-all hover:border-white/10 shadow-xl">
                                        <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-500 font-bold text-xs">
                                            {c.nickname[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[11px] font-bold text-white uppercase tracking-widest">{c.nickname}</p>
                                            <p className="text-[9px] text-gray-600 uppercase tracking-widest">Split de Ganancias</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={c.split}
                                                    onChange={(e) => updateCollaboratorSplit(c.id, e.target.value)}
                                                    className="w-20 bg-black border border-white/5 rounded-lg py-2 pl-3 pr-8 text-right text-xs text-violet-500 font-bold focus:border-violet-500 outline-none"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-700 font-bold">%</span>
                                            </div>
                                            <button
                                                onClick={() => removeCollaborator(c.id)}
                                                className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-3 px-2">
                            <Info size={14} className="text-violet-500" />
                            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest leading-relaxed">
                                Los porcentajes deben sumar 100% entre todos los autores.
                            </p>
                        </div>
                    </div>

                    {/* Buscador */}
                    <div className="space-y-4">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1 block">Añadir Co-Autor</label>
                        <div className="relative">
                            <div className="flex items-center h-[52px] bg-[#111] border border-white/5 rounded-xl px-4 focus-within:border-violet-500 transition-all">
                                <Search size={18} className="text-gray-600" />
                                <input
                                    type="text"
                                    placeholder="Buscar por @usuario..."
                                    value={search}
                                    onChange={(e) => searchUsers(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none text-white text-sm font-medium px-4"
                                />
                                {searching && <div className="w-4 h-4 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />}
                            </div>

                            {results.length > 0 && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                                    {results.map(r => (
                                        <button
                                            key={r.id}
                                            onClick={() => {
                                                addCollaborator({ id: r.id, nickname: r.nickname, split: 0 });
                                                setSearch('');
                                                setResults([]);
                                            }}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-white/5 text-left transition-colors border-b border-white/5 last:border-none"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-gray-500 uppercase">
                                                {r.nickname[0]}
                                            </div>
                                            <span className="text-[11px] font-bold text-white uppercase tracking-widest">{r.nickname}</span>
                                            <UserPlus size={14} className="ml-auto text-violet-500" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PriceInput({ label, description, value, onChange }) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{label}</label>
            </div>
            <div className="flex items-center h-[64px] bg-[#111] border border-white/5 rounded-2xl px-6 focus-within:border-violet-500 transition-all shadow-xl group">
                <span className="text-xl font-bold text-gray-700 group-focus-within:text-violet-500 transition-colors">$</span>
                <input
                    type="number"
                    placeholder="0.00"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-2xl font-bold text-white px-4 placeholder:text-gray-800"
                />
                <div className="text-right shrink-0">
                    <p className="text-[8px] font-bold text-gray-700 uppercase tracking-widest">USD</p>
                    <p className="text-[9px] font-bold text-violet-500/50 uppercase tracking-widest">Dólares</p>
                </div>
            </div>
            <p className="text-[9px] font-bold text-gray-700 uppercase tracking-widest ml-1">{description}</p>
        </div>
    );
}
