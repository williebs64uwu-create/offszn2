import React, { useState, useEffect } from 'react';
import { X, Download, UserPlus, Loader2, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../api/client';
import toast from 'react-hot-toast';

const DownloadGateModal = ({ isOpen, onClose, product, downloadUrl }) => {
    const { user, profile } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [checkingFollow, setCheckingFollow] = useState(true);

    const producer = product?.artist_users || product?.users;
    const producerId = producer?.id;
    const producerName = producer?.nickname || 'Productor';
    const isOwner = user?.id === producerId;

    useEffect(() => {
        if (isOpen && user && producerId && !isOwner) {
            checkFollowStatus();
        } else {
            setCheckingFollow(false);
        }
    }, [isOpen, user, producerId, isOwner]);

    const checkFollowStatus = async () => {
        try {
            const { data } = await apiClient.get('/social/following');
            const followingIds = Array.isArray(data) ? data.map(p => p.id) : [];
            setIsFollowing(followingIds.includes(producerId));
        } catch (error) {
            console.error('Error al verificar follow:', error);
        } finally {
            setCheckingFollow(false);
        }
    };

    const handleDownload = async () => {
        if (!downloadUrl) {
            toast.error('URL de descarga no disponible');
            return;
        }

        setLoading(true);

        try {
            // 1. Auto-Follow (If not following and not owner)
            if (user && producerId && !isOwner && !isFollowing) {
                try {
                    await apiClient.post(`/social/follow/${producerId}`);
                    setIsFollowing(true);
                    toast.success(`Ahora sigues a ${producerName} 🎵`);
                } catch (err) {
                    console.warn('Auto-follow falló, continuando con la descarga', err);
                }
            }

            // 2. Registrar orden gratis ($0)
            if (user && product?.id) {
                try {
                    await apiClient.post('/orders/free', { productId: product.id });
                } catch (err) {
                    console.warn('Registro de orden gratuita falló', err);
                }
            }

            // 3. Iniciar Descarga (Simulada para navegador)
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.target = '_blank';
            a.download = `${product?.name || 'offszn-download'}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            toast.success('¡Descarga Iniciada!');
            onClose();

        } catch (error) {
            console.error('Error en proceso de descarga:', error);
            toast.error('Hubo un error al iniciar la descarga');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // --- ESTADO 1: INVITADO ---
    if (!user) {
        return (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
                <div className="relative w-[400px] max-w-[calc(100vw-32px)] bg-[#111] border border-white/10 rounded-[24px] p-8 shadow-2xl animate-in zoom-in-95">
                    <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#888] hover:text-white hover:bg-white/10 transition-all">
                        <X size={18} />
                    </button>

                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
                            <Download size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Descarga Gratis</h3>
                        <p className="text-sm text-[#888] leading-relaxed">
                            Crea una cuenta para guardar este producto permanentemente en tu librería y recibir actualizaciones.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button onClick={handleDownload} disabled={loading} className="w-full py-3.5 bg-white text-black hover:bg-gray-200 font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <><Download size={18} /> Descargar Como Invitado</>}
                        </button>

                        <button onClick={() => { onClose(); window.location.href = '/auth/register'; }} className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-[#aaa] hover:text-white font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2">
                            <Lock size={16} /> Crear cuenta y guardar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- ESTADO 2: AUTENTICADO (Download Gate) ---
    const isAlreadyConnected = isOwner || isFollowing;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="relative w-[400px] max-w-[calc(100vw-32px)] bg-[#111] border border-white/10 rounded-[24px] p-8 shadow-2xl animate-in zoom-in-95">
                <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#888] hover:text-white hover:bg-white/10 transition-all">
                    <X size={18} />
                </button>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10 relative overflow-hidden">
                        {isAlreadyConnected ? <Download size={32} className="text-white" /> : <UserPlus size={32} className="text-purple-400" />}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                        {isAlreadyConnected ? 'Descarga Lista' : 'Paso Final'}
                    </h3>

                    {checkingFollow ? (
                        <p className="text-sm text-[#888] animate-pulse">Verificando estado...</p>
                    ) : (
                        <p className="text-sm text-[#888] leading-relaxed">
                            {isAlreadyConnected
                                ? `¡Gracias por tu apoyo! Ya sigues a ${producerName}. Tu descarga está lista.`
                                : `Para descargar este producto de forma gratuita, empezarás a seguir a ${producerName}.`
                            }
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleDownload}
                        disabled={loading || checkingFollow}
                        className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-[0_4px_15px_rgba(147,51,234,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : (
                            isAlreadyConnected ? <><Download size={18} /> Descargar Ahora</> : <><UserPlus size={18} /> Seguir & Descargar</>
                        )}
                    </button>

                    <button onClick={onClose} className="w-full py-3 bg-transparent text-[#666] hover:text-white font-semibold rounded-xl transition-colors">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DownloadGateModal;
