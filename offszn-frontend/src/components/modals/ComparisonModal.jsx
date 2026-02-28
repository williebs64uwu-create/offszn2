import React, { useEffect } from 'react';
import { X, CheckCircle2, XCircle } from 'lucide-react';

const ComparisonModal = ({ isOpen, onClose, licenses, onSelect }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    const enabledLicenses = licenses || [];

    return (
        <div
            className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300"
            onClick={handleBackdropClick}
        >
            <div className="relative w-[95%] max-w-[900px] max-h-[90vh] bg-[#0a0a0a] border border-white/10 rounded-[24px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center p-8 border-b border-white/5">
                    <h3 className="text-white text-2xl font-extrabold">Comparar Licencias</h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto overflow-x-auto flex-1 custom-scrollbar">
                    <div
                        className="grid gap-2 min-w-[600px]"
                        style={{
                            gridTemplateColumns: `1.5fr repeat(${enabledLicenses.length}, 1fr)`
                        }}
                    >
                        {/* Header Row */}
                        <div className="p-4 text-[#555] font-extrabold uppercase text-[0.75rem] tracking-wider">Beneficios</div>
                        {enabledLicenses.map(l => (
                            <div key={l.id} className="p-4 text-center text-white font-extrabold text-[0.85rem] uppercase">
                                {l.name}
                            </div>
                        ))}

                        {/* Price Row */}
                        <div className="p-4 border-t border-white/5 flex items-center text-[#888] font-bold text-sm">Precio</div>
                        {enabledLicenses.map(l => (
                            <div key={l.id} className="p-4 border-t border-white/5 text-center text-white font-black text-lg">
                                ${l.price.toFixed(2)}
                            </div>
                        ))}

                        {/* MP3 */}
                        <div className="p-4 border-t border-white/5 flex items-center text-[#888] font-bold text-sm">Archivo MP3</div>
                        {enabledLicenses.map(l => (
                            <div key={l.id} className="p-4 border-t border-white/5 flex justify-center items-center">
                                <CheckCircle2 size={18} className="text-violet-500" />
                            </div>
                        ))}

                        {/* WAV */}
                        <div className="p-4 border-t border-white/5 flex items-center text-[#888] font-bold text-sm">Archivo WAV</div>
                        {enabledLicenses.map(l => (
                            <div key={l.id} className="p-4 border-t border-white/5 flex justify-center items-center">
                                {l.id !== 'basic' ? (
                                    <CheckCircle2 size={18} className="text-violet-500" />
                                ) : (
                                    <XCircle size={18} className="text-white/10" />
                                )}
                            </div>
                        ))}

                        {/* STEMS */}
                        <div className="p-4 border-t border-white/5 flex items-center text-[#888] font-bold text-sm">Trackout (Stems)</div>
                        {enabledLicenses.map(l => (
                            <div key={l.id} className="p-4 border-t border-white/5 flex justify-center items-center">
                                {l.id === 'unlimited' ? (
                                    <CheckCircle2 size={18} className="text-violet-500" />
                                ) : (
                                    <XCircle size={18} className="text-white/10" />
                                )}
                            </div>
                        ))}

                        {/* STREAMS */}
                        <div className="p-4 border-t border-white/5 flex items-center text-[#888] font-bold text-sm">Streams</div>
                        {enabledLicenses.map(l => (
                            <div key={l.id} className="p-4 border-t border-white/5 text-center text-gray-400 font-bold text-xs uppercase">
                                {l.features?.[1] || 'Limitado'}
                            </div>
                        ))}

                        {/* SALES */}
                        <div className="p-4 border-t border-white/5 flex items-center text-[#888] font-bold text-sm">Ventas</div>
                        {enabledLicenses.map(l => (
                            <div key={l.id} className="p-4 border-t border-white/5 text-center text-gray-400 font-bold text-xs uppercase">
                                {l.features?.[2] || 'Limitado'}
                            </div>
                        ))}

                        {/* REVENTA */}
                        <div className="p-4 border-t border-white/5 flex items-center text-[#888] font-bold text-sm">PDF Oficial</div>
                        {enabledLicenses.map(l => (
                            <div key={l.id} className="p-4 border-t border-white/5 flex justify-center items-center">
                                <CheckCircle2 size={18} className="text-violet-500" />
                            </div>
                        ))}

                        {/* Select Buttons */}
                        <div className="p-4" />
                        {enabledLicenses.map(l => (
                            <div key={l.id} className="p-4 pt-6 text-center">
                                <button
                                    onClick={() => {
                                        onSelect(l.id);
                                        onClose();
                                    }}
                                    className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 active:bg-white/5 text-white font-bold text-xs rounded-lg border border-white/10 transition-all uppercase tracking-wider"
                                >
                                    Elegir
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComparisonModal;
