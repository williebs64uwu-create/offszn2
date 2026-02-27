import React, { useEffect, useState, useMemo, useRef } from 'react';
// import { supabase } from '../../supabase/client';
import { apiClient } from '../../api/client';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import {
  BiHeart,
  BiDisc,
  BiMusic,
  BiSliderAlt,
  BiSearch,
  BiGridAlt,
  BiListUl,
  BiPlay,
  BiPause,
  BiCart,
  BiTrash,
  BiDownload,
  BiUser,
  BiCalendar,
  BiTachometer
} from 'react-icons/bi';
import { FaHeartBroken } from 'react-icons/fa';

export default function Favorites() {
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtros y Ordenamiento
  const [filterType, setFilterType] = useState('all'); // all, beat, drumkit, preset, sample
  const [sortType, setSortType] = useState('recent'); // recent, oldest, price-high, price-low
  const [viewMode, setViewMode] = useState('grid'); // grid | list

  // Audio Player State
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(new Audio());

  // --- CARGA DE DATOS ---
  useEffect(() => {
    fetchFavorites();

    // Cleanup audio al desmontar
    return () => {
      audioRef.current.pause();
      audioRef.current.src = '';
    };
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/social/favorites');
      const data = response.data;

      // Aplanar la estructura para facilitar el uso
      const formattedFavorites = data.map(item => ({
        ...item,
        liked_at: item.created_at, // O usar la fecha real del like si estuviera disponible
        producer_name: item.artist_users?.nickname || item.producer_nickname || 'Productor'
      }));

      setFavorites(formattedFavorites);

    } catch (error) {
      console.error('Error cargando favoritos:', error);
      toast.error('No se pudieron cargar tus favoritos');
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE ELIMINAR ---
  const handleRemoveFavorite = async (productId, productName) => {
    if (!window.confirm(`¿Deseas quitar "${productName}" de tus favoritos?`)) return;

    try {
      await apiClient.post(`/social/favorites/${productId}/toggle`);

      // Actualizar estado local (Optimistic UI update)
      setFavorites(prev => prev.filter(p => p.id !== productId));
      toast.success('Eliminado de favoritos');

    } catch (error) {
      console.error('Error eliminando favorito:', error);
      toast.error('No se pudo eliminar de favoritos.');
    }
  };

  // --- AUDIO PLAYER ---
  const handlePlay = (track) => {
    const url = track.download_url_mp3; // O track.preview_url
    if (!url) return;

    if (playingId === track.id) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      audioRef.current.src = url;
      audioRef.current.play().catch(e => console.error("Audio Play Error", e));
      setPlayingId(track.id);
      audioRef.current.onended = () => setPlayingId(null);
    }
  };

  // --- FILTRADO Y ORDENAMIENTO (Memoized) ---
  const filteredProducts = useMemo(() => {
    let result = [...favorites];

    // 1. Búsqueda
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.producer_name.toLowerCase().includes(q)
      );
    }

    // 2. Filtro por Tipo
    if (filterType !== 'all') {
      result = result.filter(p => p.product_type === filterType);
    }

    // 3. Ordenamiento
    switch (sortType) {
      case 'recent':
        result.sort((a, b) => new Date(b.liked_at) - new Date(a.liked_at));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.liked_at) - new Date(b.liked_at));
        break;
      case 'price-high':
        result.sort((a, b) => (b.price_basic || 0) - (a.price_basic || 0));
        break;
      case 'price-low':
        result.sort((a, b) => (a.price_basic || 0) - (b.price_basic || 0));
        break;
      default: break;
    }

    return result;
  }, [favorites, searchQuery, filterType, sortType]);

  // --- ESTADÍSTICAS ---
  const stats = {
    total: favorites.length,
    drumkits: favorites.filter(f => f.product_type === 'drumkit').length,
    beats: favorites.filter(f => f.product_type === 'beat').length,
    presets: favorites.filter(f => f.product_type === 'preset').length
  };

  return (
    <div className="w-full min-h-screen relative">
      {/* Background Glow Effect */}
      <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.08),transparent_70%)] -z-10 pointer-events-none"></div>

      {/* --- HEADER --- */}
      <div className="relative mb-8 p-8 rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent overflow-hidden">
        <div className="absolute top-1/2 -right-10 -translate-y-1/2 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-red-300 mb-2">
              Mis Favoritos ❤️
            </h1>
            <p className="text-[#999]">Tu colección personal de sonidos guardados.</p>
          </div>
          <Link to="/explorar" className="px-6 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.1)] text-white rounded-xl font-semibold transition-all flex items-center gap-2">
            <BiSearch /> Explorar Más
          </Link>
        </div>
      </div>

      {/* --- STATS ROW --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<BiHeart />} label="Total" value={loading ? '...' : stats.total} color="text-red-500" />
        <StatCard icon={<BiDisc />} label="Drum Kits" value={loading ? '...' : stats.drumkits} color="text-purple-500" />
        <StatCard icon={<BiMusic />} label="Beats" value={loading ? '...' : stats.beats} color="text-blue-500" />
        <StatCard icon={<BiSliderAlt />} label="Presets" value={loading ? '...' : stats.presets} color="text-emerald-500" />
      </div>

      {/* --- FILTER BAR --- */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 bg-[rgba(255,255,255,0.02)] border border-[#222] p-4 rounded-xl">

        {/* Search */}
        <div className="relative w-full md:w-auto md:flex-1 max-w-md">
          <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
          <input
            type="text"
            placeholder="Buscar en favoritos..."
            className="w-full bg-[#111] border border-[#333] rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:border-red-500/50 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <select
            className="bg-[#111] border border-[#333] text-[#ccc] text-sm rounded-lg px-3 py-2 outline-none focus:border-red-500/50"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Todos los Tipos</option>
            <option value="beat">Beats</option>
            <option value="drumkit">Drum Kits</option>
            <option value="preset">Presets</option>
          </select>

          <select
            className="bg-[#111] border border-[#333] text-[#ccc] text-sm rounded-lg px-3 py-2 outline-none focus:border-red-500/50"
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
          >
            <option value="recent">Más Recientes</option>
            <option value="oldest">Más Antiguos</option>
            <option value="price-high">Precio: Alto a Bajo</option>
            <option value="price-low">Precio: Bajo a Alto</option>
          </select>

          <div className="flex bg-[#111] rounded-lg p-1 border border-[#333]">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#333] text-white' : 'text-[#666] hover:text-white'}`}>
              <BiGridAlt />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#333] text-white' : 'text-[#666] hover:text-white'}`}>
              <BiListUl />
            </button>
          </div>
        </div>
      </div>

      {/* --- CONTENT GRID --- */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-[300px] bg-[#111] rounded-xl animate-pulse border border-[#222]"></div>)}
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className={`
          ${viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6'
            : 'flex flex-col gap-3'
          }
        `}>
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              viewMode={viewMode}
              isPlaying={playingId === product.id}
              onTogglePlay={() => handlePlay(product)}
              onRemove={() => handleRemoveFavorite(product.id, product.name)}
            />
          ))}
        </div>
      )}

    </div>
  );
}

