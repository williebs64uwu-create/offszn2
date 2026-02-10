import React, { useState } from 'react';
import {
    FileText, Save, RotateCcw, Info,
    ArrowLeft, ShieldCheck, Tag, DollarSign,
    CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLicenseSettings, LICENSE_TIERS } from '../../../hooks/useLicenseSettings';
import LicensePreviewCard from '../../../components/dashboard/LicensePreviewCard';

const STREAM_OPTIONS = ['5000', '10000', '50000', '100000', '500000', '1000000', 'UNLIMITED'];
const SALES_OPTIONS = ['500', '2000', '5000', '10000', 'UNLIMITED'];
const RADIO_OPTIONS = ['No Permitido', '2 Estaciones', 'ILIMITADO'];

export default function LicenseManager() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('basic');
    const {
        settings, loading, saving,
        updateTier, resetTier, saveSettings
    } = useLicenseSettings();

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-violet-500" size={40} />
                <span className="text-xs font-black uppercase tracking-widest text-gray-500">Cargando Configuración...</span>
            </div>
        );
    }

    const currentTier = settings[activeTab];
    const isUnlimited = activeTab === 'unlimited';

    const handleReset = () => {
        if (window.confirm('¿Restablecer los valores por defecto para esta licencia?')) {
            resetTier(activeTab);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-10 space-y-8 animate-in fade-in duration-700">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest mb-4"
                    >
                        <ArrowLeft size={14} />
                        Volver al Dashboard
                    </button>
                    <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-4">
                        <ShieldCheck className="text-violet-500" size={32} />
                        Configuración de Licencias
                    </h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">
                        Define los términos de venta y derechos de uso para tus beats
                    </p>
                </div>

                <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-black uppercase tracking-widest text-xs hover:bg-violet-500 hover:text-white transition-all shadow-xl shadow-white/5 disabled:opacity-50 active:scale-95"
                >
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-[#0a0a0a] rounded-2xl border border-white/5 w-fit overflow-x-auto no-scrollbar">
                {LICENSE_TIERS.map(tier => (
                    <button
                        key={tier}
                        onClick={() => setActiveTab(tier)}
                        className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tier ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                    >
                        {tier.replace(/^\w/, c => c.toUpperCase())}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr,400px] gap-10">

                {/* Left: Form */}
                <div className="space-y-8">

                    {/* Status Toggle */}
                    <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${currentTier.enabled ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                            <span className="text-xs font-black uppercase tracking-widest">Estado de la Licencia</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={currentTier.enabled}
                                onChange={(e) => updateTier(activeTab, { enabled: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-white/5 border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500"></div>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* Name & Pricing */}
                        <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[40px] space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                                <Tag size={14} /> Identificación y Precio
                            </h3>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Nombre de Licencia</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full bg-black border border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:border-violet-500/50 outline-none transition-all"
                                            value={currentTier.name}
                                            onChange={(e) => updateTier(activeTab, { name: e.target.value })}
                                            maxLength={20}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-700 font-black">{currentTier.name.length}/20</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Precio sugerido (USD)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-500" size={16} />
                                        <input
                                            type="number"
                                            className="w-full bg-black border border-white/10 rounded-2xl p-4 pl-10 text-xs font-bold text-white focus:border-violet-500/50 outline-none transition-all"
                                            value={currentTier.price}
                                            onChange={(e) => updateTier(activeTab, { price: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Deliverables */}
                        <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[40px] space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                                <FileText size={14} /> Archivos Incluidos
                            </h3>

                            <div className="space-y-3">
                                <div className="p-4 bg-black border border-emerald-500/20 rounded-2xl flex items-center gap-3 opacity-50 cursor-not-allowed">
                                    <CheckCircle2 className="text-emerald-500" size={18} />
                                    <span className="text-xs font-black uppercase tracking-widest">Archivo MP3</span>
                                </div>
                                <div
                                    onClick={() => updateTier(activeTab, { files: { ...currentTier.files, wav: !currentTier.files.wav } })}
                                    className={`p-4 border rounded-2xl flex items-center gap-3 cursor-pointer transition-all ${currentTier.files.wav ? 'bg-black border-violet-500/50' : 'bg-black/40 border-white/5 text-gray-600'}`}
                                >
                                    {currentTier.files.wav ? <CheckCircle2 className="text-violet-500" size={18} /> : <div className="w-[18px] h-[18px] rounded-full border-2 border-white/10"></div>}
                                    <span className="text-xs font-black uppercase tracking-widest">Archivo WAV</span>
                                </div>
                                <div
                                    onClick={() => updateTier(activeTab, { files: { ...currentTier.files, stems: !currentTier.files.stems } })}
                                    className={`p-4 border rounded-2xl flex items-center gap-3 cursor-pointer transition-all ${currentTier.files.stems ? 'bg-black border-violet-500/50' : 'bg-black/40 border-white/5 text-gray-600'}`}
                                >
                                    {currentTier.files.stems ? <CheckCircle2 className="text-violet-500" size={18} /> : <div className="w-[18px] h-[18px] rounded-full border-2 border-white/10"></div>}
                                    <span className="text-xs font-black uppercase tracking-widest">Track Stems</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Usage Rights */}
                    <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[40px] space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                                <Info size={14} /> Límites de Uso Comercial
                            </h3>
                            {isUnlimited && (
                                <span className="text-[10px] font-black uppercase tracking-widest text-violet-500 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">Valores fijos para ilimitado</span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2 flex items-center gap-1">
                                    Streams Monetizados <AlertCircle size={10} className="text-gray-700" title="Límite acumulado en servicios de streaming" />
                                </label>
                                <select
                                    className="w-full bg-black border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-violet-500/50 transition-all appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                    value={currentTier.usage.streams}
                                    onChange={(e) => updateTier(activeTab, { usage: { ...currentTier.usage, streams: e.target.value } })}
                                    disabled={isUnlimited}
                                >
                                    {STREAM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt === 'UNLIMITED' ? 'ILIMITADO' : parseInt(opt).toLocaleString()}</option>)}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2 flex items-center gap-1">
                                    Ventas Digitales
                                </label>
                                <select
                                    className="w-full bg-black border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-violet-500/50 transition-all appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                    value={currentTier.usage.sales}
                                    onChange={(e) => updateTier(activeTab, { usage: { ...currentTier.usage, sales: e.target.value } })}
                                    disabled={isUnlimited}
                                >
                                    {SALES_OPTIONS.map(opt => <option key={opt} value={opt}>{opt === 'UNLIMITED' ? 'ILIMITADO' : parseInt(opt).toLocaleString()}</option>)}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2 flex items-center gap-1">
                                    Radio Broadcasting
                                </label>
                                <select
                                    className="w-full bg-black border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-violet-500/50 transition-all appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                    value={currentTier.usage.radio}
                                    onChange={(e) => updateTier(activeTab, { usage: { ...currentTier.usage, radio: e.target.value } })}
                                    disabled={isUnlimited}
                                >
                                    {RADIO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 text-gray-600 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest ml-4"
                    >
                        <RotateCcw size={14} />
                        Restablecer valores de fábrica
                    </button>

                </div>

                {/* Right: Preview */}
                <div className="flex flex-col items-center">
                    <div className="sticky top-10 space-y-6 w-full flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-700">Vista Previa Real-Time</span>
                        <LicensePreviewCard
                            name={currentTier.name}
                            price={currentTier.price}
                            usage={currentTier.usage}
                            files={currentTier.files}
                            isEnabled={currentTier.enabled}
                        />
                        <p className="text-[10px] text-gray-600 text-center font-bold uppercase leading-relaxed max-w-[280px]">
                            Esta es la información que verán tus clientes al momento de comprar tu beat.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
