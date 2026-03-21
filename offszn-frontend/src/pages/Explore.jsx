import React, { useEffect, useState, useMemo, useRef } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { useSearchStore } from '../store/searchStore';
import { apiClient } from '../api/client';
import { useCurrencyStore } from '../store/currencyStore';
import ProductCard from '../components/ProductCard';
import SecureImage from '../components/ui/SecureImage';
import ExploreListItem from '../components/ExploreListItem';
import { Play, TrendingUp, Sparkles, ChevronLeft, ChevronRight, Info, Award, Music, ArrowRight } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import gsap from 'gsap';

const CATEGORIES = ['Todo', 'Beats', 'Drum Kits', 'Loops & Samples', 'Presets', 'One-Shots', 'Plantillas', 'Gratis'];

const Explore = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todo');
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const { playTrack, currentTrack, isPlaying, setPlaylist } = usePlayerStore();
  const { results, query, isSearching } = useSearchStore();
  const { formatPrice } = useCurrencyStore();

  const heroRef = useRef(null);
  const heroContentRef = useRef(null);
  const heroImageRef = useRef(null);

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

  // GSAP Hero Transition
  useEffect(() => {
    if (!loading && products.length > 0 && heroContentRef.current) {
      const tl = gsap.timeline();
      tl.fromTo(heroContentRef.current,
        { opacity: 0, x: -50 },
        { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" }
      );
      tl.fromTo(heroImageRef.current,
        { opacity: 0, scale: 0.8, rotate: -5 },
        { opacity: 1, scale: 1, rotate: 0, duration: 1, ease: "elastic.out(1, 0.8)" },
        "-=0.6"
      );
    }
  }, [currentHeroIndex, loading, products.length]);

  // Auto-slide HERO
  useEffect(() => {
    if (products.length > 0 && !query) {
      const timer = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % Math.min(products.length, 5));
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [products, query]);

  // Path-based initial filter (same logic as before)
  useEffect(() => {
    const path = location.pathname;
    const pathMap = {
      '/beats': 'Beats',
      '/drum-kits': 'Drum Kits',
      '/loops': 'Loops & Samples',
      '/presets': 'Presets',
      '/one-shots': 'One-Shots',
      '/gratis': 'Gratis'
    };
    if (pathMap[path]) {
      setActiveCategory(pathMap[path]);
    }
  }, [location.pathname]);

  const activeGenre = useMemo(() => {
    const path = location.pathname;
    const genreMap = {
      '/hip-hop': 'hip-hop',
      '/trap': 'trap',
      '/reggaeton': 'reggaetón',
      '/drill': 'drill',
      '/rnb': 'r&b'
    };
    return genreMap[path] || searchParams.get('genre');
  }, [location.pathname, searchParams]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (activeCategory !== 'Todo') {
      const typeMap = {
        'Beats': 'beat',
        'Drum Kits': 'drumkit',
        'Loops & Samples': 'loopkit',
        'Presets': 'preset',
        'One-Shots': 'oneshot',
        'Plantillas': 'plantilla'
      };

      if (activeCategory === 'Gratis') {
        filtered = filtered.filter(p => p.is_free);
      } else {
        const type = typeMap[activeCategory];
        if (type) filtered = filtered.filter(p => p.product_type?.toLowerCase() === type);
      }
    }
    if (activeGenre) {
      filtered = filtered.filter(p =>
        (p.genre?.toLowerCase() === activeGenre.toLowerCase()) ||
        (p.tags?.some(t => t.toLowerCase() === activeGenre.toLowerCase()))
      );
    }
    return filtered;
  }, [products, activeCategory, activeGenre]);

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
    currentTrack?.id === product.id ? usePlayerStore.getState().togglePlay() : playTrack(product);
  };

  const scroll = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -800 : 800;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading || isSearching) return <ExploreSkeleton />;

  return (
    <div className="pb-32 pt-8 min-h-screen bg-black font-sans selection:bg-primary selection:text-white">

      {/* --- HERO SECTION --- */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 mb-16 overflow-hidden">
        <div
          ref={heroRef}
          className="relative h-[480px] sm:h-[520px] rounded-[40px] bg-[#0a0a0a] border border-white/5 flex items-center px-8 sm:px-16 md:px-24 overflow-hidden group/hero"
        >
          {/* Animated Background Gradients */}
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[140%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[120%] bg-fuchsia-600/5 blur-[100px] rounded-full" />

          {currentHero && (
            <div className="w-full flex flex-col md:flex-row items-center gap-12 relative z-10">
              <div ref={heroContentRef} className="max-w-xl flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                  <Sparkles size={12} /> {query ? `Búsqueda: ${query}` : 'Lo más destacado'}
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 tracking-tighter uppercase leading-[0.95] drop-shadow-2xl">
                  {currentHero.name}
                </h1>
                <p className="text-zinc-400 mb-10 max-w-md text-lg font-medium leading-relaxed">
                  Producido por <span className="text-white font-bold">@{currentHero.producer_nickname || currentHero.users?.nickname || 'OFFSZN'}</span>.
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-10">
                  <button
                    onClick={() => handlePlay(currentHero)}
                    className="group/btn px-8 py-4 bg-white text-black rounded-full font-black uppercase text-xs tracking-widest hover:bg-primary hover:text-white transition-all duration-300 flex items-center gap-3 shadow-[0_15px_30px_rgba(255,255,255,0.1)] active:scale-95"
                  >
                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center group-hover/btn:bg-white transition-colors">
                      <Play size={14} fill="currentColor" className="ml-1 text-white group-hover/btn:text-primary" />
                    </div>
                    Escuchar Ahora
                  </button>
                  <Link
                    to={`/${currentHero.product_type || 'beat'}/${currentHero.public_slug || currentHero.id}`}
                    className="px-8 py-4 bg-white/5 backdrop-blur-md text-white border border-white/10 rounded-full font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all duration-300 active:scale-95 flex items-center gap-2"
                  >
                    Detalles <ArrowRight size={16} />
                  </Link>
                </div>

                {/* Indicators */}
                <div className="flex justify-center md:justify-start gap-2.5">
                  {featuredProducts.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentHeroIndex(i)}
                      className={`h-1.5 rounded-full transition-all duration-500 ${i === currentHeroIndex ? 'w-10 bg-primary' : 'w-4 bg-white/10 hover:bg-white/30'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Hero Image */}
              <div ref={heroImageRef} className="hidden md:block flex-1 max-w-[380px] perspective-1000">
                <div className="relative group/img cursor-pointer">
                  <SecureImage
                    src={currentHero.image_url}
                    alt={currentHero.name}
                    className="w-full aspect-square object-cover rounded-[40px] shadow-[0_50px_100px_rgba(0,0,0,0.8)] border border-white/10 group-hover/img:scale-[1.02] transition-transform duration-1000 ease-out"
                  />
                  <div className="absolute -bottom-6 -right-6 bg-gradient-to-br from-primary to-fuchsia-600 p-6 rounded-[28px] shadow-2xl border border-white/20 animate-float">
                    <Music className="text-white" size={32} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- CATEGORIES --- */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 mb-16 flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-7 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap active:scale-95 ${activeCategory === cat ? 'bg-white text-black border-white shadow-[0_10px_20px_rgba(255,255,255,0.1)]' : 'bg-[#0a0a0a] text-zinc-500 border-white/5 hover:border-white/20 hover:text-white'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* --- TRENDING & FRESH SECTION --- */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-32">
        <ListView title="Tendencias" subtitle="Lo más caliente de la semana" items={trending} icon={<TrendingUp className="text-primary" size={28} />} />
        <ListView title="Super Fresh" subtitle="Recién salido del horno" items={fresh} icon={<Sparkles className="text-primary" size={28} />} />
      </div>

      {/* --- HALL OF FAME (Top Productores) --- */}
      {leaderboard.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-6 mb-32 py-24 rounded-[60px] bg-gradient-to-b from-[#070707] to-black border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-primary/10 blur-[150px] pointer-events-none" />
          <div className="flex flex-col items-center mb-20 text-center relative z-10">
            <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-4">Muro de la Fama</span>
            <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none italic">Top Productores</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-12 relative z-10 px-10">
            {leaderboard.slice(0, 5).map((p, i) => (
              <Link key={p.id} to={`/@${p.nickname}`} className="group flex flex-col items-center">
                <div className="relative mb-8 transform transition-all duration-500 group-hover:scale-105 group-hover:-rotate-3">
                  <div className="w-32 h-32 rounded-[40px] overflow-hidden border-2 border-white/10 group-hover:border-primary transition-all duration-500 shadow-2xl">
                    <SecureImage src={p.avatar_url} alt={p.nickname} className="w-full h-full object-cover" />
                  </div>
                  <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-2xl border border-white/10 ${i === 0 ? 'bg-yellow-500' : 'bg-[#121212]'}`}>
                    {i + 1}
                  </div>
                </div>
                <h4 className="text-lg text-white font-black uppercase tracking-tight mb-1 group-hover:text-primary transition-colors">{p.nickname}</h4>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  <Award size={14} className={i === 0 ? "text-yellow-500" : "text-primary"} /> {p.score} pts
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* --- SHELVES --- */}
      <Shelf title="Recomendados para ti" items={recommended} shelfRef={recommendedRef} onScroll={(d) => scroll(recommendedRef, d)} />

      {drumKits.length > 0 && (
        <Shelf title="Librerías y Sonidos" items={drumKits} shelfRef={drumKitsRef} onScroll={(d) => scroll(drumKitsRef, d)} />
      )}

      {vocalPresets.length > 0 && (
        <Shelf title="Presets de Voces" items={vocalPresets} shelfRef={presetsRef} onScroll={(d) => scroll(presetsRef, d)} isSocial />
      )}

    </div>
  );
};

const ListView = ({ title, subtitle, items, icon }) => (
  <div className="flex flex-col gap-8">
    <div className="flex items-end justify-between border-b border-white/5 pb-6">
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center shadow-inner">
          {icon}
        </div>
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-1">{title}</h2>
          <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">{subtitle}</p>
        </div>
      </div>
      <Link to="/products" className="group flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors pb-1">
        Explorar <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <ExploreListItem key={item.id} product={item} index={i + 1} />
      ))}
    </div>
  </div>
);

