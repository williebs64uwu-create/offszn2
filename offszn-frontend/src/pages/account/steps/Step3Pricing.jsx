import React, { useState } from 'react';
import { useUploadStore } from '../../../store/uploadStore';
import { DollarSign, Percent, Users, Plus, Trash2, ShieldCheck, Zap, HandCoins, UserPlus, Search, Info } from 'lucide-react';
import { supabase } from '../../../api/client';

export default function Step3Pricing() {
    const {
        productType, basePrice, promoPrice, isFree, collaborators,
        updateField, addCollaborator, removeCollaborator, updateCollaboratorSplit
    } = useUploadStore();

    const isBeat = productType === 'beat';
    const isKit = productType === 'drumkit' || productType === 'preset';

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
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">

            {/* --- COMMERCIAL CONFIGURATION --- */}
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <HandCoins size={16} className="text-violet-500" />
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">Commercial Setup</h3>
                        </div>
                        <p className="text-[10px] text-gray-700 font-bold uppercase tracking-widest ml-7">Protocolo de monetización y licencias comerciales</p>
                    </div>

                    <div className="flex items-center gap-3 bg-white/[0.02] px-6 py-3 rounded-2xl border border-white/5 hover:border-violet-500/30 transition-all cursor-pointer group shadow-2xl">
                        <input
                            type="checkbox"
                            id="isFree"
                            checked={isFree}
                            onChange={(e) => updateField('isFree', e.target.checked)}
                            className="w-5 h-5 accent-violet-500 cursor-pointer"
                        />
                        <label htmlFor="isFree" className="text-[10px] font-black text-gray-400 group-hover:text-white uppercase tracking-[0.2em] cursor-pointer transition-colors">Permitir Descarga Gratuita</label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {isBeat ? (
                        <>
                            <PriceInput
                                title="Basic License (MP3)"
                                description="Uso limitado / Tagged pre-listen"
                                value={basePrice}
                                onChange={(v) => updateField('basePrice', v)}
                            />
                            <PriceInput
                                title="Exclusive License (WAV)"
                                description="Uso industrial / Master HQ quality"
                                value={promoPrice}
                                onChange={(v) => updateField('promoPrice', v)}
                            />
                        </>
                    ) : (
                        <PriceInput
                            title="Standard Product License"
                            description="Licencia completa para uso en producciones"
                            value={basePrice}
                            onChange={(v) => updateField('basePrice', v)}
                        />
                    )}
                </div>
            </div>

            {/* --- REVENUE SPLITS & COLABS --- */}
            <div className="pt-12 border-t border-white/5 space-y-10">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Users size={16} className="text-violet-500" />
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">Revenue Splits</h3>
                    </div>
                    <p className="text-[10px] text-gray-700 font-bold uppercase tracking-widest ml-7">Sincronización de derechos y distribución de royalties</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                    {/* Active Collaborators List */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-4 block mb-2">Authenticated Authors</label>

                        <div className="space-y-3">
                            {collaborators.length === 0 && (
                                <div className="p-10 border border-white/5 border-dashed rounded-[40px] flex flex-col items-center justify-center text-center gap-4 bg-black/40">
                                    <div className="w-16 h-16 rounded-3xl bg-white/[0.02] flex items-center justify-center text-gray-800 border border-white/5">
                                        <Users size={32} />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Sin colaboradores adicionales</p>
                                </div>
                            )}

                            {collaborators.map(c => (
                                <div key={c.id} className="flex items-center gap-6 bg-black border border-white/5 p-6 rounded-[32px] hover:border-violet-500/20 transition-all shadow-2xl animate-in slide-in-from-left-4 duration-500 group">
                                    <div className="flex-1 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-[20px] bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500 font-black text-sm uppercase shadow-2xl group-hover:scale-110 transition-transform">
                                            {c.nickname[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white uppercase tracking-tight">{c.nickname}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <ShieldCheck size={10} className="text-emerald-500" />
                                                <span className="text-[9px] text-gray-600 uppercase font-black tracking-widest">Verified Author</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="relative group/field">
                                            <input
                                                type="number"
                                                value={c.split}
                                                onChange={(e) => updateCollaboratorSplit(c.id, e.target.value)}
                                                className="w-24 bg-black border border-white/10 rounded-2xl py-3 pl-4 pr-10 text-right text-sm text-violet-500 font-black focus:border-violet-500 transition-all shadow-inner"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 font-black text-[10px]">%</span>
                                        </div>
                                        <button
                                            onClick={() => removeCollaborator(c.id)}
                                            className="p-3 text-gray-800 hover:text-red-500 hover:bg-red-500/5 rounded-2xl transition-all border border-transparent hover:border-red-500/10 shadow-2xl"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contributor Search Engine */}
                    <div className="space-y-6">
                        <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] ml-4 block">Author Discovery</label>

                        <div className="relative group/search">
                            <div className="relative z-10">
                                <input
                                    type="text"
                                    placeholder="Buscar co-autor por @nickname..."
                                    value={search}
                                    onChange={(e) => searchUsers(e.target.value)}
                                    className="w-full bg-black border border-white/5 rounded-[32px] px-8 py-6 pl-14 text-sm text-white placeholder:text-gray-900 focus:outline-none focus:border-violet-500 transition-all font-black shadow-inner"
                                />
                                <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-800 group-focus-within/search:text-violet-500 transition-colors" />
                                {searching && (
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                        <div className="w-5 h-5 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            {results.length > 0 && (
                                <div className="absolute top-1/2 left-0 w-full pt-10 mt-0 bg-black border border-white/10 rounded-b-[40px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] z-0 animate-in slide-in-from-top-4 duration-500">
                                    <div className="pb-4">
                                        {results.map(r => (
                                            <button
                                                key={r.id}
                                                type="button"
                                                onClick={() => {
                                                    addCollaborator({ id: r.id, nickname: r.nickname, split: 0 });
                                                    setSearch('');
                                                    setResults([]);
                                                }}
                                                className="w-full flex items-center gap-4 py-5 px-8 hover:bg-white/[0.03] text-left border-b border-white/5 last:border-none transition-all group/item"
                                            >
                                                <div className="w-10 h-10 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-center text-xs font-black text-gray-500 group-hover/item:border-violet-500/30 group-hover/item:text-violet-500 transition-all">
                                                    {r.nickname[0]}
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-sm font-black text-white group-hover/item:text-violet-400 transition-colors">{r.nickname}</span>
                                                    <p className="text-[9px] text-gray-700 font-bold uppercase tracking-widest mt-0.5">Mapear Derechos</p>
                                                </div>
                                                <UserPlus size={18} className="text-gray-800 group-hover/item:text-violet-500 transition-colors" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-[32px] flex gap-4">
                            <Info size={20} className="text-emerald-500/40 shrink-0 mt-1" />
                            <p className="text-[10px] text-emerald-500/60 font-bold leading-relaxed uppercase tracking-widest">
                                Los splits de ganancias se distribuyen automáticamente. Asegúrate de que el total sume el 100% (incluyéndote a ti si corresponde según tu lógica de negocio).
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PriceInput({ title, description, value, onChange }) {
    return (
        <div className="bg-black p-8 rounded-[48px] border border-white/5 hover:border-violet-500/20 transition-all duration-700 flex flex-col gap-8 shadow-2xl relative overflow-hidden group">
            <div className={`absolute -right-10 -top-10 w-40 h-40 blur-[100px] transition-all duration-1000 bg-violet-500/5 opacity-0 group-hover:opacity-100`} />

            <div className="space-y-1 relative z-10">
                <h4 className="text-sm font-black text-white uppercase tracking-[0.2em]">{title}</h4>
                <p className="text-[10px] text-gray-700 uppercase font-black tracking-widest">{description}</p>
            </div>

            <div className="relative group/field z-10">
                <input
                    type="number"
                    placeholder="0.00"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-black border border-white/5 rounded-[32px] py-8 pl-14 pr-8 text-4xl font-black text-violet-500 outline-none focus:border-violet-500 transition-all shadow-inner placeholder:text-violet-900/20"
                />
                <DollarSign size={28} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-800 group-focus-within/field:text-violet-500 transition-colors" />
                <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-900 uppercase tracking-widest group-focus-within/field:text-violet-900 transition-colors">USD Currency</div>
            </div>
        </div>
    );
}
