import React, { useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { calculateCartTotals } from '../utils/priceCalculator';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Tu cliente supabase

const Checkout = () => {
  const { cart, clearCart } = useCartStore();
  const { items, subtotal, serviceFee, total } = calculateCartTotals(cart);
  const [paymentMethod, setPaymentMethod] = useState('paypal'); // 'paypal', 'yape', 'plin'
  const navigate = useNavigate();

  // Configuración de PayPal
  const initialOptions = {
    "client-id": "ATPgFaKnGSf4hJZEN_lkw82QVO2sNc6O9d6QX7GcWBny9tqchRoXpZ89UxkUtD1U2ZWsbv9uAkwruu2B", // Tu Client ID público
    currency: "USD",
    intent: "capture",
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  // --- HANDLERS PAYPAL ---
  const createOrder = async (data, actions) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Llamada a TU backend para crear la orden segura
    const response = await fetch(`${API_URL}/orders/paypal/create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": session ? `Bearer ${session.access_token}` : ''
        },
        body: JSON.stringify({ cartItems: items }), // Enviamos items procesados
    });

    const order = await response.json();
    if (order.error) {
        alert("Error: " + order.error);
        throw new Error(order.error);
    }
    return order.id; // Retorna el Order ID de PayPal
  };

  const onApprove = async (data, actions) => {
    const { data: { session } } = await supabase.auth.getSession();

    // Capturar el pago en TU backend
    const response = await fetch(`${API_URL}/orders/paypal/capture`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": session ? `Bearer ${session.access_token}` : ''
        },
        body: JSON.stringify({ orderID: data.orderID })
    });

    const details = await response.json();
    
    if (details.error) {
        alert("Error capturando pago: " + details.error);
    } else {
        // ¡ÉXITO!
        clearCart();
        navigate(`/success?order=${details.supabaseOrder?.id || 'unknown'}`);
    }
  };

  if (cart.length === 0) {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold mb-4">Tu carrito está vacío</h2>
            <button onClick={() => navigate('/explore')} className="text-violet-400 hover:underline">Volver a explorar</button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20 px-4 md:px-8 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: RESUMEN ORDEN */}
        <div className="lg:col-span-2 space-y-6">
            <h1 className="text-3xl font-black mb-6">Finalizar Compra</h1>
            
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <i className="bi bi-bag-check"></i> Resumen del Pedido
                </h3>
                
                <div className="space-y-4">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                            <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-zinc-800"/>
                            <div className="flex-1">
                                <h4 className="font-bold text-white">{item.name}</h4>
                                <p className="text-xs text-zinc-500">{item.licenseName || 'Licencia Básica'}</p>
                                {item.blocked && (
                                    <p className="text-red-500 text-xs mt-1">
                                        <i className="bi bi-exclamation-triangle"></i> Productor no configuró pagos
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="font-bold">${item.price.toFixed(2)}</div>
                                <div className="text-xs text-zinc-500">+ ${item.commission.toFixed(2)} fee</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* TOTALES */}
                <div className="mt-6 pt-6 border-t border-white/10 space-y-2 text-sm">
                    <div className="flex justify-between text-zinc-400">
                        <span>Subtotal (Productores)</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                        <span>Tarifa de Servicio</span>
                        <span>${serviceFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-white text-xl font-black mt-4 pt-4 border-t border-dashed border-white/10">
                        <span>TOTAL</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* COLUMNA DERECHA: PAGO */}
        <div className="lg:col-span-1">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 sticky top-24">
                <h3 className="text-xl font-bold mb-6">Método de Pago</h3>

                {/* SELECCIÓN DE MÉTODO */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                    <button 
                        onClick={() => setPaymentMethod('paypal')}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'paypal' ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-black border-white/10 text-zinc-500 hover:border-white/30'}`}
                    >
                        <i className="bi bi-paypal text-xl"></i>
                        <span className="text-xs font-bold">PayPal</span>
                    </button>
                    <button 
                        onClick={() => setPaymentMethod('yape')}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'yape' ? 'bg-purple-600/10 border-purple-500 text-purple-400' : 'bg-black border-white/10 text-zinc-500 hover:border-white/30'}`}
                    >
                        <i className="bi bi-qr-code text-xl"></i>
                        <span className="text-xs font-bold">Yape</span>
                    </button>
                    <button 
                        onClick={() => setPaymentMethod('plin')}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'plin' ? 'bg-cyan-600/10 border-cyan-500 text-cyan-400' : 'bg-black border-white/10 text-zinc-500 hover:border-white/30'}`}
                    >
                        <i className="bi bi-phone text-xl"></i>
                        <span className="text-xs font-bold">Plin</span>
                    </button>
                </div>

                {/* AREA DE PAGO DINÁMICA */}
                <div className="mt-4">
                    {paymentMethod === 'paypal' && (
                        <PayPalScriptProvider options={initialOptions}>
                            <PayPalButtons 
                                style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }} 
                                createOrder={createOrder}
                                onApprove={onApprove}
                            />
                        </PayPalScriptProvider>
                    )}

                    {(paymentMethod === 'yape' || paymentMethod === 'plin') && (
                        <div className="text-center p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                            <div className="w-48 h-48 bg-white mx-auto rounded-lg mb-4 flex items-center justify-center">
                                {/* AQUÍ IRÍA EL QR REAL */}
                                <span className="text-black font-bold">QR DE PRUEBA</span>
                            </div>
                            <p className="text-sm text-zinc-400 mb-4">
                                Escanea el QR con {paymentMethod === 'yape' ? 'Yape' : 'Plin'} y envía el monto exacto de 
                                <strong className="text-white"> ${total.toFixed(2)}</strong>.
                            </p>
                            <button className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 rounded-lg">
                                Enviar Comprobante (WhatsApp)
                            </button>
                            <p className="text-xs text-zinc-600 mt-2">La integración automática llegará pronto.</p>
                        </div>
                    )}
                </div>
                
                <div className="mt-6 flex items-start gap-3 p-3 bg-violet-900/10 border border-violet-500/20 rounded-lg">
                    <i className="bi bi-shield-check text-violet-400 text-xl"></i>
                    <p className="text-xs text-zinc-400">
                        Pagos procesados de forma segura. Tus archivos estarán disponibles inmediatamente después del pago.
                    </p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;