const Shelf = ({ title, items, shelfRef, onScroll, isSocial }) => (
  <div className="max-w-[1400px] mx-auto px-6 mb-32 overflow-hidden items-end relative">
    <div className="flex justify-between items-end mb-12 relative z-10">
      <div>
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none italic">{title}</h2>
        <div className="h-1.5 w-16 bg-primary mt-4 rounded-full shadow-[0_5px_15px_rgba(139,92,246,0.3)]"></div>
      </div>
      <div className="flex gap-3">
        <button onClick={() => onScroll('left')} className="w-14 h-14 rounded-[20px] bg-[#0a0a0a] border border-white/10 text-zinc-500 hover:text-white hover:border-primary hover:bg-primary/5 transition-all duration-300 active:scale-90 flex items-center justify-center shadow-2xl"><ChevronLeft size={24} /></button>
        <button onClick={() => onScroll('right')} className="w-14 h-14 rounded-[20px] bg-[#0a0a0a] border border-white/10 text-zinc-500 hover:text-white hover:border-primary hover:bg-primary/5 transition-all duration-300 active:scale-90 flex items-center justify-center shadow-2xl"><ChevronRight size={24} /></button>
      </div>
    </div>
    <div
      ref={shelfRef}
      className="flex gap-8 overflow-x-auto pb-10 scrollbar-hide px-2 snap-x"
    >
      {items.map(product => (
        <div key={product.id} className={`shrink-0 snap-start transition-transform duration-500 hover:z-50 ${isSocial ? 'w-[580px] md:w-[620px]' : 'w-[260px]'}`}>
          {isSocial ? (
            <SocialPresetCard product={product} />
          ) : (
            <div className="transform transition-all duration-300 hover:scale-[1.03]">
              <ProductCard product={product} />
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

const SocialPresetCard = ({ product }) => (
  <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 flex flex-col sm:flex-row gap-8 transition-all duration-300 hover:bg-[#111] hover:border-white/10 shadow-2xl group">
    <div className="w-full sm:w-44 h-44 shrink-0 rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative">
      <SecureImage src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
    </div>
    <div className="flex-1 flex flex-col justify-between py-2">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
            <SecureImage src={product.users?.avatar_url} alt={product.producer_nickname} className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="text-white text-sm font-black uppercase tracking-tight leading-none mb-1">@{product.producer_nickname || product.users?.nickname}</h4>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Creador</p>
          </div>
        </div>
        <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
      </div>
      <div className="flex items-center justify-between">
        <button className="px-8 py-3.5 bg-white text-black rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all duration-300 shadow-xl">
          Obtener Ahora
        </button>
        <span className="text-zinc-500 font-black text-xs uppercase tracking-widest">
          {product.is_free ? 'GRATIS' : `${product.price} USD`}
        </span>
      </div>
    </div>
  </div>
);

const ExploreSkeleton = () => (
  <div className="pb-32 pt-20 min-h-screen bg-black animate-pulse px-6">
    <div className="max-w-[1400px] mx-auto mb-16">
      <div className="h-[520px] rounded-[40px] bg-zinc-900/50 border border-white/5"></div>
    </div>
    <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
      <div className="h-[600px] bg-zinc-900/30 rounded-[30px]"></div>
      <div className="h-[600px] bg-zinc-900/30 rounded-[30px]"></div>
    </div>
  </div>
);

export default Explore;
