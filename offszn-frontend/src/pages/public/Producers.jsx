import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, ChevronDown, Check, UserPlus, Play } from 'lucide-react';
import { apiClient } from '../../api/client';
import SecureImage from '../../components/ui/SecureImage';
import CustomBeatModal from '../../components/modals/CustomBeatModal';

const CATEGORIES = [
    { label: 'Todos', value: 'trending' },
    { label: 'Popular', value: 'popular' },
    { label: 'Recientes', value: 'recent' },
    { label: 'A-Z', value: 'a-z' }
];

const ROLES = [
    { label: 'productores', value: 'productores' },
    { label: 'artistas', value: 'artistas' },
    { label: 'compositores', value: 'Compositores' },
    { label: 'ingenieros', value: 'Ingenieros de mezcla/master' },
    { label: 'instrumentistas', value: 'Instrumentista' },
    { label: 'oyentes', value: 'Fan / Consumidor' }
];

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const Producers = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // Filters State
    const [sort, setSort] = useState('trending');
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [selectedRoles, setSelectedRoles] = useState([]);

    // Data State
    const [producers, setProducers] = useState([]);
    const [topProducers, setTopProducers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingTop, setLoadingTop] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProducer, setSelectedProducer] = useState(null);

    const fetchProducers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                sort,
                search: debouncedSearch,
                role: selectedRoles.join(','),
                page: currentPage,
                limit: 50
            });
            const response = await apiClient.get(`/producers?${params.toString()}`);

            setProducers(response.data.producers || []);
            setTotalPages(response.data.totalPages || 1);
        } catch (err) {
            console.error('Error fetching producers:', err);
            setError('No se pudieron cargar los creadores. Por favor intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    }, [sort, debouncedSearch, selectedRoles, currentPage]);

    const fetchTopProducers = async () => {
        try {
            setLoadingTop(true);
            const response = await apiClient.get('/leaderboard');
            setTopProducers(response.data || []);
        } catch (err) {
            console.error('Error fetching top producers:', err);
        } finally {
            setLoadingTop(false);
        }
    };

    useEffect(() => {
        fetchProducers();
    }, [fetchProducers]);

    useEffect(() => {
        fetchTopProducers();
    }, []);

    // Effect to reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [sort, debouncedSearch, selectedRoles]);

    const sortedProducers = useMemo(() => {
        if (!producers.length) return [];
        let modifiedList = [...producers];

        // Inject Top 10 into page 1 if trending or popular and no search/filters
        if ((sort === 'trending' || sort === 'popular') && currentPage === 1 && !debouncedSearch && selectedRoles.length === 0) {
            topProducers.forEach(topProducer => {
                if (!modifiedList.find(p => p.id === topProducer.id)) {
                    modifiedList.push(topProducer);
                }
            });

            modifiedList.sort((a, b) => {
                const aTopInfo = topProducers.find(t => t.id === a.id);
                const bTopInfo = topProducers.find(t => t.id === b.id);

                const aRank = aTopInfo ? aTopInfo.rank : 999;
                const bRank = bTopInfo ? bTopInfo.rank : 999;

                if (aRank !== bRank) return aRank - bRank;
                return 0; // Fallback to original order 
            });
        }
        return modifiedList;
    }, [producers, topProducers, sort, currentPage, debouncedSearch, selectedRoles]);

    const handleRoleToggle = (roleValue) => {
        setSelectedRoles(prev =>
            prev.includes(roleValue)
                ? prev.filter(r => r !== roleValue)
                : [...prev, roleValue]
        );
    };

    const openModal = (producer) => {
        setSelectedProducer(producer);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedProducer(null);
    };

    return (
        <main className="min-h-screen bg-black text-white pt-10">
            {/* Hero Section */}
            <section className="px-6 py-5 text-center">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter mb-0 text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Encontrar Creadores
                </h1>
            </section>

            {/* Filter Toolbar */}
            <div className="px-6 py-5 mb-10 border-b border-white/10 max-w-4xl mx-auto">
                <div className="flex flex-col items-center gap-8">

                    <div className="flex flex-col items-center gap-4 w-full">
                        {/* Category Filters */}
                        <div className="flex bg-white/5 p-1.5 rounded-2xl gap-1 border border-white/10 overflow-x-auto w-full max-w-md scrollbar-hide">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.value}
                                    onClick={() => setSort(cat.value)}
                                    className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${sort === cat.value
                                        ? 'bg-white text-black shadow-md'
                                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Roles Checklist */}
                        <div className="flex flex-row gap-2 overflow-x-auto w-full pb-2 scrollbar-hide justify-start md:justify-center px-2">
                            {ROLES.map(role => {
                                const isSelected = selectedRoles.includes(role.value);
                                return (
                                    <label
                                        key={role.value}
                                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm cursor-pointer transition-all select-none whitespace-nowrap ${isSelected
                                            ? 'bg-white/10 border-white/30 text-white font-semibold'
                                            : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={isSelected}
                                            onChange={() => handleRoleToggle(role.value)}
                                        />
                                        <span className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center transition-all ${isSelected ? 'border-white bg-white' : 'border-zinc-600'
                                            }`}>
                                            {isSelected && <Check size={12} className="text-black stroke-[3]" />}
                                        </span>
                                        {role.label}
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Search Box */}
                    <div className="relative w-full max-w-2xl">
                        <input
                            type="text"
                            placeholder="Buscar creadores..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent border-b border-white/15 text-white/90 px-2 py-3 pr-10 text-lg sm:text-xl outline-none placeholder:text-zinc-600 focus:border-violet-500 transition-colors"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        />
                        <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={20} />
                    </div>
                </div>
            </div>

            {/* Main Grid Section */}
            <section className="px-6 pb-24 max-w-[1400px] mx-auto w-full">
                {error ? (
                    <div className="text-center py-24 text-zinc-500">{error}</div>
                ) : loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="bg-[#111] rounded-2xl p-4 md:p-6 mb-3 flex flex-col items-center justify-center h-52 sm:h-60">
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/5 mb-4"></div>
                                    <div className="w-2/3 h-3 bg-white/5 rounded-full mb-2"></div>
                                    <div className="w-1/2 h-2.5 bg-white/5 rounded-full mb-1"></div>
                                    <div className="w-1/3 h-2.5 bg-white/5 rounded-full"></div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="h-9 bg-white/5 rounded-lg border border-white/5"></div>
                                    <div className="h-9 bg-white/5 rounded-lg border border-white/5"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : sortedProducers.length === 0 ? (
                    <div className="text-center py-24 text-zinc-500">No se encontraron creadores.</div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                        {sortedProducers.map(producer => {
                            const profileLink = `/@${producer.nickname || producer.users?.nickname}`;

                            let displayRole = 'PRODUCTOR';
                            if (producer.role) {
                                const rawRole = producer.role.toLowerCase();
                                if (rawRole.includes('ingeniero')) {
                                    displayRole = 'INGENIERO DE MEZCLA/MASTER';
                                } else if (rawRole.includes('fan') || rawRole.includes('oyente') || rawRole.includes('consumidor')) {
                                    displayRole = 'FAN / CONSUMIDOR';
                                } else if (rawRole.includes('cantante') || rawRole.includes('artista')) {
                                    displayRole = 'ARTISTA / CANTANTE';
                                } else if (rawRole.includes('compositor')) {
                                    displayRole = 'COMPOSITOR / SONGWRITER';
                                } else if (rawRole.includes('músico') || rawRole.includes('musico') || rawRole.includes('instrumentista')) {
                                    displayRole = 'MÚSICO / INSTRUMENTISTA';
                                } else {
                                    displayRole = producer.role.toUpperCase();
                                }
                            }

                            const firstChar = (producer.nickname || producer.users?.nickname || 'U').charAt(0).toUpperCase();

                            // Get Top 10 Rank
                            const topInfo = topProducers.find(t => t.id === producer.id);
                            const rank = topInfo ? topInfo.rank : null;

                            return (
                                <div key={producer.id} className="group text-center">
                                    <Link to={profileLink} className="block bg-[#111] rounded-2xl p-4 md:p-6 mb-3 relative transition-colors duration-300 hover:bg-[#161616] min-h-[200px] sm:min-h-[240px] flex flex-col items-center justify-center">
                                        <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full mx-auto mb-3 relative overflow-visible flex items-center justify-center shrink-0">
                                            {producer.avatar_url ? (
                                                <SecureImage
                                                    src={producer.avatar_url}
                                                    alt={producer.nickname}
                                                    className="w-full h-full rounded-full object-cover"
                                                    skeletonClassName="w-full h-full rounded-full bg-zinc-800 animate-pulse"
                                                />
                                            ) : (
                                                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#222] to-[#0a0a0a] border border-white/5 flex items-center justify-center text-3xl sm:text-4xl font-black text-white/70 uppercase">
                                                    {firstChar}
                                                </div>
                                            )}

                                            {rank && (
                                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1 bg-[#ffcc00] text-black text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full whitespace-nowrap border-2 border-[#111] z-10">
                                                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z" /></svg>
                                                    TOP {rank}
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-base sm:text-[1.05rem] font-bold text-white tracking-tight truncate w-full group-hover:text-violet-400 transition-colors mt-3">
                                            {producer.nickname}
                                        </h3>

                                        <div className="text-[0.7rem] text-[#888] font-bold tracking-wide mt-0.5 mb-1.5 uppercase">
                                            {displayRole}
                                        </div>

                                        <div className="flex items-center justify-center gap-1.5 text-[#666] text-[0.8rem] mt-1.5">
                                            <i className="bi bi-folder"></i>
                                            <span>{producer.products_count || 0}</span>
                                        </div>
                                    </Link>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => openModal(producer)}
                                            className="px-2 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30 transition-all text-center flex items-center justify-center"
                                        >
                                            Solicitar
                                        </button>
                                        <Link
                                            to={profileLink}
                                            className="px-2 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30 transition-all text-center flex items-center justify-center"
                                        >
                                            Ver Info
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && !loading && (
                    <div className="flex justify-center items-center gap-2 mt-16">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-transparent bg-[#1a1a1a] flex items-center justify-center text-zinc-500 font-bold hover:bg-[#222] hover:text-white disabled:opacity-30 disabled:hover:bg-[#1a1a1a] disabled:hover:text-zinc-500 transition-all text-sm"
                        >
                            &lt;
                        </button>
                        <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => {
                                const page = i + 1;
                                // Simple pagination logic to show max 5 pages
                                if (
                                    totalPages > 5 &&
                                    page !== 1 &&
                                    page !== totalPages &&
                                    Math.abs(page - currentPage) > 1
                                ) {
                                    if (page === 2 || page === totalPages - 1) return <span key={page} className="text-zinc-600 font-bold px-1">...</span>;
                                    return null;
                                }

                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold transition-all ${currentPage === page
                                            ? 'bg-violet-600 text-white'
                                            : 'bg-[#1a1a1a] text-zinc-500 hover:bg-[#222] hover:text-white'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                )
                            })}
                        </div>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-transparent bg-[#1a1a1a] flex items-center justify-center text-zinc-500 font-bold hover:bg-[#222] hover:text-white disabled:opacity-30 disabled:hover:bg-[#1a1a1a] disabled:hover:text-zinc-500 transition-all text-sm"
                        >
                            &gt;
                        </button>
                    </div>
                )}
            </section>

            {/* Modal Injection */}
            <CustomBeatModal
                isOpen={isModalOpen}
                onClose={closeModal}
                producer={selectedProducer}
            />
        </main>
    );
};

export default Producers;
