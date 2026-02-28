import React, { useEffect, useRef } from 'react';
import { X, Gem, ShieldCheck } from 'lucide-react';

const ExclusivityModal = ({ isOpen, onClose, product }) => {
    const modalRef = useRef(null);

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

    const handleContact = () => {
        const producerNickname = product?.users?.nickname || 'Productor';
        const productType = product?.product_type || 'producto';
        const productLink = window.location.href;
        const message = `Vi tu ${productType} ("${product?.name}") ${productLink} estoy interesado en tener una versión exclusiva.`;

        // Using the same route as legacy for messages
        const targetUrl = `/mensajes?user=${producerNickname}&msg=${encodeURIComponent(message)}`;
        window.location.href = targetUrl;
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[10001] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="relative w-full max-w-[480px] bg-[#0a0a0a] border border-white/10 p-10 rounded-t-[32px] md:rounded-[24px] shadow-2xl animate-in slide-in-from-bottom duration-300"
            >
                {/* Pull bar for mobile */}
                <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8 md:hidden" />

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="text-center">
                    <div className="w-[70px] h-[70px] bg-violet-500/10 border border-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Gem size={32} className="text-violet-500" />
                    </div>

                    <div className="text-[0.85rem] text-violet-500 font-extrabold uppercase tracking-[2px] mb-3">
                        Licencia Exclusiva
                    </div>

                    <h2 className="text-white text-3xl font-extrabold mb-5 tracking-tight">
                        Sé el único dueño
                    </h2>

                    <p className="text-[#888] text-lg mb-9 leading-relaxed font-medium max-w-[320px] mx-auto">
                        Contacta directamente al productor para negociar la exclusividad total de este producto y retirarlo del catálogo.
                    </p>

                    <button
                        onClick={handleContact}
                        className="w-full h-14 bg-white hover:bg-gray-200 text-black font-extrabold text-lg rounded-xl transition-all shadow-xl active:scale-[0.98]"
                    >
                        CONTACTAR AL PRODUCTOR
                    </button>

                    <div className="mt-6 text-sm text-[#444] font-bold flex items-center justify-center gap-2">
                        <ShieldCheck size={18} />
                        TRANSACCIÓN SEGURA VÍA OFFSZN
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExclusivityModal;
