import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, List as ListIcon, Filter, AlertCircle } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import FeedCard from '../../components/feed/FeedCard';
import RequestDetailsModal from '../../components/modals/RequestDetailsModal';

const GENRES = [
    'Todos', 'Trap', 'Hip-Hop/Rap', 'Boom Bap', 'Reggaetón', 'Drill', 'Under',
    'Drumless', 'Experimental', 'R&B', 'Freestyle Rap', 'Hoodtrap', 'Dark Boom Bap',
    'Rage', 'Ambient', 'Soul', 'Melodic', 'Detroit', 'Pluggnb', 'Grimm',
    'Lo-Fi', 'Pop', 'Dancehall', 'Funk', 'Rock', 'Synthwave', 'Cumbia'
];

const Feed = () => {
    const { user } = useAuthStore();
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters State
    const [selectedGenre, setSelectedGenre] = useState('Todos');
    const [searchQuery, setSearchQuery] = useState('');
    const [priceRange, setPriceRange] = useState([10, 1000]);
    const [viewMode, setViewMode] = useState('grid');
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [selectedCategories, setSelectedCategories] = useState({
        beats: [],
        presets: [],
        servicios: []
    });

    // Modal State
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const { data } = await apiClient.get('/custom-requests/public');
            setRequests(data.requests || []);
            setError(null);
        } catch (err) {
            console.error("Error fetching feed:", err);
            setError("No se pudieron cargar las solicitudes. Inténtalo de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenreSelect = (genre) => {
        setSelectedGenre(genre);
    };

    const toggleCategory = (type, value) => {
        setSelectedCategories(prev => {
            const current = prev[type];
            const next = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];
            return { ...prev, [type]: next };
        });
    };

    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            const matchesGenre = selectedGenre === 'Todos' ||
                req.description.toLowerCase().includes(selectedGenre.toLowerCase()) ||
                (req.genre && req.genre.toLowerCase() === selectedGenre.toLowerCase());

            const matchesSearch = !searchQuery ||
                req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (req.buyer?.nickname || '').toLowerCase().includes(searchQuery.toLowerCase());

            const matchesPrice = req.budget >= priceRange[0] && req.budget <= priceRange[1];

            // Category matching (simplified logic: check if any selected category keyword exists in description)
            const allSelectedCats = [
                ...selectedCategories.beats,
                ...selectedCategories.presets,
                ...selectedCategories.servicios
            ];
            const matchesCategory = allSelectedCats.length === 0 ||
                allSelectedCats.some(cat => req.description.toLowerCase().includes(cat.replace('_', ' ')));

            return matchesGenre && matchesSearch && matchesPrice && matchesCategory;
        });
    }, [requests, selectedGenre, searchQuery, priceRange, selectedCategories]);

    const handleOpenDetails = (request) => {
        setSelectedRequest(request);
        setIsModalOpen(true);
    };

    const scrollGenres = (direction) => {
        const container = document.getElementById('genre-scroll');
        if (container) {
            const scrollAmount = direction === 'left' ? -200 : 200;
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-24 pb-20 px-4 md:px-8">
            <div className="max-w-[1400px] mx-auto">
                <h1 className="text-3xl md:text-4xl font-black mb-8 tracking-tight">Feed - Encuentra Servicios</h1>

                {/* FILTERS SECTION */}
                <section className="mb-10">
                    {/* Genre Scroll */}
                    <div className="relative mb-6 group">
                        <button
                            onClick={() => scrollGenres('left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/80 border border-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div
                            id="genre-scroll"
                            className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-1"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {GENRES.map(genre => (
                                <button
                                    key={genre}
                                    onClick={() => handleGenreSelect(genre)}
                                    className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all border ${selectedGenre === genre
                                            ? 'bg-white text-black border-white'
                                            : 'bg-white/5 text-gray-400 border-white/5 hover:border-white/20 hover:text-white'
                                        }`}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => scrollGenres('right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/80 border border-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Secondary Filters */}
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                        <div className="flex flex-wrap gap-3">
                            {/* Beats Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setActiveDropdown(activeDropdown === 'beats' ? null : 'beats')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-bold ${activeDropdown === 'beats' ? 'bg-white text-black border-white' : 'bg-black/40 border-white/10 text-gray-300'
                                        }`}
                                >
                                    Beats <ChevronDown size={14} className={activeDropdown === 'beats' ? 'rotate-180 transition-transform' : 'transition-transform'} />
                                </button>
                                {activeDropdown === 'beats' && (
                                    <div className="absolute top-full mt-2 left-0 w-48 bg-[#111] border border-white/10 rounded-xl p-3 z-50 shadow-2xl">
                                        {['remake', 'personalizado'].map(cat => (
                                            <label key={cat} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-white/5 px-2 rounded-lg transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCategories.beats.includes(cat)}
                                                    onChange={() => toggleCategory('beats', cat)}
                                                    className="w-4 h-4 rounded border-white/20 bg-transparent text-white focus:ring-0 focus:ring-offset-0"
                                                />
                                                <span className="text-sm capitalize">{cat}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Presets Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setActiveDropdown(activeDropdown === 'presets' ? null : 'presets')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-bold ${activeDropdown === 'presets' ? 'bg-white text-black border-white' : 'bg-black/40 border-white/10 text-gray-300'
                                        }`}
                                >
                                    Presets <ChevronDown size={14} className={activeDropdown === 'presets' ? 'rotate-180 transition-transform' : 'transition-transform'} />
                                </button>
                                {activeDropdown === 'presets' && (
                                    <div className="absolute top-full mt-2 left-0 w-48 bg-[#111] border border-white/10 rounded-xl p-3 z-50 shadow-2xl">
                                        {['vocal_chain', 'instrumentos', 'vst'].map(cat => (
                                            <label key={cat} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-white/5 px-2 rounded-lg transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCategories.presets.includes(cat)}
                                                    onChange={() => toggleCategory('presets', cat)}
                                                    className="w-4 h-4 rounded border-white/20 bg-transparent text-white focus:ring-0 focus:ring-offset-0"
                                                />
                                                <span className="text-sm capitalize">{cat.replace('_', ' ')}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Servicios Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setActiveDropdown(activeDropdown === 'servicios' ? null : 'servicios')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-bold ${activeDropdown === 'servicios' ? 'bg-white text-black border-white' : 'bg-black/40 border-white/10 text-gray-300'
                                        }`}
                                >
                                    Servicios <ChevronDown size={14} className={activeDropdown === 'servicios' ? 'rotate-180 transition-transform' : 'transition-transform'} />
                                </button>
                                {activeDropdown === 'servicios' && (
                                    <div className="absolute top-full mt-2 left-0 w-48 bg-[#111] border border-white/10 rounded-xl p-3 z-50 shadow-2xl">
                                        {['mezcla', 'master', 'afinar_voces'].map(cat => (
                                            <label key={cat} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-white/5 px-2 rounded-lg transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCategories.servicios.includes(cat)}
                                                    onChange={() => toggleCategory('servicios', cat)}
                                                    className="w-4 h-4 rounded border-white/20 bg-transparent text-white focus:ring-0 focus:ring-offset-0"
                                                />
                                                <span className="text-sm capitalize">{cat.replace('_', ' ')}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Price Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setActiveDropdown(activeDropdown === 'price' ? null : 'price')}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/40 text-gray-300 transition-all text-sm font-bold"
                                >
                                    Presupuesto <ChevronDown size={14} />
                                </button>
                                {activeDropdown === 'price' && (
                                    <div className="absolute top-full mt-2 left-0 w-64 bg-[#111] border border-white/10 rounded-xl p-4 z-50 shadow-2xl">
                                        <div className="flex justify-between text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">
                                            <span>Min: ${priceRange[0]}</span>
                                            <span>Max: ${priceRange[1]}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="10"
                                            max="1000"
                                            step="10"
                                            value={priceRange[1]}
                                            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                            className="w-full accent-white bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Search and View Toggles */}
                        <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <input
                                    type="text"
                                    placeholder="Buscar solicitudes..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-white/30 outline-none transition-colors"
                                />
                            </div>
                            <div className="flex bg-black/40 border border-white/10 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    <LayoutGrid size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    <ListIcon size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FEED CONTENT */}
                <section>
                    {isLoading ? (
                        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-48 bg-white/5 animate-pulse rounded-2xl border border-white/10"></div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <AlertCircle size={48} className="text-red-500 mb-4 opacity-50" />
                            <p className="text-gray-400">{error}</p>
                            <button onClick={fetchRequests} className="mt-4 text-white font-bold hover:underline">Reintentar</button>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-white/10 rounded-3xl bg-white/2">
                            <Filter size={48} className="text-gray-600 mb-4" />
                            <h3 className="text-xl font-bold mb-2">No se encontraron solicitudes</h3>
                            <p className="text-gray-500 max-w-sm">Intenta ajustar los filtros para encontrar más oportunidades de trabajo.</p>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                            {filteredRequests.map(req => (
                                <FeedCard
                                    key={req.id}
                                    request={req}
                                    viewMode={viewMode}
                                    onViewDetails={() => handleOpenDetails(req)}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Modal de Detalles */}
            {isModalOpen && selectedRequest && (
                <RequestDetailsModal
                    request={selectedRequest}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default Feed;
