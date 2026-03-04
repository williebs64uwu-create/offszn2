import React, { useState, useEffect } from 'react';
import {
    Users, Send, Inbox, ShieldCheck,
    XCircle, CheckCircle2, MoreVertical,
    ArrowLeft, Plus, BarChart3, Info,
    Loader2, Sparkles, ChevronRight,
    Zap, ExternalLink, DollarSign, MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../api/client';

const TABS = [
    { id: 'pending', label: 'Pendientes', icon: Inbox },
    { id: 'accepted', label: 'Aceptadas', icon: CheckCircle2 },
    { id: 'rejected', label: 'Rechazadas', icon: XCircle }
];

const VIEW_TYPES = [
    { id: 'producer', label: 'Recibidas', icon: Inbox },
    { id: 'buyer', label: 'Enviadas', icon: Send }
];

export default function Negotiations() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('pending');
    const [viewType, setViewType] = useState('producer'); // 'producer' or 'buyer'
    const [negotiations, setNegotiations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [responding, setResponding] = useState(null);
    const [responseMessage, setResponseMessage] = useState('');

    useEffect(() => {
        fetchNegotiations();
    }, [viewType]);

    const fetchNegotiations = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/negotiations?type=${viewType}`);
            setNegotiations(response.data);
        } catch (error) {
            console.error('Error fetching negotiations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (id, status) => {
        try {
            setResponding(id);
            await apiClient.put(`/negotiations/${id}`, {
                status,
                response_message: responseMessage
            });
            await fetchNegotiations();
            setResponseMessage('');
        } catch (error) {
            console.error('Error responding to negotiation:', error);
        } finally {
            setResponding(null);
        }
    };

    const currentList = negotiations.filter(n => n.status === activeTab);

    const getProductLink = (negotiation) => {
        const type = negotiation.product?.product_type || 'beat';
        const slug = negotiation.product?.public_slug || negotiation.product?.id;
        return `/${type}/${slug}`;
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'accepted': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'counter': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
                <div className="relative">
                    <div className="w-16 h-16 border-t-2 border-violet-500 rounded-full animate-spin"></div>
                    <DollarSign className="absolute inset-0 m-auto text-violet-500 animate-pulse" size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 animate-pulse">Cargando Negociaciones...</span>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1500px] mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">

            {/* --- HERO HEADER --- */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
                <div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft size={18} />
                        <span className="text-sm font-medium">Volver al Dashboard</span>
                    </button>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <DollarSign className="text-white" size={28} />
                        </div>
                        Negociaciones
                    </h1>
                    <p className="text-gray-400 mt-3 text-lg font-medium">
                        {viewType === 'producer'
                            ? 'Gestiona las ofertas que has recibido de compradores interesados en tus beats.'
                            : 'Mira el estado de las ofertas que has enviado a otros productores.'
                        }
                    </p>
                </div>

                {/* View Switcher */}
                <div className="flex bg-[#111] border border-[#222] p-1 rounded-2xl">
                    {VIEW_TYPES.map(vt => (
                        <button
                            key={vt.id}
                            onClick={() => setViewType(vt.id)}
                            className={`
                                flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all
                                ${viewType === vt.id
                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                    : 'text-gray-500 hover:text-gray-300'}
                            `}
                        >
                            <vt.icon size={16} />
                            {vt.label}
                        </button>
                    ))}
                </div>

                {/* Stats Cards */}
                <div className="flex gap-4">
                    <div className="bg-[#111] border border-[#222] rounded-2xl p-4 min-w-[140px]">
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Pendientes</div>
                        <div className="text-2xl font-black text-yellow-400">
                            {negotiations.filter(n => n.status === 'pending').length}
                        </div>
                    </div>
                    <div className="bg-[#111] border border-[#222] rounded-2xl p-4 min-w-[140px]">
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Aceptadas</div>
                        <div className="text-2xl font-black text-green-400">
                            {negotiations.filter(n => n.status === 'accepted').length}
                        </div>
                    </div>
                    <div className="bg-[#111] border border-[#222] rounded-2xl p-4 min-w-[140px]">
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total</div>
                        <div className="text-2xl font-black text-white">
                            {negotiations.length}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- TABS --- */}
            <div className="flex gap-2 border-b border-[#222] pb-px overflow-x-auto">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const count = negotiations.filter(n => n.status === tab.id).length;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-5 py-3 text-sm font-bold uppercase tracking-wider transition-all relative
                                ${activeTab === tab.id
                                    ? 'text-white'
                                    : 'text-gray-500 hover:text-gray-300'
                                }
                            `}
                        >
                            <Icon size={16} />
                            {tab.label}
                            {count > 0 && (
                                <span className={`
                                    ${activeTab === tab.id
                                        ? 'bg-violet-600 text-white'
                                        : 'bg-[#222] text-gray-400'
                                    }
                                `}>
                                    {count}
                                </span>
                            )}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-violet-500" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* --- NEGOTIATIONS LIST --- */}
            {currentList.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-24 h-24 bg-[#111] rounded-full flex items-center justify-center mx-auto mb-6">
                        <DollarSign className="text-gray-600" size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No hay negociaciones</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                        {activeTab === 'pending'
                            ? 'Las ofertas de compradores aparecerán aquí. Espera a que alguien te envíe una propuesta.'
                            : `No tienes negociaciones ${activeTab === 'accepted' ? 'aceptadas' : 'rechazadas'} aún.`
                        }
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {currentList.map((negotiation) => (
                        <div
                            key={negotiation.id}
                            className="bg-[#111] border border-[#222] rounded-2xl p-6 hover:border-violet-500/30 transition-all group"
                        >
                            <div className="flex flex lg:items-center gap-6">
                                {/* Product Image */}
                                <div
                                    className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer"
                                    onClick={() => navigate(getProductLink(negotiation))}
                                >
                                    <img
                                        src={negotiation.product?.image_url || '/images/portada-default.png'}
                                        alt={negotiation.product?.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3
                                                className="text-lg font-bold text-white truncate cursor-pointer hover:text-violet-400 transition-colors"
                                                onClick={() => navigate(getProductLink(negotiation))}
                                            >
                                                {negotiation.product?.name || 'Producto'}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-gray-400 text-sm">
                                                    {formatDate(negotiation.created_at)}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(negotiation.status)}`}>
                                                    {negotiation.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-white">
                                                ${parseFloat(negotiation.offered_amount).toFixed(2)}
                                            </div>
                                            <div className="text-gray-500 text-xs font-medium uppercase tracking-wider">
                                                Oferta
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info Section (Buyer or Producer) */}
                                    <div className="mt-4 p-4 bg-[#0a0a0a] rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full flex items-center justify-center text-white font-bold">
                                                {viewType === 'producer'
                                                    ? negotiation.buyer_email[0].toUpperCase()
                                                    : (negotiation.product?.producer_id?.[0]?.toUpperCase() || 'P')
                                                }
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">
                                                    {viewType === 'producer'
                                                        ? (negotiation.buyer_name || negotiation.buyer_email.split('@')[0])
                                                        : (negotiation.product?.users?.nickname || 'Productor')
                                                    }
                                                </div>
                                                <div className="text-gray-500 text-sm">
                                                    {viewType === 'producer' ? negotiation.buyer_email : 'Enviado al productor'}
                                                </div>
                                            </div>
                                        </div>
                                        {negotiation.message && (
                                            <div className="mt-3 pt-3 border-t border-[#222]">
                                                <div className="flex items-start gap-2">
                                                    <MessageSquare size={14} className="text-gray-500 mt-0.5" />
                                                    <p className="text-gray-300 text-sm leading-relaxed">
                                                        {negotiation.message}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions (Only for Producer) */}
                                    {viewType === 'producer' && negotiation.status === 'pending' && (
                                        <div className="mt-4 flex items-center gap-3">
                                            <input
                                                type="text"
                                                placeholder="Mensaje de respuesta (opcional)..."
                                                value={responseMessage}
                                                onChange={(e) => setResponseMessage(e.target.value)}
                                                className="flex-1 bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-2.5 text-white text-sm focus:border-violet-500 focus:outline-none"
                                            />
                                            <button
                                                onClick={() => handleRespond(negotiation.id, 'accepted')}
                                                disabled={responding === negotiation.id}
                                                className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                                            >
                                                <CheckCircle2 size={18} />
                                                Aceptar
                                            </button>
                                            <button
                                                onClick={() => handleRespond(negotiation.id, 'rejected')}
                                                disabled={responding === negotiation.id}
                                                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                                            >
                                                <XCircle size={18} />
                                                Rechazar
                                            </button>
                                        </div>
                                    )}

                                    {/* Response Message */}
                                    {negotiation.response_message && (
                                        <div className="mt-3 p-3 bg-[#0a0a0a] rounded-xl border border-[#222]">
                                            <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                                                {viewType === 'producer' ? 'Tu respuesta:' : 'Respuesta del productor:'}
                                            </div>
                                            <p className="text-gray-300 text-sm">
                                                {negotiation.response_message}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
