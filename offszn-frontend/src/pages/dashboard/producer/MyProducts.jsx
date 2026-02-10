import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyProducts } from '../../../hooks/useMyProducts';
import DashboardProductCard from '../../../components/dashboard/DashboardProductCard';
import {
    Plus, Search, Filter, Trash2, Eye, EyeOff,
    MoreHorizontal, ChevronDown, CheckCircle2,
    Layers, Music, Disc, Cpu, Package, Loader2
} from 'lucide-react';

const TABS = [
    { id: 'beats', label: 'Beats', icon: Music },
    { id: 'drumkits', label: 'Drum Kits', icon: Disc },
    { id: 'loopkits', label: 'Loop Kits', icon: Cpu },
    { id: 'presets', label: 'Presets', icon: Package }
];

const FILTERS = [
    { id: 'all', label: 'Todos' },
    { id: 'published', label: 'Publicados' },
    { id: 'private', label: 'Privados' },
    { id: 'unlisted', label: 'Ocultos' },
    { id: 'draft', label: 'Borradores' }
];

export default function MyProducts() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('beats');
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const {
        items, loading, selectedIds, fetchProducts,
        toggleSelection, selectAll, deselectAll,
        bulkUpdateVisibility, bulkDelete
    } = useMyProducts();

    useEffect(() => {
        fetchProducts(activeTab, activeFilter);
    }, [activeTab, activeFilter, fetchProducts]);

    const filteredItems = items.filter(item => {
        const title = (item.title || item.name || '').toLowerCase();
        return title.includes(searchQuery.toLowerCase());
    });

    const handleBulkVisibility = async (visibility) => {
        await bulkUpdateVisibility(visibility);
        fetchProducts(activeTab, activeFilter);
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`¿Estás seguro de eliminar ${selectedIds.size} productos?`)) {
            await bulkDelete(activeTab);
            fetchProducts(activeTab, activeFilter);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-10 space-y-8 animate-in fade-in duration-700">

            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-4">
                        <Layers className="text-violet-500" size={32} />
                        Gestionar Catálogo
                    </h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">
                        Administra tus beats, kits y presets desde un solo lugar
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/dashboard/upload-beat')}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all shadow-xl shadow-white/5 active:scale-95"
                    >
                        <Plus size={16} />
                        Subir Producto
                    </button>
                </div>
            </div>

            {/* Selection Bar (Sticky Floating) */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-[#0f0f0f] border border-violet-500/30 p-4 rounded-3xl shadow-2xl flex items-center gap-6 backdrop-blur-xl animate-in slide-in-from-bottom-10 fade-in duration-500">
                    <div className="px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                        <span className="text-xs font-black text-violet-400 uppercase tracking-widest">
                            {selectedIds.size} Seleccionados
                        </span>
                    </div>

                    <div className="h-4 w-[1px] bg-white/10"></div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleBulkVisibility('public')}
                            className="p-3 hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-500 rounded-xl transition-all"
                            title="Hacer Público"
                        >
                            <Eye size={20} />
                        </button>
                        <button
                            onClick={() => handleBulkVisibility('private')}
                            className="p-3 hover:bg-gray-500/10 text-gray-400 hover:text-white rounded-xl transition-all"
                            title="Hacer Privado"
                        >
                            <EyeOff size={20} />
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="p-3 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-xl transition-all"
                            title="Eliminar permanentemente"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>

                    <div className="h-4 w-[1px] bg-white/10"></div>

                    <button
                        onClick={deselectAll}
                        className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white px-4"
                    >
                        Cancelar
                    </button>
                </div>
            )}

            {/* Controls Bar */}
            <div className="flex flex-col xl:flex-row gap-6 items-center justify-between bg-[#0a0a0a]/50 p-4 rounded-3xl border border-white/5 backdrop-blur-md sticky top-6 z-30">
                {/* Tabs */}
                <div className="flex p-1 bg-black/40 rounded-2xl border border-white/5 w-full xl:w-auto overflow-x-auto no-scrollbar">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar en tu catálogo..."
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-black/40 p-1 rounded-2xl border border-white/5 w-full sm:w-auto overflow-x-auto no-scrollbar">
                        {FILTERS.map(filter => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === filter.id ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' : 'text-gray-500 hover:text-white'}`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid */}
            {loading && items.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="aspect-[4/5] rounded-3xl bg-white/5 animate-pulse border border-white/5"></div>
                    ))}
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
                        <Search className="text-gray-600" size={40} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black uppercase">No se encontraron productos</h3>
                        <p className="text-gray-500 text-sm font-bold max-w-sm mx-auto">
                            No hay nada que coincida con tus criterios. Intenta cambiar de pestaña o filtro.
                        </p>
                    </div>
                    <button
                        onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
                        className="px-8 py-3 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                    >
                        Limpiar Filtros
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
                    {filteredItems.map(item => (
                        <DashboardProductCard
                            key={item.id}
                            item={item}
                            isSelected={selectedIds.has(item.id)}
                            onToggleSelection={toggleSelection}
                            onEdit={(item) => console.log('Edit', item)} // Logic for later
                            onDelete={(item) => {
                                if (window.confirm('¿Eliminar este producto?')) {
                                    toggleSelection(item.id);
                                    bulkDelete(activeTab);
                                }
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
