import React, { useState } from 'react';
import { useUploadStore } from '../../../store/uploadStore';
import { DollarSign, Percent, Users, Plus, Trash2, ShieldCheck, Zap } from 'lucide-react';
import { supabase } from '../../../api/client';

export default function Step3Pricing() {
    const {
        basePrice, promoPrice, isFree, collaborators,
        updateField, addCollaborator, removeCollaborator, updateCollaboratorSplit
    } = useUploadStore();

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
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* 1. Licencias y Precios */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Configuración de Precios</h3>
                    <div className="flex items-center gap-2 bg-[#0a0a0a] px-3 py-1.5 rounded-lg border border-white/5">
                        <input
                            type="checkbox"
                            id="isFree"
                            checked={isFree}
                            onChange={(e) => updateField('isFree', e.target.checked)}
                            className="accent-violet-500"
                        />
                        <label htmlFor="isFree" className="text-[10px] font-bold text-white uppercase cursor-pointer">Permitir Descarga Gratis</label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PriceInput
                        title="Licencia Básica (MP3)"
                        description="Uso limitado, con tags."
                        value={basePrice}
                        onChange={(v) => updateField('basePrice', v)}
                    />
                    <PriceInput
                        title="Licencia Premium (WAV)"
                        description="Uso comercial, sin tags."
                        value={promoPrice}
                        onChange={(v) => updateField('promoPrice', v)}
                    />
                </div>
            </div>

            <hr className="border-white/5" />

            {/* 2. Collaborators */}
            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Colaboradores & Splits</h3>
                    <p className="text-[10px] text-gray-600 uppercase font-medium">Define los porcentajes de ganancia para cada autor.</p>
                </div>

                <div className="space-y-4">
                    {collaborators.map(c => (
                        <div key={c.id} className="flex items-center gap-4 bg-[#0a0a0a] p-4 rounded-xl border border-white/5 animate-in zoom-in duration-200">
                            <div className="flex-1 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold text-xs uppercase">
                                    {c.nickname[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{c.nickname}</p>
                                    <p className="text-[10px] text-gray-600 uppercase font-black tracking-tighter">Co-Autor</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative w-24">
                                    <input
                                        type="number"
                                        value={c.split}
                                        onChange={(e) => updateCollaboratorSplit(c.id, e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-lg py-2 pl-3 pr-7 text-right text-sm text-white font-bold"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-xs">%</span>
                                </div>
                                <button
                                    onClick={() => removeCollaborator(c.id)}
                                    className="p-2 text-red-500/50 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Buscador de Colaboradores */}
                    <div className="relative">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar por nickname (ej: Metro Boomin)"
                                value={search}
                                onChange={(e) => searchUsers(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-4 pl-12 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all font-bold"
                            />
                            <Users size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                            {searching && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>}
                        </div>

                        {results.length > 0 && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-[#121212] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-20">
                                {results.map(r => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => {
                                            addCollaborator({ id: r.id, nickname: r.nickname, split: 0 });
                                            setSearch('');
                                            setResults([]);
                                        }}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-white/5 text-left border-b border-white/5 last:border-none transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400">
                                            {r.nickname[0]}
                                        </div>
                                        <span className="text-sm font-bold text-white">{r.nickname}</span>
                                        <Plus size={14} className="ml-auto text-violet-500" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function PriceInput({ title, description, value, onChange }) {
    return (
        <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex flex-col gap-4">
            <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-tight">{title}</h4>
                <p className="text-[10px] text-gray-600 uppercase font-medium mt-0.5">{description}</p>
            </div>
            <div className="relative">
                <input
                    type="number"
                    placeholder="0.00"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-black border border-white/5 rounded-xl py-4 pl-10 pr-4 text-2xl font-black text-violet-500 outline-none focus:border-violet-500/50 transition-all"
                />
                <DollarSign size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" />
            </div>
        </div>
    );
}
