import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiClient } from "../../api/client";
import { useCurrencyStore } from '../../store/currencyStore';
import { usePlayerStore } from '../../store/playerStore';
import { useAuth } from '../../store/authStore';
import { useChatStore } from '../../store/useChatStore';
import { useCartStore } from '../../store/cartStore';
import { BiPlay, BiPause, BiErrorCircle, BiMusic } from 'react-icons/bi';
import { FaInstagram, FaYoutube, FaSpotify, FaDiscord, FaTwitter, FaTiktok } from 'react-icons/fa';
import { CheckCircle2, Heart, Share2, Globe, Search, Download, MessageSquare, UserPlus, Music2, Play, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [filter, setFilter] = useState('popular');

  const { formatPrice } = useCurrencyStore();
  const { playTrack, currentTrack, isPlaying, setPlaylist } = usePlayerStore();
  const { user: currentUser } = useAuth();
  const { startNewChat } = useChatStore();

  const handleMessageClick = async () => {
    if (!currentUser) {
      toast.error("Inicia sesión para enviar mensajes");
      return;
    }
    await startNewChat(profile, currentUser);
    navigate('/mensajes');
  };

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);

        const userRes = await apiClient.get(`/users/${username}`);
        const user = userRes.data;
        setProfile(user);

        const prodRes = await apiClient.get('/products', { params: { nickname: username } });
        const userProducts = prodRes.data;
        setProducts(userProducts || []);
        setPlaylist(userProducts || []);

      } catch (err) {
        console.error(err);
        setError("No pudimos cargar este perfil. Puede que no exista.");
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfileData();
    }
  }, [username, setPlaylist]);

  // Handle play globally
  const handlePlay = (product) => {
    if (currentTrack?.id === product.id) {
      usePlayerStore.getState().togglePlay();
    } else {
      playTrack(product);
    }
  };

  if (loading) return <ProfileSkeleton />;

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-[#888] bg-[#050505]">
      <BiErrorCircle size={48} className="mb-4 text-red-500/50" />
      <h2 className="text-xl font-bold text-white">Ops, algo salió mal</h2>
      <p>{error}</p>
      <Link to="/explorar" className="mt-6 text-violet-500 hover:underline">Volver a explorar</Link>
    </div>
  );

  // Derived Data
  const trendingProducts = products.slice(0, 5); // Take top 5 for trending
  const filteredProducts = products.filter(p => {
    if (filter === 'popular' || filter === 'all') return true;
    return p.product_type?.toLowerCase().includes(filter);
  });

  // Theme color for global background effect (Fallback to an orange matching screenshot)
  const themeColor = profile?.theme_color || '#c25816';

  return (
    <div className="w-full min-h-screen font-sans selection:bg-violet-500/30 pb-32">

      {/* GLOBAL STYLE INJECTION FOR THEME BACKGROUND OVERRIDE */}
      <style>
        {`
          body {
             background: radial-gradient(120% 60% at 50% 0%, ${themeColor}60 0%, #050505 60%, #050505 100%) !important;
             background-color: #050505 !important;
             background-attachment: fixed !important;
          }
          footer {
             background: transparent !important;
             border-top: none !important;
          }
        `}
      </style>

      {/* 1. HEADER / BANNER */}
      <header className="w-full pt-16 md:pt-28">
        <div className="max-w-[1400px] mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center md:items-stretch gap-10">

          {/* Avatar (Left) */}
          <div className="w-52 h-52 md:w-[260px] md:h-[260px] rounded-full border-2 border-black/20 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden shrink-0 bg-[#111]">
            <img
              src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.nickname}&background=1a1a1a&color=fff&size=300`}
              alt={profile?.nickname}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details (Right) */}
          <div className="flex-1 flex flex-col justify-end w-full pb-4">

            <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6 w-full text-center md:text-left">

              {/* Info Text */}
              <div className="flex flex-col items-center md:items-start">

                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-md">
                    {profile?.nickname}
                  </h1>
                  {profile?.is_verified && (
                    <div className="text-blue-500 bg-white rounded-full p-0 flex items-center justify-center shrink-0 w-6 h-6 shadow-md mt-1">
                      <CheckCircle2 className="w-6 h-6 fill-blue-500 text-white" />
                    </div>
                  )}
                </div>

                <div className="text-gray-300 text-sm font-medium mb-4 flex gap-2 tracking-wide drop-shadow-sm">
                  <span>{profile?.role || 'Productor Musical'}</span>
                  <span className="text-gray-400 font-bold">•</span>
                </div>

                <div className="text-white text-base font-bold uppercase tracking-widest mb-6 max-w-xl drop-shadow-sm">
                  {profile?.bio || "BEATMAKER DE PERU"}
                </div>

                <div className="flex items-center gap-6 font-bold text-sm mb-12">
                  <span className="text-white drop-shadow-sm flex gap-1.5 items-baseline">
                    <span className="text-lg">{products.length}</span> <span className="font-medium text-gray-200">Productos</span>
                  </span>
                  <span className="text-white drop-shadow-sm flex gap-1.5 items-baseline">
                    <span className="text-lg">0</span> <span className="font-medium text-gray-200">Seguidores</span>
                  </span>
                  <div className="flex items-center gap-3 text-gray-300 ml-4">
                    <SocialLinksSmall socials={profile?.socials} />
                  </div>
                </div>

              </div>

              {/* Follow & Message Buttons */}
              <div className="flex gap-4 shrink-0">
                <button className="px-6 py-2.5 rounded-full border border-white/20 text-white font-bold text-sm bg-black/20 hover:bg-white/10 transition-colors flex items-center gap-2 backdrop-blur-sm shadow-md">
                  <UserPlus className="w-[18px] h-[18px]" /> Seguir
                </button>
                <button
                  onClick={handleMessageClick}
                  className="px-6 py-2.5 rounded-full border border-white/20 text-white font-bold text-sm bg-black/20 hover:bg-white/10 transition-colors flex items-center gap-2 backdrop-blur-sm shadow-md"
                >
                  <MessageSquare className="w-[18px] h-[18px]" /> Mensaje
                </button>
              </div>
            </div>

            {/* Horizontal Tabs */}
            <div className="flex items-center gap-8 border-b border-white/10 mt-2 justify-center md:justify-start pt-2">
              <button
                onClick={() => setActiveTab('products')}
                className={`pb-3 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-colors relative ${activeTab === 'products' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              >
                PRODUCTOS
                {activeTab === 'products' && <div className="absolute -bottom-[1px] left-0 w-full h-[3px] bg-white rounded-t-md shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>}
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`pb-3 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-colors relative ${activeTab === 'services' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              >
                SERVICIOS
                {activeTab === 'services' && <div className="absolute -bottom-[1px] left-0 w-full h-[3px] bg-white rounded-t-md shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>}
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`pb-3 text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-colors relative ${activeTab === 'about' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
              >
                INFO
                {activeTab === 'about' && <div className="absolute -bottom-[1px] left-0 w-full h-[3px] bg-white rounded-t-md shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <div className="max-w-[1400px] mx-auto px-6 mt-12 bg-black/40 backdrop-blur-xl p-8 rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5">

        {activeTab === 'products' && (
          <>
            {/* Trending Grids */}
            {trendingProducts.length > 0 && (
              <div className="mb-16">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white tracking-wide">Trending / Packs</h3>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors">
                      <ChevronLeft className="w-4 h-4 opacity-70" />
                    </button>
                    <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors">
                      <ChevronRight className="w-4 h-4 opacity-70" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                  {trendingProducts.map(p => (
                    <TrendingCard
                      key={p.id}
                      product={p}
                      profile={profile}
                      isPlaying={currentTrack?.id === p.id && isPlaying}
                      onPlay={() => handlePlay(p)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Filter Toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-5 border-white/10 border-b border-t mb-4 bg-transparent mt-12">
              <div className="flex items-center gap-8 overflow-x-auto no-scrollbar w-full md:w-auto">
                <FilterPill active={filter === 'popular'} onClick={() => setFilter('popular')}>
                  <span className="flex items-center gap-1.5"><span className="opacity-80">🔥</span> POPULAR</span>
                </FilterPill>

                <div className="w-px h-6 bg-white/10 hidden md:block"></div>

                <FilterPill active={filter === 'drum kit'} onClick={() => setFilter('drum kit')}>DRUM KITS</FilterPill>
                <FilterPill active={filter === 'loop kit'} onClick={() => setFilter('loop kit')}>LOOPS</FilterPill>
                <FilterPill active={filter === 'preset'} onClick={() => setFilter('preset')}>PRESETS</FilterPill>

                {/* Notice in legacy BEATS is active and highlighted differently */}
                <button
                  onClick={() => setFilter('beat')}
                  className={`text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors relative pb-1 ${filter === 'beat' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  BEATS
                  {filter === 'beat' && <div className="absolute -bottom-6 left-0 w-full h-[2px] bg-white"></div>}
                </button>

                <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>ALL</FilterPill>
              </div>

              <div className="relative w-full md:w-72">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full bg-[#111] border border-white/5 text-white text-sm rounded-full py-2.5 pl-4 pr-10 focus:outline-none focus:border-white/20 transition-colors shadow-inner"
                />
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-500" />
              </div>
            </div>

            {/* List View */}
            {filteredProducts.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="flex flex-col gap-0.5 mt-6">
                {filteredProducts.map(product => (
                  <TrackListRow
                    key={product.id}
                    product={product}
                    producerName={profile?.nickname}
                    isPlaying={currentTrack?.id === product.id && isPlaying}
                    isCurrent={currentTrack?.id === product.id}
                    onPlay={() => handlePlay(product)}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'about' && (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-10 mt-12 bg-[#0a0a0a]/50 rounded-3xl p-8 border border-white/5">
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Sobre el Productor</h3>
              <p className="text-gray-400 leading-relaxed font-medium">
                {profile?.bio || "Aún no ha añadido información detallada a su perfil."}
              </p>
            </div>
            <div className="h-fit">
              <h3 className="text-xl font-bold text-white mb-6">Redes Sociales</h3>
              <div className="flex flex-col gap-4">
                <SocialLinksList socials={profile?.socials} />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// --- SUB-COMPONENTES ---

function TrendingCard({ product, profile, isPlaying, onPlay }) {
  return (
    <div className="group flex flex-col gap-3 cursor-pointer" onClick={onPlay}>
      <div className="relative w-full aspect-[1/1] rounded-xl overflow-hidden bg-[#111] border border-transparent shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
        <img src={product.image_url || 'https://via.placeholder.com/400x400/111111/333333?text=Cover'} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 scale-100 group-hover:scale-105" />

        {/* Plays Badge */}
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md rounded-md px-2 py-1 flex items-center gap-1.5 shadow-md border border-white/5">
          <BiMusic className="text-white w-3 h-3" />
          <span className="text-white text-xs font-bold">{product.plays_count || Math.floor(Math.random() * 200)}</span>
        </div>

        {/* Hover Dark Overlay + Icon */}
        <div className={`absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px] ${isPlaying ? 'opacity-100' : ''}`}>
          <div className={`w-14 h-14 bg-black/40 border border-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-transform ${isPlaying ? 'scale-100' : 'scale-90 group-hover:scale-100'}`}>
            {isPlaying ? <BiPause size={32} /> : <BiPlay size={32} className="ml-1" />}
          </div>
        </div>
      </div>
      <div className="flex flex-col px-0.5">
        <span className="text-[14px] font-black text-white truncate drop-shadow-sm tracking-tight" title={product.name}>{product.name}</span>
        <span className="text-[12px] text-gray-500 font-medium tracking-wide mt-0.5 truncate">{profile?.nickname || 'Productor'}</span>
        <div className="flex items-center gap-1.5 mt-0.5 opacity-60">
          <span className="text-[11px] text-gray-400 font-bold lowercase">{product.product_type || 'beat'}</span>
          <span className="text-[11px] text-gray-500 font-bold">•</span>
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">{product.bpm ? `${product.bpm} BPM` : '120 BPM'}</span>
        </div>
      </div>
    </div>
  );
}

function FilterPill({ children, active, onClick }) {
  if (active) return null;
  return (
    <button
      onClick={onClick}
      className={`text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${active ? 'text-white' : 'text-gray-500 hover:text-gray-300'
        }`}
    >
      {children}
    </button>
  );
}

function TrackListRow({ product, producerName, isCurrent, isPlaying, onPlay, formatPrice }) {
  const { addItem } = useCartStore();
  const navigate = useNavigate();
  const isFree = product.is_free;
  const priceBasic = product.price_basic || 0;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addItem(product);
    toast.success(`Añadido: ${product.name}`);
  };

  const goToProduct = (e) => {
    e.stopPropagation();
    navigate(`/producto/${product.id}`);
  }

  return (
    <div
      onClick={onPlay}
      className="group grid grid-cols-[auto_1fr] md:grid-cols-[auto_4fr_50px_4fr_70px_auto_130px] items-center gap-4 md:gap-7 py-3 px-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer rounded-lg relative"
    >
      {/* 1. Cover Art */}
      <div className="relative w-[52px] h-[52px] rounded-lg overflow-hidden bg-[#1a1a1a] shrink-0 border border-white/5 shadow-md">
        <img src={product.image_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="" />
      </div>

      {/* 2. Title & Producer */}
      <div className="flex flex-col min-w-0 pr-2">
        <button onClick={goToProduct} className="text-left text-[14px] font-black text-white hover:text-violet-400 transition-colors truncate tracking-wide" title={product.name}>
          {product.name}
        </button>
        <span className="text-[12px] text-gray-500 font-medium tracking-wide truncate mt-0.5">
          {producerName || product.producer_nickname}
        </span>
      </div>

      {/* 3. Small Circular Play Button (Desktop) */}
      <div className="hidden md:flex justify-center shrink-0">
        <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 flex items-center justify-center text-gray-300 hover:text-white transition-colors">
          {isCurrent && isPlaying ? <BiPause size={22} className="text-white" /> : <Play size={16} className="ml-1 fill-white text-white opacity-80" />}
        </button>
      </div>

      {/* 4. Waveform Mock (Desktop) */}
      <div className="hidden md:flex items-center w-full px-2 opacity-50 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-[2px] h-7 w-full max-w-sm">
          {[...Array(60)].map((_, j) => {
            const height = Math.random() * 80 + 20;
            return (
              <div
                key={j}
                className={`w-[2px] rounded-full transition-all duration-300 ${isCurrent && isPlaying ? 'bg-violet-500 animate-pulse' : 'bg-gray-500'}`}
                style={{ height: `${height}%`, animationDelay: `${j * 0.05}s` }}
              ></div>
            )
          })}
        </div>
      </div>

      {/* 5. Duration */}
      <div className="hidden md:block text-[12px] text-gray-400 font-bold font-mono text-center">
        2:36
      </div>

      {/* 6. Tags (WAV, STEMS) */}
      <div className="hidden lg:flex items-center gap-2 justify-end">
        <span className="px-3 py-1 rounded-full border border-white/10 text-[10px] text-gray-400 font-bold tracking-widest uppercase bg-white/5 hover:bg-white/10 transition">WAV</span>
        <span className="px-3 py-1 rounded-full border border-white/10 text-[10px] text-gray-400 font-bold tracking-widest uppercase bg-white/5 hover:bg-white/10 transition">STEMS</span>
      </div>

      {/* 7. Actions & Price Button */}
      <div className="flex items-center justify-end shrink-0 gap-4 ml-auto pt-2 md:pt-0">
        {/* Hidden Social Actions until hover (like legacy) */}
        <div className="hidden lg:flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); }} className="text-gray-400 hover:text-white transition-colors" title="Like">
            <Heart size={18} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); }} className="text-gray-400 hover:text-white transition-colors" title="Download Free">
            <Download size={18} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); }} className="text-gray-400 hover:text-white transition-colors px-1 tracking-widest font-black" title="More">
            ...
          </button>
        </div>

        <button
          onClick={handleAddToCart}
          className="w-[70px] py-1.5 bg-[#9d4edd] hover:bg-[#8338ec] text-white text-xs font-black tracking-wide rounded-[4px] shadow-md transition-colors text-center"
        >
          {isFree ? 'FREE' : formatPrice(priceBasic)}
        </button>
      </div>

      {/* Mobile only elements: plays icon overlay */}
      <div className={`md:hidden absolute top-4 left-4 w-12 h-12 bg-black/50 rounded-lg flex items-center justify-center opacity-0 ${isCurrent ? 'opacity-100' : ''}`}>
        {isPlaying ? <BiPause size={24} className="text-white" /> : <Play size={18} className="text-white fill-white ml-1" />}
      </div>
    </div>
  );
}

function SocialLinksSmall({ socials }) {
  if (!socials) return null;
  const platforms = ['tiktok', 'youtube', 'instagram'];
  return (
    <div className="flex gap-4 items-center">
      {platforms.map(p => {
        if (!socials[p]) return null;
        const Icon = p === 'instagram' ? FaInstagram : p === 'tiktok' ? FaTiktok : FaYoutube;
        return (
          <a key={p} href={`https://${p}.com/${socials[p].replace('@', '')}`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors text-gray-400 flex items-center gap-1.5 mix-blend-screen drop-shadow-sm">
            <Icon size={18} />
          </a>
        )
      })}
    </div>
  )
}

function SocialLinksList({ socials }) {
  if (!socials) return <p className="text-sm text-gray-500">No hay enlaces disponibles.</p>;

  const getIconAndUrl = (platform, handle) => {
    let url = handle;
    if (!handle.startsWith('http')) {
      if (platform === 'instagram') url = `https://instagram.com/${handle.replace('@', '')}`;
      if (platform === 'tiktok') url = `https://tiktok.com/@${handle.replace('@', '')}`;
      if (platform === 'twitter') url = `https://twitter.com/${handle}`;
      if (platform === 'youtube') url = handle.includes('youtube') ? handle : `https://youtube.com/@${handle}`;
    }

    const icons = {
      instagram: <FaInstagram />,
      youtube: <FaYoutube />,
      spotify: <FaSpotify />,
      discord: <FaDiscord />,
      twitter: <FaTwitter />,
      tiktok: <FaTiktok />
    };

    return { icon: icons[platform] || <Globe />, url };
  };

  return (
    <div className="flex flex-col gap-3">
      {Object.entries(socials).map(([platform, handle]) => {
        if (!handle || typeof handle !== 'string') return null;
        const { icon, url } = getIconAndUrl(platform, handle);

        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-all border border-transparent hover:border-white/10"
          >
            <span className="text-xl w-6 text-center">{icon}</span>
            <span className="text-sm font-bold capitalize">{platform}</span>
          </a>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/5 rounded-2xl bg-black/40 backdrop-blur-sm mt-4">
      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
        <Music2 className="w-10 h-10 text-gray-500" />
      </div>
      <h3 className="text-2xl font-black text-white mb-2 tracking-wide">Aún no hay música</h3>
      <p className="text-gray-500 font-medium max-w-sm text-center">
        Este productor está trabajando en su próximo gran lanzamiento en el cuarto oscuro. Vuelve pronto.
      </p>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="w-full min-h-screen bg-[#050505] animate-pulse">
      <div className="w-full h-screen bg-[#050505] relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 mt-28 relative z-10 flex gap-10">
          <div className="w-[260px] h-[260px] rounded-full bg-white/5 border border-white/10 shrink-0"></div>
          <div className="flex flex-col justify-end pb-8">
            <div className="h-14 w-[400px] bg-white/5 rounded-md mb-4"></div>
            <div className="h-6 w-48 bg-white/5 rounded-md mb-4"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
