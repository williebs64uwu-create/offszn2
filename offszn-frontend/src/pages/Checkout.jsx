import React, { useState, useEffect } from 'react';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../store/authStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';
import { BiLock, BiShoppingBag } from "react-icons/bi";
import { BsShieldCheck } from "react-icons/bs";


const Checkout = () => {
    const { items, getCartTotal, clearCart } = useCartStore();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [processing, setProcessing] = useState(false);

    // Calculate Fees (Frontend estimation for UI, backend recalculates)
    const calculateTotals = () => {
        let subtotal = 0;
        let serviceFee = 0;

        items.forEach(item => {
            const price = parseFloat(item.price) || 0;
            let commission = 0;
            if (price > 0) {
                commission = price < 20 ? 1.00 : price * 0.05;
            }
            subtotal += price;
            serviceFee += commission;
        });

        return {
            subtotal: subtotal.toFixed(2),
            serviceFee: serviceFee.toFixed(2),
            total: (subtotal + serviceFee).toFixed(2)
        };
    };

    const { subtotal, serviceFee, total } = calculateTotals();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (items.length === 0) {
            toast.error("Tu carrito está vacío");
            navigate('/explorar');
            return;
        }

        // If user just logged in/registered, sync their cart
        if (user) {
            useCartStore.getState().syncWithSupabase(user.id);
        }
    }, [items, navigate, user]);

    const handleLoginRedirect = () => {
        navigate(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    };

    if (items.length === 0) return null;

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8 border-b border-white/10 pb-4">
                Finalizar Compra
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT: Order Summary */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <BiShoppingBag /> Resumen del Pedido
                        </h3>

                        <div className="space-y-4">
                            {items.map((item) => (
                                <div key={`${item.id}-${item.licenseId}`} className="flex gap-4 p-4 bg-[#141414] rounded-xl border border-white/5">
                                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-black flex-shrink-0">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-white font-bold">{item.name}</h4>
                                        <p className="text-zinc-500 text-sm">{item.license_name || 'Licencia Standard'}</p>
                                        <p className="text-zinc-600 text-xs mt-1">Por: {item.producer}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-bold">${parseFloat(item.price).toFixed(2)}</p>
                                        <p className="text-xs text-zinc-500">+ fee</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Payment */}
                <div className="lg:col-span-1">
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 sticky top-24">
                        <h3 className="text-xl font-bold text-white mb-6">Detalles de Pago</h3>

                        {!user && (
                            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <p className="text-amber-200 text-sm mb-3">
                                    Estás comprando como invitado. Inicia sesión para guardar tus licencias en tu cuenta.
                                </p>
                                <button
                                    onClick={handleLoginRedirect}
                                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg text-sm transition-colors"
                                >
                                    Iniciar Sesión / Registrarse
                                </button>
                            </div>
                        )}

                        <div className="space-y-3 mb-6 pb-6 border-b border-white/10">
                            <div className="flex justify-between text-zinc-400">
                                <span>Subtotal</span>
                                <span>${subtotal}</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                                <span>Tarifa de Servicio</span>
                                <span>${serviceFee}</span>
                            </div>
                            <div className="flex justify-between text-white font-bold text-xl pt-2 border-t border-white/10 mt-2">
                                <span>Total</span>
                                <span>${total}</span>
                            </div>
                        </div>

                        <div className="mb-6 p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg text-violet-300 text-sm flex items-center gap-2">
                            <BsShieldCheck className="text-lg" />
                            Pagos procesados de forma segura.
                        </div>

                        {processing && (
                            <div className="text-center py-4 text-white animate-pulse">
                                Procesando pago...
                            </div>
                        )}

                        <div className="z-0 relative">
                            <PayPalScriptProvider options={{ "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID }}>
                                <PayPalButtons
                                    style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
                                    createOrder={async (data, actions) => {
                                        try {
                                            const response = await apiClient.post('/orders/paypal/create', {
                                                cartItems: items
                                            });
                                            return response.data.id;
                                        } catch (error) {
                                            toast.error("Error iniciando pago: " + (error.response?.data?.error || error.message));
                                            throw error;
                                        }
                                    }}
                                    onApprove={async (data, actions) => {
                                        setProcessing(true);
                                        try {
                                            const response = await apiClient.post('/orders/paypal/capture', {
                                                orderID: data.orderID,
                                                cartItems: items
                                            });

                                            // Success
                                            clearCart();
                                            toast.success("¡Pago completado!");
                                            navigate('/success?order=' + response.data.supabaseOrder?.id);
                                        } catch (error) {
                                            toast.error("Error confirmando pago");
                                            console.error(error);
                                        } finally {
                                            setProcessing(false);
                                        }
                                    }}
                                    onError={(err) => {
                                        toast.error("Error con PayPal");
                                        console.error(err);
                                    }}
                                />
                            </PayPalScriptProvider>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;