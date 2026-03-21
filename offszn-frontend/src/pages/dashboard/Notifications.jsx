import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../store/useNotificationStore';
import toast from 'react-hot-toast';
import {
    BiBell, BiCheck, BiHeart, BiUserPlus, BiMessage,
    BiRocket, BiCheckCircle, BiTime, BiX
} from 'react-icons/bi';
import { FaHandshake } from "react-icons/fa";

// --- Helpers ---
function timeAgo(date) {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return 'Hace un momento';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    return new Date(date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}

function groupNotifications(notifs) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const lastWeek = new Date(today); lastWeek.setDate(today.getDate() - 7);

    const groups = { Hoy: [], Ayer: [], 'Esta Semana': [], Anteriores: [] };
    notifs.forEach(n => {
        const d = new Date(n.created_at);
        if (d >= today) groups['Hoy'].push(n);
        else if (d >= yesterday) groups['Ayer'].push(n);
        else if (d >= lastWeek) groups['Esta Semana'].push(n);
        else groups['Anteriores'].push(n);
    });
    return groups;
}

function getIcon(type) {
    switch (type) {
        case 'collab_invitation': return <FaHandshake className="text-purple-400" />;
        case 'collab_accepted': return <BiCheckCircle className="text-green-400" />;
        case 'new_follower': return <BiUserPlus className="text-blue-400" />;
        case 'product_like': return <BiHeart className="text-red-400" />;
        case 'product_published': return <BiRocket className="text-yellow-400" />;
        case 'new_message': return <BiMessage className="text-cyan-400" />;
        default: return <BiBell className="text-white" />;
    }
}

function NotifSkeleton() {
    return (
        <div className="flex gap-4 p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl animate-pulse">
            <div className="w-11 h-11 rounded-xl bg-white/[0.05] shrink-0" />
            <div className="flex-1 space-y-2 py-1">
                <div className="h-3.5 bg-white/[0.05] rounded w-2/5" />
                <div className="h-3 bg-white/[0.05] rounded w-4/5" />
                <div className="h-2.5 bg-white/[0.05] rounded w-1/4" />
            </div>
        </div>
    );
}

function NotifItem({ notif, onRead }) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (!notif.read) onRead(notif.id);
        const data = notif.data || {};
        if (notif.type === 'new_message') {
            const convId = data.conversation_id || data.id;
            navigate(convId ? `/mensajes?convId=${convId}` : '/mensajes');
        } else if (['collab_invitation', 'collab_accepted'].includes(notif.type)) {
            navigate('/dashboard/collaborations');
        } else if (notif.type === 'product_like' && data.public_slug) {
            navigate(`/beat/${data.public_slug}`);
        } else if (notif.type === 'new_follower') {
            const username = data.follower_nickname;
            if (username) navigate(`/${username}`);
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`relative flex gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]
        ${notif.read
                    ? 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] hover:border-purple-500/20'
                    : 'bg-purple-500/[0.03] border-purple-500/20 hover:bg-purple-500/[0.06]'
                }`}
        >
            {/* Unread dot */}
            {!notif.read && (
                <span className="absolute top-4 right-4 w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
            )}

            {/* Icon */}
            <div className="w-11 h-11 bg-white/[0.05] border border-white/10 rounded-xl flex items-center justify-center shrink-0 text-xl">
                {getIcon(notif.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {notif.title && (
                    <p className="text-sm font-bold text-white mb-0.5 truncate font-[Plus_Jakarta_Sans]">{notif.title}</p>
                )}
                <p className="text-[0.82rem] text-[#999] leading-relaxed line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: notif.message || '' }} />
                <p className="text-[0.72rem] text-[#555] mt-1 flex items-center gap-1">
                    <BiTime className="inline" /> {timeAgo(notif.created_at)}
                </p>
            </div>
        </div>
    );
}

export default function Notifications() {
    const { notifications, loading, hasFetchedOnce, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
    const [marking, setMarking] = useState(false);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAll = useCallback(async () => {
        if (marking) return;
        setMarking(true);
        try {
            await markAllAsRead();
            toast.success('Todas marcadas como leídas');
        } catch {
            toast.error('Error al marcar notificaciones');
        } finally {
            setMarking(false);
        }
    }, [marking, markAllAsRead]);

    const unread = notifications.filter(n => !n.read).length;
    const grouped = groupNotifications(notifications);
    const groupOrder = ['Hoy', 'Ayer', 'Esta Semana', 'Anteriores'];

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 px-1">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#888] font-[Plus_Jakarta_Sans]">
                        Notificaciones
                    </h1>
                    {unread > 0 && (
                        <p className="text-sm text-purple-400 mt-1 font-semibold">{unread} sin leer</p>
                    )}
                </div>

                {unread > 0 && (
                    <button
                        onClick={handleMarkAll}
                        disabled={marking}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-white/[0.05] border border-white/10 rounded-xl hover:bg-white hover:text-black hover:border-white transition-all duration-300 backdrop-blur-sm disabled:opacity-50 whitespace-nowrap"
                    >
                        <BiCheck className="text-base" /> Marcar leídas
                    </button>
                )}
            </div>

            {/* Content */}
            {loading && !hasFetchedOnce ? (
                <div className="flex flex-col gap-3">
                    {[...Array(7)].map((_, i) => (
                        <div key={i} style={{ opacity: 1 - i * 0.1 }}>
                            <NotifSkeleton />
                        </div>
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                    <BiBell className="text-6xl text-white/10 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-white mb-2">Sin notificaciones</h2>
                    <p className="text-sm text-[#666] max-w-xs mx-auto">
                        Te avisaremos cuando haya actividad relevante para ti.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {groupOrder.map(group => {
                        const items = grouped[group];
                        if (!items || items.length === 0) return null;
                        return (
                            <div key={group}>
                                {/* Group Title */}
                                <div className="flex items-center gap-3 mb-3 px-1">
                                    <span className="text-[0.7rem] font-extrabold uppercase tracking-widest text-white/70 font-[Plus_Jakarta_Sans]">
                                        {group}
                                    </span>
                                    <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
                                </div>

                                {/* Items */}
                                <div className="flex flex-col gap-3">
                                    {items.map(n => (
                                        <NotifItem key={n.id} notif={n} onRead={markAsRead} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
