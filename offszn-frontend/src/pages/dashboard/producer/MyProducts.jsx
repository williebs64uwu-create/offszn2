import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyProducts } from '../../../hooks/useMyProducts';
import DashboardProductCard from '../../../components/dashboard/DashboardProductCard';
import {
    Plus, Search, Filter, Trash2, Eye, EyeOff,
    MoreHorizontal, ChevronDown, CheckCircle2,
    Layers, Music, Disc, Cpu, Package, Loader2,
    Sparkles, LayoutGrid, SlidersHorizontal, ArrowRight,
    Zap
} from 'lucide-react';
import { useAuth } from '../../../store/authStore';

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
    const { loading: authLoading, user } = useAuth(); // Esperar a que la auth hidrate
    const [activeTab, setActiveTab] = useState('beats');
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

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
        fetchProducts(activeTab, activeFilter);
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`¿Estás seguro de eliminar ${selectedIds.size} productos?`)) {
            await bulkDelete(activeTab);
            fetchProducts(activeTab, activeFilter);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
                <Loader2 className="animate-spin text-violet-500" size={48} />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 animate-pulse">Autenticando sesión...</span>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1500px] mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">

            {/* --- HERO HEADER --- */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full">
                            <span className="text-[9px] font-black text-violet-500 uppercase tracking-widest">Almacén</span>
                        </div>
                        <div className="h-px w-8 bg-white/5"></div>
                    </div>
                    <h1 className="text-6xl font-black uppercase tracking-tighter text-white leading-none">
                        Mi <span className="text-violet-500">Catálogo</span>
                    </h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-4 flex items-center gap-2">
                        <LayoutGrid size={12} className="text-violet-500" /> Gestión centralizada de lanzamientos, drops y recursos digitales
                    </p>
                </div>

                <button
                    onClick={() => navigate('/dashboard/upload-beat')}
                    className="group flex items-center gap-4 px-10 py-5 bg-white text-black text-xs font-black uppercase tracking-[0.2em] rounded-full hover:bg-violet-500 hover:text-white transition-all shadow-2xl active:scale-95"
                >
                    <Plus size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                    Nuevo Item
                </button>
            </div>

            {/* --- FLOATING BULK ACTIONS --- */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] bg-black/60 border border-violet-500/30 p-2 pr-6 rounded-[32px] shadow-[0_30px_60px_-15px_rgba(139,92,246,0.3)] flex items-center gap-6 backdrop-blur-2xl animate-in slide-in-from-bottom-12 duration-500">
                    <div className="px-6 py-4 bg-violet-500 rounded-[24px] shadow-lg shadow-violet-500/20">
                        <span className="text-xs font-black text-white uppercase tracking-widest">
                            {selectedIds.size} Seleccionados
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <BulkActionButton icon={Eye} label="Publicar" onClick={() => handleBulkVisibility('public')} color="hover:text-emerald-500 hover:bg-emerald-500/10" />
                        <BulkActionButton icon={EyeOff} label="Privado" onClick={() => handleBulkVisibility('private')} color="hover:text-white hover:bg-white/5" />
                        <BulkActionButton icon={Trash2} label="Borrar" onClick={handleBulkDelete} color="hover:text-red-500 hover:bg-red-500/10" />
                    </div>

                    <div className="h-8 w-px bg-white/10 mx-2"></div>

                    <button
                        onClick={deselectAll}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            )}

            {/* --- CONTROLS BOX --- */}
            <div className="bg-[#0A0A0A] border border-white/5 p-6 md:p-8 rounded-[48px] space-y-8 sticky top-6 z-40 backdrop-blur-xl shadow-2xl">
                <div className="flex flex-col xl:flex-row gap-8 items-center justify-between">
                    {/* Tabs Navigation */}
                    <div className="flex p-1.5 bg-black/40 rounded-3xl border border-white/5 w-full xl:w-auto overflow-x-auto no-scrollbar">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`group flex items-center gap-4 px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-black shadow-2xl' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            >
                                <tab.icon size={16} className={`${activeTab === tab.id ? 'text-black' : 'text-violet-500 group-hover:scale-110'} transition-all`} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Search & Filters Group */}
                    <div className="flex flex-col md:flex-row items-center gap-6 w-full xl:w-auto">
                        <div className="relative w-full md:w-[350px] group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-violet-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Filtrar por nombre o etiqueta..."
                                className="w-full bg-black border border-white/5 rounded-[24px] py-5 pl-16 pr-6 text-xs font-black text-white placeholder:text-gray-800 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all shadow-inner"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-[24px] border border-white/5 w-full md:w-auto overflow-x-auto no-scrollbar">
                            {FILTERS.map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setActiveFilter(filter.id)}
                                    className={`px-6 py-3 rounded-[18px] text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === filter.id ? 'bg-violet-500 text-white shadow-xl shadow-violet-500/20' : 'text-gray-500 hover:text-white'}`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- GRID DISPLAY --- */}
            {loading && items.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="aspect-square rounded-[40px] bg-[#0A0A0A] border border-white/5 animate-pulse"></div>
                    ))}
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 bg-[#0A0A0A] border border-white/5 rounded-[60px] text-center space-y-8 animate-in zoom-in-95 duration-700">
                    <div className="w-32 h-32 bg-violet-500/5 rounded-full flex items-center justify-center border border-violet-500/10 group">
                        <Search className="text-gray-800 group-hover:text-violet-500 transition-colors group-hover:scale-110 duration-500" size={48} />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Resultados Vacíos</h3>
                        <p className="text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em] max-w-sm mx-auto">
                            No logramos indexar items con esos criterios en esta zona del almacén.
                        </p>
                    </div>
                    <button
                        onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
                        className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all group"
                    >
                        Resetear Parámetros
                        <Zap size={14} className="group-hover:animate-pulse" />
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
                    {filteredItems.map(item => (
                        <DashboardProductCard
                            key={item.id}
                            item={item}
                            isSelected={selectedIds.has(item.id)}
                            onToggleSelection={toggleSelection}
                            onEdit={(item) => navigate(`/dashboard/edit-beat/${item.id}`)}
                            onDelete={(item) => {
                                if (window.confirm('¿Confirmar destrucción de este activo digital?')) {
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

// Subcomponente para botones de acciones en masa
function BulkActionButton({ icon: Icon, label, onClick, color }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 border border-transparent transition-all active:scale-95 group ${color}`}
        >
            <Icon size={18} className="group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline">{label}</span>
        </button>
    );
}
