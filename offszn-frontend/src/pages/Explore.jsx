import React, { useEffect, useState, useMemo, useRef } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { useSearchStore } from '../store/searchStore';
import { apiClient } from '../api/client';
import { useCurrencyStore } from '../store/currencyStore';
import ProductCard from '../components/ProductCard';
import { Play, TrendingUp, Sparkles, ChevronLeft, ChevronRight, Info, Award, Music } from 'lucide-react';
import { Link } from 'react-router-dom';

const CATEGORIES = ['Todo', 'Beats', 'Drum Kits', 'Loops & Samples', 'Presets', 'Plantillas'];

const Explore = () => {
  const [products, setProducts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todo');
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const { playTrack, currentTrack, isPlaying, setPlaylist } = usePlayerStore();
  const { results, query, isSearching } = useSearchStore();
  const { formatPrice } = useCurrencyStore();

  // Refs for horizontal scrolling
  const recommendedRef = useRef(null);
  const drumKitsRef = useRef(null);
  const presetsRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, leadRes] = await Promise.all([
          apiClient.get('/products'),
          apiClient.get('/leaderboard')
        ]);

        setProducts(prodRes.data);
        setLeaderboard(leadRes.data);

        if (!query) {
          setPlaylist(prodRes.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (results.length > 0 || query !== '') {
      setProducts(results);
      setPlaylist(results);
      setLoading(false);
    } else {
      fetchData();
    }
  }, [results, query, setPlaylist]);

  // Hero Carousel Auto-slide
  useEffect(() => {
    if (products.length > 0 && !query) {
      const timer = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % Math.min(products.length, 5));
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [products, query]);

  // Grouping & Filtering
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'Todo') return products;
    const map = { 'Beats': 'beat', 'Drum Kits': 'drumkit', 'Loops & Samples': 'loopkit', 'Presets': 'preset', 'Plantillas': 'plantilla' };
    return products.filter(p => p.product_type?.toLowerCase() === map[activeCategory]);
  }, [products, activeCategory]);

  const trending = useMemo(() => {
    return [...filteredProducts]
      .sort((a, b) => ((b.plays_count || 0) * 2 + (b.views_count || 0)) - ((a.plays_count || 0) * 2 + (a.views_count || 0)))
      .slice(0, 5);
  }, [filteredProducts]);

  const fresh = useMemo(() => {
    return [...filteredProducts]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .filter(p => !trending.find(t => t.id === p.id))
      .slice(0, 5);
  }, [filteredProducts, trending]);

  const featuredProducts = useMemo(() => products.slice(0, 5), [products]);
  const currentHero = featuredProducts[currentHeroIndex];

  const recommended = useMemo(() => filteredProducts.slice(0, 15), [filteredProducts]);
  const drumKits = useMemo(() => products.filter(p => p.product_type === 'drumkit').slice(0, 15), [products]);
  const vocalPresets = useMemo(() => products.filter(p => p.product_type === 'preset' || p.name.toLowerCase().includes('preset')).slice(0, 15), [products]);

  const handlePlay = (product) => {
    if (currentTrack?.id === product.id) {
      usePlayerStore.getState().togglePlay();
    } else {
      playTrack(product);
    }
  };

  const scroll = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -800 : 800;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading || isSearching) return <ExploreSkeleton />;

  return (
    <div className="pb-32 pt-6 min-h-screen bg-black">
      {/* Hero Section (Carousel) */}
      <div className="max-w-[1400px] mx-auto px-6 mb-8">
        <div className="relative h-[480px] rounded-[40px] bg-[#0a0a0a] border border-white/5 flex items-center p-8 md:p-20 overflow-hidden shadow-2xl">
          {currentHero && (
            <div className="w-full h-full flex items-center gap-12 relative animate-fadeIn">
              <div className="relative z-10 max-w-2xl flex-1">
                <span className="bg-violet-600 border border-violet-400/30 text-white text-[10px] font-black tracking-[0.3em] uppercase px-5 py-2 rounded-full mb-8 inline-block shadow-[0_5px_15px_rgba(139,92,246,0.3)]">
                  {query ? `Búsqueda: ${query}` : 'Lo más destacado de hoy'}
                </span>
                <h1 className="text-5xl md:text-[5rem] font-black text-white mb-6 tracking-tighter uppercase leading-[0.85] drop-shadow-2xl">
                  {currentHero.name}
                </h1>
                <p className="text-zinc-400 mb-10 max-w-md text-xl font-semibold leading-relaxed">
                  De <span className="text-white">@{currentHero.producer_nickname || 'OFFSZN'}</span>.
                  Potencia tus producciones con este sonido legendario.
                </p>
                <div className="flex flex-wrap gap-5">
                  <button
                    onClick={() => handlePlay(currentHero)}
                    className="px-10 py-5 bg-white text-black rounded-full font-black uppercase text-sm tracking-widest hover:bg-violet-500 hover:text-white transition-all flex items-center gap-3 shadow-2xl active:scale-95 translate-y-0 hover:-translate-y-1"
                  >
                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                      <Play size={14} fill="currentColor" className="ml-1 text-white" />
                    </div>
                    Escuchar Ahora
                  </button>
                  <Link
                    to={`/product/${currentHero.id}`}
                    className="px-10 py-5 bg-[#111] text-white border border-white/10 rounded-full font-black uppercase text-sm tracking-widest hover:bg-white/10 transition-all flex items-center gap-3 active:scale-95 translate-y-0 hover:-translate-y-1"
                  >
                    <Info size={18} /> Detalles
                  </Link>
                </div>
              </div>

              {/* Hero Indicators */}
              <div className="absolute bottom-4 left-0 flex gap-3 z-20">
                {featuredProducts.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentHeroIndex(i)}
                    className={`h-2 rounded-full transition-all duration-500 ${i === currentHeroIndex ? 'w-12 bg-violet-600' : 'w-3 bg-white/20 hover:bg-white/40'}`}
                  />
                ))}
              </div>

              {/* Hero Image Container */}
              <div className="hidden lg:flex flex-1 justify-center relative">
                <div className="absolute inset-0 bg-violet-600/20 blur-[150px] rounded-full" />
                <div className="relative group">
                  <img
                    src={currentHero.image_url}
                    alt={currentHero.name}
                    className="w-[380px] h-[380px] object-cover rounded-[32px] shadow-[0_40px_80px_rgba(0,0,0,1)] border border-white/10 group-hover:scale-105 transition-transform duration-1000 ease-out"
                  />
                  <div className="absolute -bottom-6 -right-6 bg-gradient-to-tr from-violet-600 to-fuchsia-600 p-6 rounded-[24px] shadow-2xl animate-float border border-white/20">
                    <Sparkles className="text-white" size={32} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Categorías */}
      <div className="max-w-[1400px] mx-auto px-6 mb-12 flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest transition-all border ${activeCategory === cat ? 'bg-white text-black border-white shadow-[0_10px_20px_rgba(255,255,255,0.1)]' : 'bg-[#111] text-zinc-500 border-white/5 hover:border-white/20 hover:text-white'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Trending & Fresh Section */}
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
        <ListView title="Tendencias" subtitle="Lo más reproducido" items={trending} onPlay={handlePlay} currentTrack={currentTrack} isPlaying={isPlaying} />
        <ListView title="Super Fresh" subtitle="Nuevos en la tienda" items={fresh} onPlay={handlePlay} currentTrack={currentTrack} isPlaying={isPlaying} />
      </div>

      {/* Top Productores Section */}
      {leaderboard.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-6 mb-24 py-20 rounded-[50px] bg-gradient-to-b from-[#0a0a0a] to-black border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/10 blur-[150px] pointer-events-none" />
          <div className="flex flex-col items-center mb-16 text-center relative z-10">
            <span className="text-violet-500 font-extrabold uppercase tracking-[.5em] text-[11px] mb-5">Hall of Fame</span>
            <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter leading-tight">Top Productores<br />del Mes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-10 relative z-10">
            {leaderboard.slice(0, 5).map((p, i) => (
              <Link key={p.id} to={`/user/${p.nickname}`} className="group flex flex-col items-center p-8 rounded-[35px] hover:bg-white/[0.03] transition-all duration-500 border border-transparent hover:border-white/5">
                <div className="relative mb-8">
                  <div className="w-[120px] h-[120px] rounded-[35px] overflow-hidden border-2 border-white/10 group-hover:border-violet-500 transition-all duration-500 shadow-2xl transform group-hover:rotate-6">
                    <img src={p.avatar_url} alt={p.nickname} className="w-full h-full object-cover" />
                  </div>
                  <div className={`absolute -top-4 -right-4 w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-2xl border border-white/10 ${i === 0 ? 'bg-yellow-500' : 'bg-[#181818]'}`}>
                    {i + 1}
                  </div>
                </div>
                <h4 className="text-lg text-white font-black uppercase tracking-tight mb-2 group-hover:text-violet-400 transition-colors">{p.nickname}</h4>
                <div className="flex items-center gap-2 text-[11px] font-black text-zinc-500 uppercase">
                  <Award size={14} className={i === 0 ? "text-yellow-500" : "text-violet-500"} /> {p.score} pts
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Shelves */}
      <Shelf title="Recomendados para ti" items={recommended} formatPrice={formatPrice} onPlay={handlePlay} currentTrack={currentTrack} isPlaying={isPlaying} shelfRef={recommendedRef} onScroll={(d) => scroll(recommendedRef, d)} />

      {drumKits.length > 0 && (
        <Shelf title="Librerías y Sonidos" items={drumKits} formatPrice={formatPrice} onPlay={handlePlay} currentTrack={currentTrack} isPlaying={isPlaying} shelfRef={drumKitsRef} onScroll={(d) => scroll(drumKitsRef, d)} />
      )}

      {vocalPresets.length > 0 && (
        <Shelf title="Presets de Voces" items={vocalPresets} formatPrice={formatPrice} onPlay={handlePlay} currentTrack={currentTrack} isPlaying={isPlaying} shelfRef={presetsRef} onScroll={(d) => scroll(presetsRef, d)} />
      )}
    </div>
  );
};

const ListView = ({ title, subtitle, items, onPlay, currentTrack, isPlaying }) => (
  <div className="space-y-8">
    <div className="flex items-center justify-between border-b border-white/5 pb-4">
      <div>
        <h2 className="text-3xl font-black text-white uppercase flex items-center gap-3 tracking-tighter">
          <TrendingUp className="text-violet-600" size={30} /> {title}
        </h2>
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[.3em] mt-1">{subtitle}</p>
      </div>
      <Link to="/products" className="text-[10px] font-black text-violet-500 uppercase hover:text-white transition-colors">Ver Todo</Link>
    </div>
    <div className="space-y-3">
      {items.map((item, i) => {
        const isCurrent = currentTrack?.id === item.id;
        return (
          <div key={item.id} className={`group flex items-center gap-5 p-4 rounded-[28px] transition-all duration-300 border border-transparent ${isCurrent ? 'bg-violet-600/10 border-violet-500/20 shadow-2xl' : 'hover:bg-white/[0.04] hover:border-white/5'}`}>
            <span className="w-6 text-sm font-black text-zinc-900 group-hover:text-violet-600 transition-colors">0{i + 1}</span>
            <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/5 relative bg-zinc-900">
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className={`absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 ${isCurrent ? 'opacity-100 backdrop-blur-[2px]' : ''}`}>
                <button onClick={() => onPlay(item)} className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white transform hover:scale-110 active:scale-90 transition-all shadow-xl">
                  {isCurrent && isPlaying ? <i className="bi bi-pause-fill text-xl"></i> : <i className="bi bi-play-fill text-xl ml-1"></i>}
                </button>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-black text-white truncate uppercase tracking-tight group-hover:text-violet-400 transition-colors">{item.name}</h4>
              <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wide">@{item.producer_nickname || 'OFFSZN'}</p>
            </div>

            {/* Fake Waveform for Aesthetic */}
            <div className="hidden sm:flex items-center gap-[2px] h-8 bg-black/40 px-4 rounded-xl border border-white/5">
              {[...Array(15)].map((_, j) => (
                <div
                  key={j}
                  className={`w-[2px] rounded-full transition-all duration-500 ${isCurrent && isPlaying ? 'bg-violet-500 animate-pulse' : 'bg-zinc-800'}`}
                  style={{ height: `${Math.random() * 80 + 20}%`, animationDelay: `${j * 0.1}s` }}
                ></div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const Shelf = ({ title, items, formatPrice, onPlay, currentTrack, isPlaying, shelfRef, onScroll }) => (
  <div className="max-w-[1400px] mx-auto px-6 mb-24 overflow-hidden relative">
    <div className="flex justify-between items-end mb-10 relative z-10">
      <div>
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">{title}</h2>
        <div className="h-1.5 w-16 bg-gradient-to-r from-violet-600 to-fuchsia-600 mt-4 rounded-full shadow-[0_5px_15px_rgba(139,92,246,0.4)]"></div>
      </div>
      <div className="flex gap-3">
        <button onClick={() => onScroll('left')} className="w-14 h-14 rounded-2xl bg-[#0a0a0a] border border-white/10 text-zinc-500 hover:text-white hover:border-white/20 transition-all active:scale-90 flex items-center justify-center shadow-xl"><ChevronLeft size={24} /></button>
        <button onClick={() => onScroll('right')} className="w-14 h-14 rounded-2xl bg-[#0a0a0a] border border-white/10 text-zinc-500 hover:text-white hover:border-white/20 transition-all active:scale-90 flex items-center justify-center shadow-xl"><ChevronRight size={24} /></button>
      </div>
    </div>
    <div
      ref={shelfRef}
      className="flex gap-8 overflow-x-auto pb-10 scrollbar-hide snap-x px-2"
    >
      {items.map(product => (
        <div key={product.id} className="shrink-0 w-[260px] snap-start hover:z-50">
          <ProductCard
            product={product}
            isPlaying={currentTrack?.id === product.id && isPlaying}
            onPlay={() => onPlay(product)}
            formatPrice={formatPrice}
          />
        </div>
      ))}
    </div>
  </div>
);

const ExploreSkeleton = () => (
  <div className="pb-32 pt-10 min-h-screen bg-black animate-pulse">
    <div className="max-w-[1400px] mx-auto px-6 mb-12">
      <div className="h-[480px] rounded-[40px] bg-zinc-900/50 border border-white/5"></div>
    </div>
    <div className="max-w-[1400px] mx-auto px-6 space-y-24">
      <div className="grid grid-cols-2 gap-16">
        <div className="h-96 bg-zinc-900/30 rounded-[30px]"></div>
        <div className="h-96 bg-zinc-900/30 rounded-[30px]"></div>
      </div>
    </div>
  </div>
);

export default Explore;
