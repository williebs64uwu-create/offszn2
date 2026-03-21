import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import toast from 'react-hot-toast';
import {
    BiUserMinus, BiMusic, BiSearch, BiGrid, BiListUl, BiUser
} from 'react-icons/bi';
import { FaUserSlash } from 'react-icons/fa';

function ProducerSkeleton() {
    return (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 flex flex-col items-center gap-3 animate-pulse">
            <div className="w-20 h-20 rounded-full bg-white/[0.05]" />
            <div className="h-4 bg-white/[0.05] rounded w-3/4" />
            <div className="h-3 bg-white/[0.05] rounded w-1/2" />
            <div className="h-8 bg-white/[0.05] rounded-full w-full mt-1" />
        </div>
    );
}

function ProducerCard({ producer, onUnfollow }) {
    const avatar = producer.avatar_url;
    const name = producer.nickname || producer.first_name || 'Productor';
    const productCount = producer.product_count || 0;

    return (
        <div className="group bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 flex flex-col items-center gap-3 hover:border-purple-500/30 hover:bg-white/[0.04] hover:-translate-y-1 transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
            {/* Avatar */}
            <Link to={`/${name}`} className="relative">
                {avatar ? (
                    <img
                        src={avatar}
                        alt={name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-white/10 group-hover:border-purple-500/40 transition-colors"
                    />
                ) : (
                    <div className="w-20 h-20 rounded-full bg-white/[0.05] border-2 border-white/10 flex items-center justify-center text-2xl text-white/30">
                        <BiUser />
                    </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black" />
            </Link>

            {/* Info */}
            <div className="text-center">
                <Link to={`/${name}`}>
                    <h3 className="text-white font-bold text-sm hover:text-purple-400 transition-colors truncate max-w-[150px]">
                        {name}
                    </h3>
                </Link>
                <p className="text-[#666] text-xs mt-0.5">
                    <BiMusic className="inline mr-1" />
                    {productCount} {productCount === 1 ? 'producto' : 'productos'}
                </p>
            </div>

            {/* Unfollow Button */}
            <button
                onClick={() => onUnfollow(producer.id, name)}
                className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold text-white/60 border border-white/10 rounded-full hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/[0.05] transition-all"
            >
                <BiUserMinus /> Siguiendo
            </button>
        </div>
    );
}

export default function Following() {
    const [loading, setLoading] = useState(true);
    const [following, setFollowing] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchFollowing();
    }, []);

    const fetchFollowing = async () => {
        try {
            setLoading(true);
            const { data } = await apiClient.get('/social/following');
            setFollowing(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error al cargar siguiendo:', err);
            toast.error('No se pudo cargar la lista');
        } finally {
            setLoading(false);
        }
    };

    const handleUnfollow = async (userId, name) => {
        if (!window.confirm(`¿Dejar de seguir a ${name}?`)) return;
        try {
            await apiClient.post(`/social/follow/${userId}`);
            setFollowing(prev => prev.filter(p => p.id !== userId));
            toast.success(`Dejaste de seguir a ${name}`);
        } catch {
            toast.error('Error al dejar de seguir');
        }
    };

    const filtered = following.filter(p => {
        const name = (p.nickname || p.first_name || '').toLowerCase();
        return name.includes(search.toLowerCase());
    });

    return (
        <div className="w-full">
            {/* Header */}
            <div className="relative mb-8 p-8 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent overflow-hidden">
                <div className="absolute top-1/2 -right-10 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                    <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-300 font-[Plus_Jakarta_Sans]">
                        Siguiendo 👥
                    </h1>
                    <p className="text-[#999] mt-1">
                        {loading ? '...' : `${following.length} productor${following.length !== 1 ? 'es' : ''} que sigues`}
                    </p>
                </div>
            </div>

            {/* Search */}
            {!loading && following.length > 0 && (
                <div className="relative mb-6 max-w-sm">
                    <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
                    <input
                        type="text"
                        placeholder="Buscar productor..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-[#555] focus:border-purple-500/40 outline-none transition-all"
                    />
                </div>
            )}

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => <ProducerSkeleton key={i} />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/[0.08] rounded-2xl bg-white/[0.01]">
                    <FaUserSlash className="text-5xl text-white/10 mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">
                        {search ? 'Sin resultados' : 'Aún no sigues a nadie'}
                    </h3>
                    <p className="text-[#666] text-sm text-center max-w-xs mb-6">
                        {search
                            ? `No se encontró ningún productor con "${search}".`
                            : 'Explora el catálogo y sigue a tus productores favoritos.'}
                    </p>
                    <Link
                        to="/productores"
                        className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors text-sm"
                    >
                        Descubrir Productores
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filtered.map(p => (
                        <ProducerCard key={p.id} producer={p} onUnfollow={handleUnfollow} />
                    ))}
                </div>
            )}
        </div>
    );
}