// --- COMPONENTES AUXILIARES ---

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-[rgba(255,255,255,0.02)] border border-[#222] p-4 rounded-xl flex items-center gap-4 hover:bg-[rgba(255,255,255,0.04)] transition-all">
      <div className={`p-3 rounded-lg bg-[#111] ${color} text-xl`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-[#666] uppercase font-semibold">{label}</div>
      </div>
    </div>
  );
}

function ProductCard({ product, viewMode, isPlaying, onTogglePlay, onRemove }) {
  const isGrid = viewMode === 'grid';
  const imgUrl = product.image_url || 'https://via.placeholder.com/400x400/111/333?text=No+Cover';
  const price = product.is_free ? 'GRATIS' : `$${product.price_basic}`;

  if (isGrid) {
    return (
      <div className="group bg-[#0A0A0A] border border-[#222] rounded-xl overflow-hidden hover:border-red-500/50 hover:shadow-[0_4px_20px_rgba(239,68,68,0.1)] transition-all relative">
        {/* Image & Play */}
        <div className="relative aspect-square overflow-hidden bg-[#111]">
          <img src={imgUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <button onClick={onTogglePlay} className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform">
              {isPlaying ? <BiPause size={24} /> : <BiPlay size={24} className="ml-1" />}
            </button>
          </div>
          <div className="absolute top-2 left-2 bg-red-500/20 text-red-500 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 backdrop-blur-sm">
            <BiHeart /> FAVORITO
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-white font-bold truncate">{product.name}</h3>
          <p className="text-[#666] text-sm flex items-center gap-1 mb-3">
            <BiUser /> {product.producer_name}
          </p>

          <div className="flex justify-between items-center text-xs text-[#888] mb-4">
            <span className="flex items-center gap-1"><BiTachometer /> {product.bpm || 'N/A'} BPM</span>
            <span className="flex items-center gap-1"><BiCalendar /> {new Date(product.liked_at).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-[#222]">
            <span className={`font-bold text-lg flex-1 ${product.is_free ? 'text-green-500' : 'text-white'}`}>{price}</span>

            <button className="w-8 h-8 flex items-center justify-center rounded bg-[#1A1A1A] text-[#888] hover:text-white hover:bg-[#333]" title="Añadir al carrito">
              <BiCart />
            </button>
            <button onClick={onRemove} className="w-8 h-8 flex items-center justify-center rounded bg-[#1A1A1A] text-red-500 hover:bg-red-500/20" title="Eliminar">
              <BiTrash />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="flex items-center gap-4 p-4 bg-[#0A0A0A] border border-[#222] rounded-xl hover:bg-[#111] transition-colors group">
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#222] relative shrink-0">
        <img src={imgUrl} alt={product.name} className="w-full h-full object-cover" />
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button onClick={onTogglePlay} className="text-white hover:scale-110 transition-transform">
            {isPlaying ? <BiPause size={24} /> : <BiPlay size={24} />}
          </button>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-white font-bold truncate">{product.name}</h3>
        <p className="text-[#666] text-sm">{product.producer_name}</p>
      </div>

      <div className="hidden md:flex gap-4 text-xs text-[#666]">
        <span className="bg-[#1a1a1a] px-2 py-1 rounded border border-[#333] uppercase">{product.product_type}</span>
        <span className="flex items-center gap-1"><BiTachometer /> {product.bpm || '-'}</span>
      </div>

      <div className={`font-bold ${product.is_free ? 'text-green-500' : 'text-white'}`}>{price}</div>

      <div className="flex gap-2">
        <button className="p-2 text-[#888] hover:text-white transition-colors"><BiDownload /></button>
        <button className="p-2 text-[#888] hover:text-white transition-colors"><BiCart /></button>
        <button onClick={onRemove} className="p-2 text-red-500/70 hover:text-red-500 transition-colors"><BiTrash /></button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[#222] rounded-2xl bg-[rgba(255,255,255,0.01)]">
      <FaHeartBroken className="text-6xl text-red-500/20 mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">Tu colección está vacía</h3>
      <p className="text-[#666] max-w-sm text-center mb-6">Aún no has guardado nada. Explora el mercado y dale al corazón en los beats que te definan.</p>
      <Link to="/explorar" className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">
        Explorar el Mercado
      </Link>
    </div>
  );
}