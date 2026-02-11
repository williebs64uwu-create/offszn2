import React, { useState, useEffect } from 'react';
import {
    ShoppingBag, Tag, CreditCard,
    ShieldCheck, ArrowLeft, Loader2,
    CheckCircle2, AlertCircle, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../store/authStore';
import { useCoupons } from '../hooks/useCoupons';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';

const COP_RATE = 4200;
const PEN_RATE = 3.8;

export default function Checkout() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { items, getTotal, clearCart } = useCartStore();
    const { validateCoupon } = useCoupons();

    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderStatus, setOrderStatus] = useState('pending'); // 'pending' | 'processing' | 'success'

    // Redirect if cart is empty and not in success state
    useEffect(() => {
        if (items.length === 0 && orderStatus !== 'success') {
            navigate('/explorar');
        }
    }, [items, navigate, orderStatus]);

    const totalUSD = getTotal();
    const discountAmount = appliedCoupon ? (
        appliedCoupon.type === 'percent'
            ? (totalUSD * (appliedCoupon.amount / 100))
            : appliedCoupon.amount
    ) : 0;

    const finalTotalUSD = Math.max(0, totalUSD - discountAmount);
    const finalTotalPEN = finalTotalUSD * PEN_RATE;
    const finalTotalCOP = finalTotalUSD * COP_RATE;

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsValidatingCoupon(true);
        const result = await validateCoupon(couponCode);
        setIsValidatingCoupon(false);

        if (result.valid) {
            setAppliedCoupon(result.coupon);
            toast.success("¡Cupón aplicado con éxito!");
        } else {
            toast.error(result.message);
        }
    };

    const handleCheckout = async () => {
        if (items.length === 0) return;
        setIsProcessing(true);

        // 1. Open blank window first to avoid popup blockers
        const paymentWindow = window.open('', '_blank');

        try {
            // 2. Create Mercado Pago Preference
            const { data } = await apiClient.post('/orders/create-mercadopago-preference', {
                cartItems: items
            });

            if (data?.url && paymentWindow) {
                // 3. Redirect the already-open window
                paymentWindow.location.href = data.url;
                setOrderStatus('processing');
                toast.loading("Procesando pago en la ventana emergente...", { id: 'checkout-status' });
            } else {
                if (paymentWindow) paymentWindow.close();
                throw new Error("No se pudo obtener el link de pago o la ventana fue bloqueada");
            }
        } catch (err) {
            console.error("Checkout Error:", err);
            if (paymentWindow) paymentWindow.close();
            toast.error(err.response?.data?.error || "Error al procesar el pago");
            setIsProcessing(false);
        }
    };

    // Polling for order completion status
    useEffect(() => {
        let interval;
        let attempts = 0;
        const maxAttempts = 60; // 3 minutes total (3s * 60)

        if (orderStatus === 'processing') {
            interval = setInterval(async () => {
                attempts++;

                if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    setIsProcessing(false);
                    setOrderStatus('pending');
                    toast.error("El tiempo de espera ha expirado. Si completaste el pago, revisa tu biblioteca en unos minutos.", { id: 'checkout-status' });
                    return;
                }

                try {
                    const { data } = await apiClient.get('/orders/status/latest');
                    if (data.status === 'completed') {
                        setOrderStatus('success');
                        await clearCart(user?.id);
                        clearInterval(interval);
                        toast.success("¡Pago confirmado!", { id: 'checkout-status' });
                    }
                } catch (e) {
                    console.error("Polling error:", e);
                }
            }, 3000);
        }

        return () => clearInterval(interval);
    }, [orderStatus, user, clearCart]);

    // Handle back from Mercado Pago
    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const status = query.get('status');

        if (status === 'approved' || query.get('payment_id')) {
            setOrderStatus('processing');
            toast.loading("Confirmando pago...", { id: 'checkout-status' });
        }
    }, []);

    if (orderStatus === 'success') {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in duration-1000">
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/20 animate-bounce">
                    <CheckCircle2 size={48} className="text-white" />
                </div>
                <div className="space-y-4">
                    <h1 className="text-5xl font-black uppercase tracking-tighter">¡Gracias por tu compra!</h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-sm max-w-md mx-auto">
                        Tus archivos de audio y licencias ya están disponibles en tu biblioteca personal.
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/biblioteca')}
                        className="px-8 py-4 bg-white text-black rounded-full font-black uppercase tracking-widest text-xs hover:bg-violet-500 hover:text-white transition-all shadow-xl"
                    >
                        Ver Mis Compras
                    </button>
                    <button
                        onClick={() => navigate('/explorar')}
                        className="px-8 py-4 border border-white/10 rounded-full font-black uppercase tracking-widest text-xs hover:bg-white/5 transition-all"
                    >
                        Seguir Explorando
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 lg:p-20 font-sans">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">

                {/* Left Col: Order Info */}
                <div className="lg:col-span-7 space-y-12 animate-in slide-in-from-left duration-700">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Volver
                    </button>

                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">Finalizar <span className="text-violet-500">Compra</span></h1>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Revisa tus ítems y aplica descuentos antes de pagar.</p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 border-b border-white/5 pb-4">Tu Selección</h3>
                        {items.map((item, idx) => (
                            <div key={`${item.productId}-${idx}`} className="flex gap-6 p-4 bg-white/5 rounded-3xl border border-white/5 group hover:border-white/10 transition-all">
                                <div className="w-20 h-20 rounded-2xl bg-black overflow-hidden border border-white/5 flex-shrink-0">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                </div>
                                <div className="flex-1 flex flex-col justify-center gap-1">
                                    <h4 className="text-sm font-black uppercase tracking-tight">{item.name}</h4>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.producer}</p>
                                    {item.licenseId && (
                                        <div className="mt-2 text-[8px] font-black px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-lg uppercase inline-block w-fit">
                                            {item.licenseId} License
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col justify-center items-end">
                                    <span className="text-lg font-black tracking-tighter">${item.price}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Col: Summary & Payment */}
                <div className="lg:col-span-5 space-y-8 animate-in slide-in-from-right duration-700">
                    <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-10 space-y-10 sticky top-32">

                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Resumen de Orden</h3>

                            {/* Coupon Input */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="CÓDIGO DE DESCUENTO"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-[10px] font-black uppercase tracking-widest placeholder:text-gray-700 focus:border-violet-500 focus:outline-none transition-all pr-32"
                                />
                                <button
                                    onClick={handleApplyCoupon}
                                    disabled={isValidatingCoupon || !couponCode}
                                    className="absolute right-2 top-2 bottom-2 px-6 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-violet-500 hover:text-white transition-all disabled:opacity-20"
                                >
                                    {isValidatingCoupon ? <Loader2 size={12} className="animate-spin" /> : 'Aplicar'}
                                </button>
                            </div>

                            {/* Summary Rows */}
                            <div className="space-y-4 pt-4">
                                <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    <span>Subtotal</span>
                                    <span className="text-white">${totalUSD.toFixed(2)}</span>
                                </div>
                                {appliedCoupon && (
                                    <div className="flex justify-between items-center text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-in slide-in-from-top-2">
                                        <div className="flex items-center gap-2">
                                            <Tag size={12} />
                                            <span>Cupón: {appliedCoupon.code} ({appliedCoupon.amount}{appliedCoupon.type === 'percent' ? '%' : ' USD'})</span>
                                        </div>
                                        <span>-${discountAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="h-px bg-white/5" />
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Estimado</span>
                                        <div className="flex gap-4 opacity-50">
                                            <span className="text-[10px] font-black uppercase tracking-widest">S/ {finalTotalPEN.toFixed(2)}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">$COP {finalTotalCOP.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <span className="text-4xl font-black tracking-tighter text-white">${finalTotalUSD.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Button */}
                        <div className="space-y-4">
                            <button
                                onClick={handleCheckout}
                                disabled={isProcessing}
                                className="w-full py-6 bg-white text-black rounded-[24px] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 hover:bg-violet-500 hover:text-white transition-all shadow-2xl shadow-white/5 active:scale-95 disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <CreditCard size={20} />
                                        Pagar con Mercado Pago
                                    </>
                                )}
                            </button>

                            <div className="flex items-center justify-center gap-2 text-amber-500 bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl">
                                <AlertCircle size={16} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-center">
                                    Tus productos se activarán al instante tras el pago
                                </span>
                            </div>
                        </div>

                        {/* Trust Footer */}
                        <div className="flex flex-col items-center gap-4 text-gray-500 border-t border-white/5 pt-8">
                            <div className="flex gap-8 grayscale opacity-50">
                                <img src="https://logodownload.org/wp-content/uploads/2015/05/mercado-pago-logo-1.png" className="h-4 object-contain" alt="Mercado Pago" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4 object-contain" alt="PayPal" />
                            </div>
                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
                                <ShieldCheck size={14} className="text-emerald-500" />
                                Transacción Encriptada (AES-256)
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Ambient Background Glows */}
            <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-violet-600/10 blur-[150px] -z-10 animate-pulse" />
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-fuchsia-600/10 blur-[150px] -z-10" />
        </div>
    );
}