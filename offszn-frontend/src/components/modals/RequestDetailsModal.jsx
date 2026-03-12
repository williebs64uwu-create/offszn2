import React, { useState } from 'react';
import { X, Play, DollarSign, Clock, MapPin, ExternalLink, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';

const RequestDetailsModal = ({ request, isOpen, onClose }) => {
    const { user } = useAuthStore();
    const [isClaiming, setIsClaiming] = useState(false);
    const [claimed, setClaimed] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const buyerName = request.buyer?.nickname || 'Usuario';
    const buyerAvatar = request.buyer?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(buyerName)}&background=random`;

    const getEmbedHtml = (url) => {
        if (!url) return null;

        // YouTube
        const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const ytMatch = url.match(ytRegex);
        if (ytMatch) {
            return (
                <iframe
                    width="100%"
                    height="240"
                    src={`https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded-2xl bg-black border border-white/10"
                ></iframe>
            );
        }

        // Spotify
        const spotRegex = /spotify\.com\/(?:intl-[a-zA-Z]+\/)?(track|album|playlist|artist)\/([a-zA-Z0-9]+)/i;
        const spotMatch = url.match(spotRegex);
        if (spotMatch) {
            return (
                <iframe
                    src={`https://open.spotify.com/embed/${spotMatch[1]}/${spotMatch[2]}`}
                    width="100%"
                    height="80"
                    frameBorder="0"
                    allowTransparency="true"
                    allow="encrypted-media"
                    className="rounded-2xl bg-black border border-white/10"
                ></iframe>
            );
        }

        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-sm font-bold"
            >
                Abrir Referencia <ExternalLink size={16} />
            </a>
        );
    };

    const handleClaim = async () => {
        if (!user) {
            alert("Debes iniciar sesión para tomar trabajos.");
            return;
        }

        setIsClaiming(true);
        setError(null);

        try {
            await apiClient.post(`/custom-requests/${request.id}/claim`);
            setClaimed(true);
        } catch (err) {
            console.error("Error claiming request:", err);
            setError(err.response?.data?.error || "No se pudo procesar la solicitud.");
        } finally {
            setIsClaiming(false);
        }
    };

    const isOwnRequest = user?.id === request.buyer_id;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors z-10"
                >
                    <X size={24} />
                </button>

                <div className="p-8 md:p-10">
                    {/* Header: Buyer Info */}
                    <div className="flex flex-col md:flex-row items-center gap-6 pb-8 border-bottom border-white/5 mb-8">
                        <img
                            src={buyerAvatar}
                            alt={buyerName}
                            className="w-20 h-20 rounded-full border-2 border-white/10 object-cover shadow-2xl"
                        />
                        <div className="text-center md:text-left">
                            <h2 className="text-3xl font-black mb-2">{buyerName}</h2>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <span className="text-xs font-black bg-white/10 text-gray-400 px-3 py-1 rounded-full uppercase tracking-widest border border-white/5">
                                    {request.request_type || 'Beat'}
                                </span>
                                <span className="text-sm font-bold text-gray-500">
                                    Presupuesto: <span className="text-white">${request.budget || 'A convenir'}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Body: Description */}
                    <div className="space-y-8">
                        <section>
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-[2px] mb-4">Descripción del Proyecto</h3>
                            <div className="bg-white/2 border border-white/5 p-6 rounded-3xl">
                                <p className="text-gray-300 leading-relaxed text-[17px] whitespace-pre-line">
                                    {request.description}
                                </p>
                            </div>
                        </section>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <span className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">BPM</span>
                                <span className="font-bold text-lg">{request.bpm || '--'}</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <span className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Key</span>
                                <span className="font-bold text-lg">{request.key || '--'}</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <span className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Creado</span>
                                <span className="font-bold text-sm">
                                    {new Date(request.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                </span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <span className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Vence en</span>
                                <span className="font-bold text-sm text-yellow-500">3 días</span>
                            </div>
                        </div>

                        {/* Reference Links */}
                        {(request.reference_link_1 || request.reference_link_2) && (
                            <section>
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[2px] mb-4">Referencias Musicales</h3>
                                <div className="space-y-4">
                                    {getEmbedHtml(request.reference_link_1)}
                                    {getEmbedHtml(request.reference_link_2)}
                                </div>
                            </section>
                        )}

                        {/* Claims Feedback */}
                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
                                <AlertCircle size={20} />
                                <p>{error}</p>
                            </div>
                        )}

                        {claimed ? (
                            <div className="flex flex-col items-center gap-4 py-6 bg-green-500/10 border border-green-500/20 rounded-3xl text-center">
                                <CheckCircle2 size={48} className="text-green-500 mb-2" />
                                <h4 className="text-xl font-black text-green-500">¡Trabajo Reclamado!</h4>
                                <p className="text-sm text-gray-400 max-w-xs">
                                    Hemos notificado al artista. Revisa tu panel de negociaciones para empezar a trabajar.
                                </p>
                                <button
                                    onClick={onClose}
                                    className="mt-2 px-8 py-3 bg-white text-black font-black rounded-2xl text-sm"
                                >
                                    Cerrar
                                </button>
                            </div>
                        ) : (
                            <div className="pt-4">
                                <button
                                    onClick={handleClaim}
                                    disabled={isOwnRequest || isClaiming}
                                    className={`w-full py-5 rounded-[1.5rem] font-black text-lg transition-all shadow-2xl flex items-center justify-center gap-3 ${isOwnRequest
                                            ? 'bg-white/5 border border-white/5 text-gray-600 cursor-not-allowed'
                                            : 'bg-white text-black hover:bg-black hover:text-white border-2 border-white'
                                        }`}
                                >
                                    {isClaiming ? (
                                        <>Procesando...</>
                                    ) : isOwnRequest ? (
                                        <>Es tu publicación</>
                                    ) : (
                                        <>TOMAR TRABAJO <Send size={20} /></>
                                    )}
                                </button>
                                {!isOwnRequest && (
                                    <p className="text-center text-[10px] text-gray-600 mt-4 uppercase tracking-widest font-black">
                                        Al tomar este trabajo, te comprometes a seguir las directrices de OFFSZN.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestDetailsModal;
