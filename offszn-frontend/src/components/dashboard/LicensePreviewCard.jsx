import React from 'react';
import {
    Music, ShoppingCart, Radio, FileAudio,
    CheckCircle2, XCircle, Globe, Headphones
} from 'lucide-react';

export default function LicensePreviewCard({
    name,
    price,
    usage = {},
    files = {},
    isEnabled = true
}) {
    const formatValue = (val) => {
        if (!val) return '0';
        if (val === 'UNLIMITED' || val === 'ILIMITADO') return '∞';
        const num = parseInt(val);
        if (isNaN(num)) return val;
        if (num >= 1000000) return (num / 1000000).toFixed(0) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
        return num.toLocaleString();
    };

    const fileList = [];
    fileList.push('MP3');
    if (files.wav) fileList.push('WAV');
    if (files.stems) fileList.push('STEMS');

    return (
        <div className={`relative w-full max-w-[400px] bg-[#0a0a0a] border ${isEnabled ? 'border-white/10' : 'border-red-500/20'} rounded-[32px] overflow-hidden shadow-2xl transition-all duration-500`}>

            {/* Disabled Overlay */}
            {!isEnabled && (
                <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="px-6 py-2 border-2 border-red-500/50 rounded-full text-red-500 font-black uppercase tracking-widest text-xs">
                        Licencia Desactivada
                    </div>
                </div>
            )}

            {/* Header / Price Section */}
            <div className={`p-8 text-center border-b border-white/5 ${!isEnabled && 'grayscale'}`}>
                <div className="inline-block px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4">
                    {name || 'Nueva Licencia'}
                </div>
                <div className="flex items-start justify-center gap-1">
                    <span className="text-2xl font-black text-violet-500 mt-2">$</span>
                    <span className="text-7xl font-black tracking-tighter text-white">
                        {parseFloat(price || 0).toFixed(0)}
                    </span>
                    <span className="text-2xl font-black text-white/20 mt-2">
                        .{(parseFloat(price || 0) % 1).toFixed(2).split('.')[1]}
                    </span>
                </div>
            </div>

            {/* Bento Grid Features */}
            <div className={`p-4 ${!isEnabled && 'grayscale'}`}>
                <div className="grid grid-cols-2 gap-1 bg-white/5 rounded-3xl overflow-hidden border border-white/5">

                    {/* Streams */}
                    <div className="bg-[#0f0f0f] p-6 flex flex-col items-center justify-center gap-2 group hover:bg-white/5 transition-colors">
                        <Headphones className="text-violet-400 group-hover:scale-110 transition-transform" size={24} />
                        <span className="text-xl font-black text-white">{formatValue(usage.streams)}</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Streams</span>
                    </div>

                    {/* Sales */}
                    <div className="bg-[#0f0f0f] p-6 flex flex-col items-center justify-center gap-2 group hover:bg-white/5 transition-colors">
                        <ShoppingCart className="text-emerald-400 group-hover:scale-110 transition-transform" size={24} />
                        <span className="text-xl font-black text-white">{formatValue(usage.sales)}</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ventas</span>
                    </div>

                    {/* Radio */}
                    <div className="bg-[#0f0f0f] p-6 flex flex-col items-center justify-center gap-2 group hover:bg-white/5 transition-colors">
                        <Radio className="text-blue-400 group-hover:scale-110 transition-transform" size={24} />
                        <span className="text-xl font-black text-white whitespace-nowrap overflow-hidden text-ellipsis w-full px-2">
                            {usage.radio === 'No Permitido' ? 'No' : usage.radio?.split(' ')[0] || 'Sí'}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Radio</span>
                    </div>

                    {/* Files */}
                    <div className="bg-[#0f0f0f] p-6 flex flex-col items-center justify-center gap-2 group hover:bg-white/5 transition-colors">
                        <FileAudio className="text-amber-400 group-hover:scale-110 transition-transform" size={24} />
                        <div className="flex flex-wrap justify-center gap-1 font-black text-[10px] text-white">
                            {fileList.join(' + ')}
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Archivos</span>
                    </div>

                </div>
            </div>

            {/* Footer rights info */}
            <div className={`px-8 py-6 flex items-center justify-center gap-3 bg-white/[0.02] ${!isEnabled && 'grayscale opacity-30'}`}>
                <Globe size={14} className="text-gray-600" />
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Derechos de Uso Mundial</span>
            </div>

        </div>
    );
}
