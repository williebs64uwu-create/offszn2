import React, { useEffect } from 'react';
import {
    X, ShoppingCart, Trash2,
    Lock, ShieldCheck, CreditCard,
    ArrowRight, ShoppingBag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useAuth } from '../..//store/authStore';

const COP_RATE = 4200;
const PEN_RATE = 3.8;

export default function CartPanel({ isOpen, onClose }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { items, removeItem, getTotal, syncWithSupabase, loading } = useCartStore();

    useEffect(() => {
        if (user) {
            syncWithSupabase(user.id);
        }
    }, [user, syncWithSupabase]);

    if (!isOpen) return null;

    const totalUSD = getTotal();
    const totalPEN = totalUSD * PEN_RATE;
    const totalCOP = totalUSD * COP_RATE;

    const handleCheckout = () => {
        onClose();
        navigate('/checkout');
    };

    return (
        <div className="fixed inset-0 z-[9999] flex justify-end">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md bg-[#0a0a0a] border-l border-white/5 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-500/10 rounded-xl text-violet-500">
                            <ShoppingCart size={20} />
                        </div>
                        <h2 className="text-lg font-black uppercase tracking-tighter">Tu Carrito</h2>
                        <span className="px-2 py-0.5 bg-white/5 rounded-full text-[10px] font-black text-gray-500 uppercase">
                            {items.length} {items.length === 1 ? 'Ítem' : 'Ítems'}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30 px-10">
                            <ShoppingBag size={64} className="text-gray-600 mb-2" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-white">Carrito Vacío</h3>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Parece que aún no has añadido ninguna joya a tu colección.</p>
                            <button
                                onClick={() => { onClose(); navigate('/explorar'); }}
                                className="mt-4 px-6 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                            >
                                Explorar Tienda
                            </button>
                        </div>
                    ) : (
                        items.map((item, idx) => (
                            <div key={`${item.productId}-${item.licenseId}-${idx}`} className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex gap-4 hover:border-white/10 transition-all">
                                <div className="w-16 h-16 rounded-xl bg-white/5 overflow-hidden border border-white/5 flex-shrink-0">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <h4 className="text-[11px] font-black uppercase tracking-tight text-white truncate">{item.name}</h4>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{item.producer}</p>
                                    <div className="mt-1 flex items-center gap-2">
                                        {item.licenseId && (
                                            <span className="text-[8px] font-black px-1.5 py-0.5 bg-violet-500/10 text-violet-400 rounded-md uppercase">
                                                {item.licenseId}
                                            </span>
                                        )}
                                        <span className="text-[11px] font-black text-white">${item.price}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeItem(item.productId, item.licenseId, user?.id)}
                                    className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all self-center"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer summary */}
                <div className="p-8 bg-white/[0.03] border-t border-white/5 space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                            <span>Subtotal (USD)</span>
                            <span className="text-white text-base tracking-normal">${totalUSD.toFixed(2)}</span>
                        </div>

                        {/* Currency Conversions */}
                        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/5">
                            <div className="space-y-1">
                                <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Soles (PEN)</span>
                                <div className="text-[11px] font-black text-gray-400">S/ {totalPEN.toFixed(2)}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Pesos (COP)</span>
                                <div className="text-[11px] font-black text-gray-400">$COP {totalCOP.toLocaleString()}</div>
                            </div>
                        </div>

                        <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest leading-relaxed">
                            * Los pagos se procesan en COP al cambio del día. Las licencias se entregan instantáneamente tras el pago.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <button
                            disabled={items.length === 0}
                            onClick={handleCheckout}
                            className="w-full py-5 bg-white text-black rounded-full font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-2 hover:bg-violet-500 hover:text-white transition-all shadow-2xl shadow-white/5 disabled:opacity-20 active:scale-95 group"
                        >
                            <Lock size={16} className="group-hover:rotate-12 transition-transform" />
                            Pagar Seguro
                            <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <div className="flex items-center justify-center gap-6 opacity-30">
                            <div className="flex items-center gap-1">
                                <ShieldCheck size={14} />
                                <span className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap">SSL Secure</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <CreditCard size={14} />
                                <span className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap">PayPal / MP</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
