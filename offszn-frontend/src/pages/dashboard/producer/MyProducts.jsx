import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyProducts } from '../../../hooks/useMyProducts';
import DashboardProductCard from '../../../components/dashboard/DashboardProductCard';
import {
    Plus, Search, Trash2, Eye, EyeOff,
    MoreHorizontal, ChevronDown, CheckCircle2,
    Music, Disc, Cpu, Package, Loader2,
    Zap, X, Lock, Globe, Link as LinkIcon
} from 'lucide-react';
import { useAuth } from '../../../store/authStore';

const TABS = [
    { id: 'beats', label: 'Beats' },
    { id: 'drumkits', label: 'Drum Kits' },
    { id: 'loopkits', label: 'Loop Kits' },
    { id: 'presets', label: 'Presets' }
];

const FILTERS = [
    { id: 'all', label: 'Todos' },
    { id: 'published', label: 'Publicados' },
    { id: 'private', label: 'Privados' },
    { id: 'unlisted', label: 'No Listados' }
];

export default function MyProducts() {
    const navigate = useNavigate();
    const { loading: authLoading, user } = useAuth();
    const [activeTab, setActiveTab] = useState('beats');
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showVisibilityBulk, setShowVisibilityBulk] = useState(false);

    const {
        items, loading: productsLoading, selectedIds, fetchProducts,
        toggleSelection, selectAll, deselectAll,
        bulkUpdateVisibility, bulkDelete
    } = useMyProducts();

    useEffect(() => {
        if (!authLoading && user) {
            fetchProducts(activeTab, activeFilter);
        }
    }, [activeTab, activeFilter, fetchProducts, authLoading, user]);

    const loading = authLoading || (productsLoading && items.length === 0);

    const filteredItems = items.filter(item => {
        const title = (item.title || item.name || '').toLowerCase();
        return title.includes(searchQuery.toLowerCase());
    });

    const handleBulkVisibility = async (visibility) => {
        await bulkUpdateVisibility(visibility);
        setShowVisibilityBulk(false);
        fetchProducts(activeTab, activeFilter);
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`¿Seguro que quieres eliminar definitivamente ${selectedIds.size} productos?`)) {
            await bulkDelete(activeTab);
            fetchProducts(activeTab, activeFilter);
        }
    };

    const getCreateBtnData = () => {
        switch (activeTab) {
            case 'drumkits': return { label: 'Crear Drum Kit', path: '/dashboard/upload' };
            case 'loopkits': return { label: 'Crear Loop Kit', path: '/dashboard/upload' };
            case 'presets': return { label: 'Crear Preset', path: '/dashboard/upload' };
            default: return { label: 'Crear Beat', path: '/dashboard/upload' };
        }
    };

    const currentFilterLabel = FILTERS.find(f => f.id === activeFilter)?.label || 'Filtrar por';

    if (authLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
                <Loader2 className="animate-spin text-violet-500" size={48} />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 animate-pulse">Autenticando sesión...</span>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1400px] mx-auto pb-20 px-4 sm:px-6">

            {/* --- SELECTION BAR (TOP FLOATING) --- */}
            {selectedIds.size > 0 && (
                <div className="fixed top-0 left-0 right-0 h-[64px] bg-[#0A0A0A] border-b border-[#222] z-[100] flex items-center justify-between px-6 animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={deselectAll}
                            className="w-6 h-6 flex items-center justify-center bg-violet-500 text-white rounded cursor-pointer"
                        >
                            <div className="w-3 h-0.5 bg-white rounded-full"></div>
                        </button>
                        <span className="text-white text-sm font-semibold transition-all">
                            {selectedIds.size} seleccionados
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <button
                                onClick={() => setShowVisibilityBulk(!showVisibilityBulk)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-transparent border border-[#333] text-[#ccc] text-[13px] rounded-md hover:bg-[#222] hover:text-white transition-all"
                            >
                                <Eye size={14} /> Visibilidad <ChevronDown size={10} className={`transition-transform ${showVisibilityBulk ? 'rotate-180' : ''}`} />
                            </button>

                            {showVisibilityBulk && (
                                <>
                                    <div className="fixed inset-0" onClick={() => setShowVisibilityBulk(false)} />
                                    <div className="absolute top-[calc(100%+8px)] left-0 w-48 bg-[#111] border border-[#333] rounded-lg shadow-2xl py-1 z-[110]">
                                        <BulkMenuAction icon={Globe} label="Publicado" onClick={() => handleBulkVisibility('public')} />
                                        <BulkMenuAction icon={Lock} label="Privado" onClick={() => handleBulkVisibility('private')} />
                                        <BulkMenuAction icon={LinkIcon} label="No Listado" onClick={() => handleBulkVisibility('unlisted')} />
                                    </div>
                                </>
                            )}
                        </div>

                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-3 py-1.5 bg-transparent border border-red-500/20 text-red-500 text-[13px] rounded-md hover:bg-red-500/10 hover:border-red-500 transition-all font-medium"
                        >
                            <Trash2 size={14} /> Eliminar
                        </button>

                        <div className="h-6 w-px bg-[#333] mx-2"></div>

                        <button
                            onClick={deselectAll}
                            className="p-1 px-1.5 text-[#666] hover:text-white transition-colors text-xl"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-baseline md:items-center gap-6 mb-8 mt-4">
                <div className="flex items-baseline gap-3">
                    <h1 className="text-[32px] font-bold text-white tracking-tight font-display">
                        Mis Productos
                    </h1>
                    {user && (
                        <span className="text-[18px] text-[#888] font-normal">
                            | @{user.email?.split('@')[0]}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Status Dropdown */}
                    <div className="relative w-full md:w-auto">
                        <button
                            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                            className="w-full md:w-[160px] flex items-center justify-between px-4 py-2.5 bg-[#0F0F0F] border border-[#222] rounded-lg text-[#aaa] text-[13px] font-medium hover:border-[#333] transition-all"
                        >
                            {currentFilterLabel}
                            <ChevronDown size={14} className={`text-[#666] transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showStatusDropdown && (
                            <>
                                <div className="fixed inset-0 z-[60]" onClick={() => setShowStatusDropdown(false)} />
                                <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-[#111] border border-[#333] rounded-lg shadow-2xl py-1 z-[70] overflow-hidden">
                                    {FILTERS.map(filter => (
                                        <button
                                            key={filter.id}
                                            onClick={() => {
                                                setActiveFilter(filter.id);
                                                setShowStatusDropdown(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-[13px] transition-colors ${activeFilter === filter.id ? 'bg-violet-500 text-white' : 'text-[#aaa] hover:bg-white/5 hover:text-white'}`}
                                        >
                                            {filter.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => navigate(getCreateBtnData().path)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-violet-500 text-white text-[13px] font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-violet-500/10 whitespace-nowrap"
                    >
                        <Plus size={18} />
                        {getCreateBtnData().label}
                    </button>
                </div>
            </div>

            {/* --- TABS --- */}
            <div className="border-b border-[#1a1a1a] mb-8 flex items-center gap-8 overflow-x-auto no-scrollbar">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative pb-4 text-[15px] font-semibold transition-all whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-[#666] hover:text-[#999]'}`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-white" />
                        )}
                    </button>
                ))}
            </div>

            {/* --- SEARCH BAR --- */}
            <div className="relative mb-10 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#444]" size={18} />
                <input
                    type="text"
                    placeholder="Escribe para buscar..."
                    className="w-full bg-[#0F0F0F] border border-[#222] rounded-lg py-2.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all placeholder:text-[#333]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* --- GRID --- */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="aspect-[4/5] bg-[#0F0F0F] border border-[#222] rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 border border-dashed border-[#222] rounded-xl text-center">
                    <div className="w-16 h-16 bg-[#111] rounded-full flex items-center justify-center mb-6">
                        <Search className="text-[#333]" size={32} />
                    </div>
                    <h3 className="text-white text-lg font-bold mb-2">No se encontraron productos</h3>
                    <p className="text-[#555] text-sm max-w-xs mx-auto">
                        Intenta ajustar tus filtros o búsqueda para encontrar lo que buscas.
                    </p>
                    <button
                        onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
                        className="mt-6 text-violet-500 text-[13px] font-bold uppercase tracking-wider hover:text-white transition-colors"
                    >
                        Limpiar filtros
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {filteredItems.map(item => (
                        <DashboardProductCard
                            key={item.id}
                            item={item}
                            isSelected={selectedIds.has(item.id)}
                            onToggleSelection={toggleSelection}
                            onEdit={(item) => navigate(`/dashboard/upload?edit=${item.id}`)}
                            onDelete={(item) => {
                                toggleSelection(item.id);
                                handleBulkDelete();
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function BulkMenuAction({ icon: Icon, label, onClick }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#aaa] hover:bg-white/5 hover:text-white transition-colors text-left"
        >
            <Icon size={14} />
            {label}
        </button>
    );
}
