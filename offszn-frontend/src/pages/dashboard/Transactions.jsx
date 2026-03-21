import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import toast from 'react-hot-toast';
import {
    BiDollarCircle, BiHistory, BiCheck, BiX, BiLinkExternal,
    BiCalendar, BiUser
} from 'react-icons/bi';
import { FaPaypal } from 'react-icons/fa';

function timeAgo(dateStr) {
    return new Date(dateStr).toLocaleDateString('es-PE', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

function TransactionSkeleton() {
    return (
        <div className="flex items-center gap-4 p-5 bg-white/[0.02] border border-white/[0.05] rounded-xl animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-white/[0.05] shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-white/[0.05] rounded w-2/5" />
                <div className="h-3 bg-white/[0.05] rounded w-1/4" />
            </div>
            <div className="h-4 bg-white/[0.05] rounded w-16" />
            <div className="h-6 bg-white/[0.05] rounded-full w-20 hidden md:block" />
        </div>
    );
}

function StatusBadge({ status }) {
    const map = {
        completed: { label: 'Completado', cls: 'bg-green-500/10 text-green-400' },
        approved: { label: 'Aprobado', cls: 'bg-green-500/10 text-green-400' },
        pending: { label: 'Pendiente', cls: 'bg-yellow-500/10 text-yellow-400' },
        failed: { label: 'Fallido', cls: 'bg-red-500/10 text-red-400' },
        refunded: { label: 'Reembolsado', cls: 'bg-blue-500/10 text-blue-400' },
    };
    const s = map[status?.toLowerCase()] || { label: status || 'N/A', cls: 'bg-white/5 text-white/50' };
    return (
        <span className={`text-[0.75rem] px-3 py-1 rounded-full font-semibold ${s.cls}`}>
            {s.label}
        </span>
    );
}

function TransactionRow({ tx }) {
    const productName = tx.product_name || tx.products?.name || 'Producto';
    const buyerName = tx.buyer_name || tx.buyer_nickname || tx.buyer_email || '—';
    const amount = tx.amount_usd || tx.total_amount || 0;

    return (
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-5 p-5 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:bg-white/[0.04] hover:border-purple-500/20 hover:-translate-y-0.5 transition-all">
            {/* Customer */}
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 text-white/40 text-sm">
                    <BiUser />
                </div>
                <div>
                    <p className="text-[0.9rem] text-[#eee] font-semibold truncate">{productName}</p>
                    <p className="text-[0.75rem] text-[#666]">{buyerName}</p>
                </div>
            </div>

            {/* Amount */}
            <div className="font-bold text-white text-right">${Number(amount).toFixed(2)}</div>

            {/* Status */}
            <div><StatusBadge status={tx.status} /></div>

            {/* Date */}
            <div className="text-[0.8rem] text-[#888] hidden md:flex items-center gap-1">
                <BiCalendar /> {timeAgo(tx.created_at)}
            </div>
        </div>
    );
}

export default function Transactions() {
    const [loading, setLoading] = useState(true);
    const [paypal, setPaypal] = useState({ connected: false, email: '' });
    const [transactions, setTransactions] = useState([]);
    const [paypalInput, setPaypalInput] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [savingPaypal, setSavingPaypal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [meRes, txRes] = await Promise.allSettled([
                apiClient.get('/auth/me'),
                apiClient.get('/order/sales'),
            ]);

            if (meRes.status === 'fulfilled') {
                const user = meRes.value.data;
                setPaypal({
                    connected: !!user.paypal_email,
                    email: user.paypal_email || '',
                });
                setPaypalInput(user.paypal_email || '');
            }

            if (txRes.status === 'fulfilled') {
                setTransactions(Array.isArray(txRes.value.data) ? txRes.value.data : []);
            }
        } catch (err) {
            console.error('Error cargando transacciones:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePaypal = async () => {
        if (!paypalInput.trim() || !paypalInput.includes('@')) {
            toast.error('Introduce un correo válido');
            return;
        }
        setSavingPaypal(true);
        try {
            await apiClient.patch('/auth/profile', { paypal_email: paypalInput.trim() });
            setPaypal({ connected: true, email: paypalInput.trim() });
            setShowModal(false);
            toast.success('PayPal conectado correctamente');
        } catch {
            toast.error('Error al guardar el correo de PayPal');
        } finally {
            setSavingPaypal(false);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#888] font-[Plus_Jakarta_Sans]">
                    Transacciones y Cobros
                </h1>
                <p className="text-sm text-[#666] mt-1">Gestiona tus métodos de cobro y revisa tu historial de ventas.</p>
            </div>

            {/* --- PayPal Config --- */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 mb-8">
                <h2 className="flex items-center gap-2 font-bold text-white text-base mb-1">
                    <FaPaypal className="text-[#0070BA]" /> Configuración de Cobros
                </h2>
                <p className="text-sm text-[#888] mb-6">
                    Configura tu correo de PayPal para recibir el dinero de tus ventas automáticamente.
                </p>

                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Status */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#003087] rounded-xl flex items-center justify-center text-2xl text-white">
                            <FaPaypal />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">PayPal</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`w-2 h-2 rounded-full ${paypal.connected ? 'bg-green-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'}`} />
                                <span className="text-xs font-semibold text-[#999]">
                                    {loading ? '...' : paypal.connected ? 'Conectado' : 'Sin conectar'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="flex-1 min-w-[180px]">
                        <p className="text-xs text-[#666] mb-1">Correo Vinculado:</p>
                        <p className="text-sm font-semibold text-white">
                            {loading ? '...' : paypal.email || <span className="text-[#444]">No configurado</span>}
                        </p>
                    </div>

                    {/* Button */}
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-5 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all text-sm"
                    >
                        {paypal.connected ? 'Actualizar PayPal' : 'Conectar PayPal'}
                    </button>
                </div>

                {/* Info note */}
                <div className="mt-5 p-3 bg-purple-500/[0.05] border border-purple-500/10 rounded-xl">
                    <p className="text-xs text-purple-400 leading-relaxed">
                        <BiLinkExternal className="inline mr-1" />
                        Asegúrate de que tu correo de PayPal esté verificado para evitar retrasos en tus cobros.
                    </p>
                </div>
            </div>

            {/* --- Sales History --- */}
            <div>
                <h2 className="flex items-center gap-2 font-bold text-white text-base mb-4">
                    <BiHistory /> Historial de Ventas
                </h2>

                {loading ? (
                    <div className="flex flex-col gap-3">
                        {[...Array(5)].map((_, i) => <TransactionSkeleton key={i} />)}
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-white/[0.08] rounded-2xl bg-white/[0.01]">
                        <BiDollarCircle className="text-5xl text-white/10 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-white mb-1">Sin ventas aún</h3>
                        <p className="text-sm text-[#555]">Las transacciones de tus ventas aparecerán aquí.</p>
                    </div>
                ) : (
                    <>
                        {/* Table header */}
                        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr] gap-5 px-5 pb-2 text-xs font-bold uppercase text-[#555] tracking-wider">
                            <span>Producto / Comprador</span>
                            <span className="text-right">Monto</span>
                            <span>Estado</span>
                            <span>Fecha</span>
                        </div>
                        <div className="flex flex-col gap-3">
                            {transactions.map((tx, i) => <TransactionRow key={tx.id || i} tx={tx} />)}
                        </div>
                    </>
                )}
            </div>

            {/* --- PayPal Modal --- */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50 p-4">
                    <div className="bg-[#121214] border border-white/10 rounded-2xl w-full max-w-sm p-7 shadow-2xl">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-bold text-white">Conectar PayPal</h3>
                            <button onClick={() => setShowModal(false)} className="text-[#666] hover:text-white text-2xl leading-none">
                                <BiX />
                            </button>
                        </div>
                        <p className="text-sm text-[#888] mb-4">
                            Ingresa el correo asociado a tu cuenta de PayPal para recibir pagos.
                        </p>
                        <input
                            type="email"
                            placeholder="tu@paypal.com"
                            value={paypalInput}
                            onChange={e => setPaypalInput(e.target.value)}
                            className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-purple-500/50 transition-colors"
                        />
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm text-white border border-white/10 rounded-full hover:bg-white/[0.05] transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSavePaypal}
                                disabled={savingPaypal}
                                className="px-5 py-2 text-sm font-bold bg-purple-600 text-white rounded-full hover:bg-purple-500 transition-colors disabled:opacity-50"
                            >
                                {savingPaypal ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
