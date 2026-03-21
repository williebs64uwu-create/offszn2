import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../../api/client';
import toast from 'react-hot-toast';
import { BiSliderAlt, BiInfoCircle, BiSave, BiCheck } from 'react-icons/bi';

// --- Upload Defaults Section ---
function UploadDefaultsSection({ preference, onChange }) {
    const options = [
        {
            value: 'admin_defaults',
            label: 'Usar mis Precios Predeterminados',
            desc: 'Tus beats nuevos siempre iniciarán con los precios que configuraste en el Administrador de Licencias.',
            recommended: true,
        },
        {
            value: 'last_used',
            label: 'Usar configuración del último Beat',
            desc: 'Copia automáticamente los precios y licencias activas del último beat que subiste.',
            recommended: false,
        },
    ];

    return (
        <div className="space-y-3">
            {options.map(opt => (
                <label
                    key={opt.value}
                    className={`flex items-start gap-5 p-6 rounded-2xl border cursor-pointer transition-all duration-200
            ${preference === opt.value
                            ? 'bg-purple-500/[0.06] border-purple-500/40'
                            : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
                        }`}
                >
                    <div className="mt-0.5 shrink-0">
                        <input
                            type="radio"
                            name="uploadDefaults"
                            value={opt.value}
                            checked={preference === opt.value}
                            onChange={() => onChange(opt.value)}
                            className="accent-purple-500 scale-150 cursor-pointer"
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-[1.03rem]">{opt.label}</span>
                            {opt.recommended && (
                                <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full font-bold uppercase tracking-wide">
                                    Recomendado
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-[#888] mt-1 leading-relaxed">{opt.desc}</p>
                    </div>
                </label>
            ))}
        </div>
    );
}

// --- Promo System Section ---
const PROMO_PRESETS = [
    { label: 'Ninguna', value: 'none' },
    { label: '2x1', value: '2,1' },
    { label: '3x1', value: '3,1' },
    { label: 'Personalizado', value: 'custom' },
];

function PromoSection({ promo, onPromoChange }) {
    const [buyQty, setBuyQty] = useState(2);
    const [getQty, setGetQty] = useState(1);

    const selectedPreset = PROMO_PRESETS.find(p => p.value === promo) ? promo : 'custom';

    const handlePreset = (val) => {
        onPromoChange(val);
        if (val === '2,1') { setBuyQty(2); setGetQty(1); }
        if (val === '3,1') { setBuyQty(3); setGetQty(1); }
    };

    const handleCustomChange = () => {
        onPromoChange(`${buyQty},${getQty}`);
    };

    const promoLabel = promo === 'none'
        ? 'Promoción Desactivada'
        : `${promo.split(',')[0]}x${promo.split(',')[1] || 1} activado — por cada ${promo.split(',')[0]} productos pagados, el cliente se lleva ${promo.split(',')[1] || 1} gratis.`;

    return (
        <div>
            {/* Tabs */}
            <div className="flex gap-3 flex-wrap mb-6">
                {PROMO_PRESETS.map(p => (
                    <button
                        key={p.value}
                        onClick={() => handlePreset(p.value)}
                        className={`flex-1 min-w-[80px] py-3 px-4 rounded-xl border text-sm font-semibold transition-all
              ${promo === p.value || (p.value === 'custom' && !PROMO_PRESETS.find(x => x.value === promo && x.value !== 'custom'))
                                ? 'bg-white text-black border-white'
                                : 'bg-white/[0.03] border-white/10 text-[#888] hover:border-white/20 hover:text-[#ddd]'
                            }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Custom Controls */}
            {(promo === 'custom' || (!PROMO_PRESETS.map(p => p.value).includes(promo) && promo !== 'none')) && (
                <div className="grid grid-cols-2 gap-5 p-6 bg-white/[0.02] border border-white/10 rounded-2xl mb-6">
                    {[
                        { id: 'buy', label: 'Pagan por (cantidad)', val: buyQty, set: setBuyQty },
                        { id: 'get', label: 'Se llevan Gratis', val: getQty, set: setGetQty },
                    ].map(({ id, label, val, set }) => (
                        <div key={id}>
                            <p className="text-xs text-[#aaa] mb-2">{label}</p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => { set(v => Math.max(1, v - 1)); handleCustomChange(); }}
                                    className="w-11 h-11 rounded-xl border border-white/15 bg-transparent text-white text-lg hover:bg-white/[0.05] transition-colors flex items-center justify-center"
                                >−</button>
                                <input
                                    readOnly
                                    value={val}
                                    className="flex-1 h-11 text-center bg-black/40 border border-white/[0.08] rounded-xl text-white font-bold text-lg outline-none"
                                />
                                <button
                                    onClick={() => { set(v => Math.min(20, v + 1)); handleCustomChange(); }}
                                    className="w-11 h-11 rounded-xl border border-white/15 bg-transparent text-white text-lg hover:bg-white/[0.05] transition-colors flex items-center justify-center"
                                >+</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary */}
            <div className="text-center py-3 text-sm font-semibold text-[#999]">
                {promo === 'none'
                    ? <span className="text-[#555]">Promoción Desactivada</span>
                    : <span className="text-white">🎉 {promoLabel}</span>
                }
            </div>
        </div>
    );
}

// --- Main Page ---
export default function Preferences() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadPref, setUploadPref] = useState('admin_defaults');
    const [promo, setPromo] = useState('none');

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const { data } = await apiClient.get('/auth/me');
            setUploadPref(data?.upload_default_preference || 'admin_defaults');
            setPromo(data?.promo_config || 'none');
        } catch {
            // Use defaults if fetch fails
        } finally {
            setLoading(false);
        }
    };

    const handleSave = useCallback(async () => {
        if (saving) return;
        setSaving(true);
        try {
            await apiClient.patch('/auth/profile', {
                upload_default_preference: uploadPref,
                promo_config: promo,
            });
            toast.success('Preferencias guardadas');
        } catch {
            toast.error('Error al guardar preferencias');
        } finally {
            setSaving(false);
        }
    }, [saving, uploadPref, promo]);

    if (loading) {
        return (
            <div className="w-full max-w-2xl mx-auto space-y-6">
                {[1, 2].map(i => (
                    <div key={i} className="h-40 bg-white/[0.02] rounded-2xl border border-white/[0.05] animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#888] font-[Plus_Jakarta_Sans]">
                        Preferencias
                    </h1>
                    <p className="text-sm text-[#666] mt-1">Personaliza cómo funciona tu cuenta.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all text-sm disabled:opacity-50"
                >
                    {saving ? <><BiCheck /> Guardando...</> : <><BiSave /> Guardar</>}
                </button>
            </div>

            {/* Section 1: Upload Defaults */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-white font-bold text-base">Valores Predeterminados (Beats)</h2>
                </div>
                <UploadDefaultsSection preference={uploadPref} onChange={setUploadPref} />
            </div>

            {/* Divider */}
            <div className="border-t border-white/[0.06] my-8" />

            {/* Section 2: Promo */}
            <div className="mb-8">
                <h2 className="text-white font-bold text-base mb-1">Ofertas y Promociones (Beats)</h2>
                <p className="text-sm text-[#666] mb-5">
                    Activa una oferta global que aplique a todo tu catálogo de beats. Útil para incentivar ventas.
                </p>
                <PromoSection promo={promo} onPromoChange={setPromo} />
            </div>

            {/* Info Note */}
            <div className="flex gap-3 p-4 bg-blue-500/[0.05] border border-blue-500/20 rounded-xl">
                <BiInfoCircle className="text-blue-400 text-lg shrink-0 mt-0.5" />
                <p className="text-sm text-blue-300/80 leading-relaxed">
                    Los cambios de preferencias se aplican a todos tus beats nuevos. Los ya publicados no se ven afectados automáticamente.
                </p>
            </div>
        </div>
    );
}
