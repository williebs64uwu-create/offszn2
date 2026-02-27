import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiClient } from "../../api/client";
import { useCurrencyStore } from '../../store/currencyStore';
import { usePlayerStore } from '../../store/playerStore';
import { useAuth } from '../../store/authStore';
import { useChatStore } from '../../store/useChatStore';
import { useCartStore } from '../../store/cartStore';
import { BiPlay, BiPause, BiErrorCircle, BiMusic, BiCheckCircle } from 'react-icons/bi';
import { FaInstagram, FaYoutube, FaSpotify, FaDiscord, FaTwitter, FaTiktok } from 'react-icons/fa';
import { CheckCircle2, Heart, Share2, Globe, Search, Download, MessageSquare, UserPlus, Music2, Play, ChevronLeft, ChevronRight, ShoppingCart, Info, MoreHorizontal, ChevronDown, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFavorites } from '../../hooks/useFavorites';
import ProfilePersonalizerModal from '../../components/profile/ProfilePersonalizerModal';
import SecureImage from '../../components/ui/SecureImage';
import ProducerHoverCard from '../../components/profile/ProducerHoverCard';

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [filter, setFilter] = useState('popular');
  const [isPersonalizerOpen, setIsPersonalizerOpen] = useState(false);
  const [hoveredArtist, setHoveredArtist] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const hoverTimerRef = useRef(null);

  const { formatPrice } = useCurrencyStore();
  const { playTrack, currentTrack, isPlaying, setPlaylist } = usePlayerStore();
  const { user: currentUser, profile: currentUserProfile } = useAuth();
  const { startNewChat } = useChatStore();
  const isDynamicTheme = profile?.socials?.dynamic_theme === true || profile?.socials?.dynamic_theme === "true";

  const getThemeColor = () => {
    const val = profile?.banner_url;
    if (!val) return '#8b5cf6';
    if (val.startsWith('#') && (val.length === 4 || val.length === 7)) return val;
    if (val.startsWith('solid:')) return val.split(':')[1];
    if (val.startsWith('gradient:')) {
      const match = val.match(/#[0-9a-fA-F]{3,6}|rgba?\([^)]+\)/);
      return match ? match[0] : '#8b5cf6';
    }
    return profile?.theme_color || '#8b5cf6';
  };

  const themeColor = getThemeColor();

  const handleMessageClick = async () => {
    if (!currentUser) {
      toast.error("Inicia sesión para enviar mensajes");
      return;
    }
    await startNewChat(profile, currentUser);
    navigate('/mensajes');
  };

  const handleShareProfile = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Enlace copiado al portapapeles");
  };

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      const cleanUsername = username?.startsWith('@') ? username.slice(1) : username;
      const cacheBuster = Date.now();
      const userRes = await apiClient.get(`/users/${cleanUsername}?t=${cacheBuster}`);
      const user = userRes.data;
      setProfile(user);
      setIsFollowing(user.is_following);
      const prodRes = await apiClient.get(`/products?nickname=${cleanUsername}&t=${cacheBuster}`);
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

  useEffect(() => {
    if (username) {
      fetchProfileData();
    }
  }, [username, setPlaylist]);

  useEffect(() => {
    const layout = document.querySelector('.min-h-screen.flex.flex-col.bg-secondary');
    if (layout) {
      layout.style.backgroundColor = 'transparent';
    }
    return () => {
      if (layout) layout.style.backgroundColor = '';
    };
  }, []);

  const handlePlay = (product) => {
    if (currentTrack?.id === product.id) {
      usePlayerStore.getState().togglePlay();
    } else {
      playTrack(product);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      toast.error("Inicia sesión para seguir a este usuario");
      return;
    }
    try {
      if (isFollowing) {
        await apiClient.delete(`/social/following/${profile.id}`);
        setIsFollowing(false);
        setProfile(prev => ({ ...prev, followers_count: Math.max(0, (prev.followers_count || 0) - 1) }));
        toast.success(`Has dejado de seguir a ${profile.nickname}`);
      } else {
        await apiClient.post(`/social/following/${profile.id}`);
        setIsFollowing(true);
        setProfile(prev => ({ ...prev, followers_count: (prev.followers_count || 0) + 1 }));
        toast.success(`Ahora sigues a ${profile.nickname}`);
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
      toast.error("Error al actualizar seguimiento");
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

  const trendingProducts = products.slice(0, 5);
  const filteredProducts = products.filter(p => {
    if (filter === 'popular' || filter === 'all') return true;
    return p.product_type?.toLowerCase().includes(filter);
  });

  const getBannerStyle = () => {
    const val = profile?.banner_url;
    if (!val) return { background: `linear-gradient(180deg, ${themeColor} 0%, #000 100%)` };
    if (val.startsWith('url:') || val.startsWith('gif:')) {
      const url = val.substring(val.indexOf(':') + 1);
      return { background: `url("${url}") center/cover no-repeat` };
    } else if (val.startsWith('solid:')) {
      return { background: val.split(':')[1] };
    } else if (val.startsWith('gradient:')) {
      return { background: val.split('gradient:')[1] };
    } else if (val.startsWith('http')) {
      return { background: `url("${val}") center/cover no-repeat` };
    } else if (val.startsWith('#')) {
      return { background: val };
    }
    return { background: `linear-gradient(180deg, ${themeColor} 0%, #000 100%)` };
  };

  return (
    <div className="w-full min-h-screen font-sans selection:bg-violet-500/30 pb-32 relative">
      {isDynamicTheme && (
        <div
          className="fixed inset-0 z-[-1] pointer-events-none transition-opacity duration-1000"
          style={{
            background: `
              radial-gradient(circle at 50% -10%, ${themeColor}25 0%, transparent 50%),
              radial-gradient(circle at 50% 30%, ${themeColor}15 0%, transparent 70%),
              #050505
            `
          }}
        />
      )}

      <style>
        {`
          body {
             background-color: #050505 !important;
             background-attachment: fixed !important;
          }
          #root, main, .min-h-screen, [class*="bg-secondary"] {
             background-color: transparent !important;
             background-image: none !important;
          }
          footer {
             background: transparent !important;
             border-top: none !important;
          }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
        `}
      </style>

      <header className="relative pt-[100px] px-10 pb-16 min-h-[380px] overflow-hidden" style={getBannerStyle()}>
        <div className="absolute inset-0 pointer-events-none z-1 overflow-hidden">
          <div className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: isDynamicTheme ? 0.14 : 0, background: `radial-gradient(circle at 50% -10%, ${themeColor} 0%, transparent 100%)` }} />
          <div className="absolute inset-0 z-2" style={{ background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 15%, rgba(0,0,0,0.3) 30%, transparent 50%)' }} />
        </div>

        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-end gap-8 relative z-10 w-full">
          <div className="profile-avatar-container shrink-0">
            <div className="w-[175px] h-[175px] rounded-full bg-[#1a1a1a] overflow-hidden border-[4px] border-[#1a1a1a] shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
              <SecureImage src={profile?.avatar_url} alt={profile?.nickname} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="profile-details flex-1 flex flex-col gap-2 pb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-[3rem] font-black text-white leading-none tracking-[-1.2px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] font-['Plus_Jakarta_Sans',sans-serif]">
                {profile?.nickname}
              </h1>
              {profile?.is_verified && (
                <div className="relative group flex items-center mt-1">
                  <div className="text-[#3b82f6] text-[1.5rem] cursor-help">
                    <BiCheckCircle />
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 hidden group-hover:flex flex-col w-[200px] bg-[#1a1a1a] border border-[#333] rounded-[10px] p-0 z-50 shadow-[0_10px_25px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in duration-200">
                    <div className="bg-[#222] px-3 py-2 rounded-t-[10px] text-[0.7rem] font-bold text-white border-b border-[#333] flex items-center gap-1.5 uppercase tracking-wide">
                      <BiCheckCircle className="text-[#3b82f6] text-[0.9rem]" /> VERIFICADO OFFSZN
                    </div>
                    <div className="p-3 text-[0.85rem] text-gray-300 leading-tight">Plan Premium OFFSZN<br />Productor Verificado<br /><span className="text-[#888] text-[0.7rem] block mt-1">Certificado Oficial</span></div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#1a1a1a]"></div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-[#b3b3b3] text-[0.85rem] font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
              <span>{profile?.role || 'Productor Musical'}</span>
              <span className="text-[0.5rem]">•</span>
              <span>{profile?.location || 'Mundo'}</span>
            </div>
            <div className="text-[#ccc] text-[1rem] leading-[1.5] max-w-[600px] mt-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)] whitespace-pre-line break-words">
              {profile?.bio || "Aún no ha añadido información."}
            </div>

            <div className="flex items-center gap-10 mt-2">
              <div className="flex items-center gap-5 text-[#b3b3b3] text-[0.9rem]">
                <span><b className="text-white font-bold">{products.length}</b> tracks</span>
                <span><b className="text-white font-bold">{profile?.followers_count || 0}</b> followers</span>
                <span><b className="text-white font-bold">{profile?.following_count || 0}</b> following</span>
              </div>
              <div className="flex items-center gap-4 pl-5 border-l border-white/10">
                <SocialLinkSmall href={profile?.socials?.instagram} icon={FaInstagram} />
                <SocialLinkSmall href={profile?.socials?.youtube} icon={FaYoutube} />
                <SocialLinkSmall href={profile?.socials?.tiktok} icon={FaTiktok} />
                <SocialLinkSmall href={profile?.socials?.spotify} icon={FaSpotify} />
              </div>
            </div>

            <div className="flex gap-8 mt-4">
              <TabButton label="PRODUCTOS" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
              <TabButton label="SERVICIOS" active={activeTab === 'services'} onClick={() => setActiveTab('services')} />
              <TabButton label="INFO" active={activeTab === 'about'} onClick={() => setActiveTab('about')} />
            </div>
          </div>

          <div className="flex items-center gap-3 pb-8">
            {currentUserProfile && currentUserProfile.nickname === profile?.nickname ? (
              <>
                <ActionButton label="Personalizar" onClick={() => setIsPersonalizerOpen(true)} />
                <ActionButton label="Ajustes" onClick={() => navigate('/dashboard/settings')} />
              </>
            ) : (
              <>
                <button
                  onClick={handleFollowToggle}
                  className={`px-[24px] py-2 rounded-[20px] text-[0.75rem] font-bold transition-all hover:-translate-y-[2px] shadow-lg ${isFollowing
                    ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                    : 'bg-white text-black hover:bg-gray-200'
                    }`}
                >
                  {isFollowing ? 'Siguiendo' : 'Seguir'}
                </button>
                <ActionButton label="Mensaje" onClick={handleMessageClick} />
              </>
            )}
            <button onClick={handleShareProfile} className="bg-transparent border border-white/40 text-white p-2 rounded-full text-[0.75rem] font-bold flex items-center justify-center hover:bg-white/10 hover:border-white/80 transition-all hover:-translate-y-[2px] shrink-0">
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-10 mt-5 relative z-10 pb-20">
        {activeTab === 'products' && (
          <div className="animate-fadeIn">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white text-[1.25rem] font-bold tracking-tight">Trending / Packs</h3>
              <div className="flex gap-2">
                <ScrollButton icon={ChevronLeft} />
                <ScrollButton icon={ChevronRight} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-14">
              {trendingProducts.map(p => (
                <TrendingCard
                  key={p.id}
                  product={p}
                  profile={profile}
                  isPlaying={currentTrack?.id === p.id && isPlaying}
                  onPlay={() => handlePlay(p)}
                  onArtistHover={(nickname, rect) => {
                    clearTimeout(hoverTimerRef.current);
                    setHoveredArtist({ nickname, rect });
                  }}
                  onArtistLeave={() => {
                    hoverTimerRef.current = setTimeout(() => setHoveredArtist(null), 100);
                  }}
                />
              ))}
            </div>

            <div className="pro-toolbar-container flex justify-between items-center bg-[#080808]/80 backdrop-blur-md border border-white/5 rounded-lg h-14 p-0 mb-6 sticky top-[80px] z-20 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              <div className="toolbar-section left flex items-center h-full">
                <div className="h-full flex items-center border-r border-white/5 px-6">
                  <button className="flex items-center gap-2 text-[#eab308] text-[0.75rem] font-extrabold uppercase tracking-[1px]"><span className="text-xs">🔥</span> POPULAR <ChevronDown size={14} /></button>
                </div>
                <div className="flex items-center h-full overflow-x-auto no-scrollbar">
                  <FilterTab label="DRUM KITS" active={filter === 'drum kit'} onClick={() => setFilter('drum kit')} />
                  <FilterTab label="LOOPS" active={filter === 'loop kit'} onClick={() => setFilter('loop kit')} />
                  <FilterTab label="PRESETS" active={filter === 'preset'} onClick={() => setFilter('preset')} />
                  <FilterTab label="BEATS" active={filter === 'beat'} onClick={() => setFilter('beat')} />
                  <FilterTab label="ALL" active={filter === 'all'} onClick={() => setFilter('all')} />
                </div>
              </div>
              <div className="toolbar-section right px-4 hidden md:block">
                <div className="pro-search flex items-center bg-[#111] border border-white/5 rounded-md px-3 h-10 w-64 focus-within:border-white/20 transition-all">
                  <input type="text" placeholder="Search..." className="bg-transparent border-none text-white text-sm outline-none w-full" />
                  <Search size={14} className="text-[#555]" />
                </div>
              </div>
            </div>

            <div className="products-list-container flex flex-col">
              {filteredProducts.length === 0 ? <EmptyState /> : filteredProducts.map(product => (
                <TrackListRow
                  key={product.id}
                  product={product}
                  producerName={profile?.nickname}
                  isPlaying={currentTrack?.id === product.id && isPlaying}
                  isCurrent={currentTrack?.id === product.id}
                  onPlay={() => handlePlay(product)}
                  formatPrice={formatPrice}
                  onArtistHover={(nickname, rect) => {
                    clearTimeout(hoverTimerRef.current);
                    setHoveredArtist({ nickname, rect });
                  }}
                  onArtistLeave={() => {
                    hoverTimerRef.current = setTimeout(() => setHoveredArtist(null), 100);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="animate-fadeIn mt-5">
            {profile?.socials?.offered_services?.mixing || profile?.socials?.offered_services?.mastering ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {profile.socials.offered_services.mixing && <ServiceCard emoji="🎤" title="Servicio de Mezcla" desc="Mezcla profesional balanceada para tus producciones." />}
                {profile.socials.offered_services.mastering && <ServiceCard emoji="🎧" title="Servicio de Mastering" desc="El toque final competitivo para un sonido listo para plataformas." />}
                <div onClick={handleMessageClick} className="bg-transparent border-2 border-dashed border-white/5 p-8 rounded-2xl text-center flex flex-col justify-center items-center cursor-pointer hover:border-white/20 hover:bg-white/5 transition-all">
                  <MessageSquare className="text-[1.5rem] text-[#555] mb-3" /><span className="text-[#888] text-[0.9rem] font-bold">Contactar para Presupuesto</span>
                </div>
              </div>
            ) : <div className="py-16 text-center bg-[#111]/20 rounded-2xl border border-white/5 mb-8"><p className="text-[#555] text-[0.95rem] font-medium">Este usuario no ofrece servicios listados actualmente.</p></div>}
            {profile?.socials?.spotify_content && <SpotifySection url={profile.socials.spotify_content} />}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="animate-fadeIn grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-8 mt-5">
            <div className="p-8 bg-[#111]/40 backdrop-blur-sm rounded-2xl border border-white/5 shadow-xl">
              <h4 className="text-[#8b5cf6] mb-5 text-[0.75rem] font-black uppercase tracking-widest">Biografía Detallada</h4>
              <p className="text-[#ccc] leading-relaxed text-[1.05rem] font-medium whitespace-pre-wrap">{profile?.bio || "Aún no hay biografía disponible para este usuario."}</p>
            </div>
            <div className="p-8 bg-[#111]/40 backdrop-blur-sm rounded-2xl border border-white/5 shadow-xl">
              <h4 className="text-[#8b5cf6] mb-6 text-[0.75rem] font-black uppercase tracking-widest">Información Técnica</h4>
              <div className="flex flex-col gap-5">
                <TechInfo label="Experiencia" value={profile?.experience?.[0] || 'Legendario'} />
                <TechInfo label="DAW de Preferencia" value={profile?.daws?.[0] || 'Multi-DAW'} />
                <TechInfo label="Residencia" value={profile?.location || 'Mundo'} />
              </div>
            </div>
          </div>
        )}
      </div>

      {hoveredArtist && (
        <ProducerHoverCard
          nickname={hoveredArtist.nickname}
          triggerRect={hoveredArtist.rect}
          onMouseEnter={() => clearTimeout(hoverTimerRef.current)}
          onMouseLeave={() => setHoveredArtist(null)}
        />
      )}

      <ProfilePersonalizerModal isOpen={isPersonalizerOpen} onClose={() => setIsPersonalizerOpen(false)} profile={profile} onUpdate={fetchProfileData} />
    </div>
  );
}

// --- SUB-COMPONENTES ---

function SocialLinkSmall({ href, icon: Icon }) {
  if (!href) return null;
  return (<a href={href.startsWith('http') ? href : `https://${href}`} target="_blank" rel="noreferrer" className="text-[#b3b3b3] hover:text-white transition-colors"><Icon size={18} /></a>);
}

function TabButton({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={`text-[0.8rem] font-bold tracking-widest uppercase py-3 px-1 transition-all relative ${active ? 'text-white' : 'text-[#ccc] hover:text-white'}`}>
      {label}
      {active && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white rounded-[2px] shadow-[0_2px_4px_rgba(0,0,0,0.8)]"></div>}
    </button>
  );
}

function ActionButton({ label, onClick }) {
  return (<button onClick={onClick} className="bg-transparent border border-white/40 text-white px-[18px] py-2 rounded-[20px] text-[0.75rem] font-bold hover:bg-white/10 hover:border-white/80 transition-all hover:-translate-y-[2px]">{label}</button>);
}

function ScrollButton({ icon: Icon }) {
  return (<button className="bg-[#111] border border-[#222] w-8 h-8 rounded-full text-[#555] flex items-center justify-center hover:text-white transition-all hover:scale-105"><Icon size={16} /></button>);
}

function FilterTab({ label, active, onClick }) {
  return (<button onClick={onClick} className={`h-full border-r border-[#1a1a1a] px-6 text-[0.75rem] font-bold uppercase tracking-widest transition-all ${active ? 'bg-[#111] text-white' : 'text-[#777] hover:bg-[#111] hover:text-white'}`}>{label}</button>);
}

function TrendingCard({ product, profile, isPlaying, onPlay, onArtistHover, onArtistLeave }) {
  const productUrl = `/${product.product_type || 'beat'}/${product.public_slug || product.id}`;
  const navigate = useNavigate();

  // Get accepted collaborators
  const collaborators = product.collaborations?.filter(c => c.status === 'accepted').map(c => c.collaborator) || [];
  const mainProducer = product.users || profile;

  return (
    <div className="group flex flex-col gap-3 cursor-pointer">
      <div className="relative w-full aspect-square rounded-[12px] overflow-hidden bg-[#121212] shadow-xl">
        <SecureImage src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPlay(); }} className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isPlaying ? 'opacity-100' : ''}`}>
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black shadow-2xl transform transition-transform active:scale-95">{isPlaying ? <BiPause size={28} /> : <BiPlay size={28} className="ml-1" />}</div>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 px-1 pb-1">
        <h4 onClick={() => navigate(productUrl)} className="text-white text-[1rem] font-bold truncate leading-tight group-hover:text-[#8b5cf6] transition-colors">{product.name}</h4>
        <div className="flex items-center flex-wrap gap-x-1 gap-y-0.5">
          <span
            onMouseEnter={(e) => onArtistHover(mainProducer.nickname, e.currentTarget.getBoundingClientRect())}
            onMouseLeave={onArtistLeave}
            className="text-[#888] text-[0.8rem] font-medium hover:text-white transition-colors"
          >
            {mainProducer.nickname}
          </span>
          {collaborators.map((collab, idx) => (
            <React.Fragment key={collab.id || idx}>
              <span className="text-[#555] text-[0.8rem]">x</span>
              <span
                onMouseEnter={(e) => onArtistHover(collab.nickname, e.currentTarget.getBoundingClientRect())}
                onMouseLeave={onArtistLeave}
                className="text-[#888] text-[0.8rem] font-medium hover:text-white transition-colors"
              >
                {collab.nickname}
              </span>
            </React.Fragment>
          ))}
        </div>
        <p className="text-[#555] text-[0.7rem] font-bold uppercase tracking-[1.5px] mt-0.5">{product.product_type || 'Pack'} • {product.bpm || '120'} BPM</p>
      </div>
    </div>
  );
}

function TrackListRow({ product, producerName, isCurrent, isPlaying, onPlay, formatPrice, onArtistHover, onArtistLeave }) {
  const { addItem } = useCartStore();
  const { toggleFavorite } = useFavorites();
  const [isLiked, setIsLiked] = useState(!!product.is_liked);
  const navigate = useNavigate();
  const isFree = product.is_free;
  const priceBasic = product.price_basic || 0;
  const handleAddToCart = (e) => { e.stopPropagation(); addItem(product); toast.success(`Añadido: ${product.name}`); };
  const goToProduct = (e) => { e.stopPropagation(); navigate(`/${product.product_type || 'beat'}/${product.public_slug || product.id}`); };
  const handleArtistEnter = (e) => { onArtistHover(producerName, e.currentTarget.getBoundingClientRect()); };

  const handleLike = async (e) => {
    e.stopPropagation();
    const result = await toggleFavorite(product.id);
    if (result !== null) setIsLiked(result);
  };

  return (
    <div onClick={onPlay} className={`group grid grid-cols-[60px_330px_2fr_210px_80px_110px] items-center gap-4 py-[8px] px-[8px] min-h-[73px] border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer overflow-hidden backdrop-blur-sm ${isCurrent ? 'bg-white/5' : ''}`}>
      <div className="w-[56px] h-[56px] rounded-[8px] overflow-hidden bg-[#1a1a1a] shrink-0 border border-white/5">
        <SecureImage src={product.image_url} className="w-full h-full object-cover brightness-[0.9]" alt="" />
      </div>
      <div className="flex flex-col min-w-0 pr-4">
        <h4 onClick={goToProduct} className="text-[0.95rem] font-bold text-[#eee] group-hover:text-violet-400 truncate leading-tight transition-colors">{product.name}</h4>
        <div className="relative inline-block w-fit" onMouseEnter={handleArtistEnter} onMouseLeave={onArtistLeave}>
          <p className="text-[0.75rem] text-[#666] font-bold hover:text-white transition-colors truncate mt-1">{producerName || 'OFFSZN'}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 pr-4">
        <button className="w-9 h-9 shrink-0 rounded-full bg-[#1a1a1a] border border-[#333] hover:bg-white hover:text-black hover:border-white flex items-center justify-center text-white transition-all transform hover:scale-105 shadow-lg">
          {isCurrent && isPlaying ? <BiPause size={22} /> : <BiPlay size={22} className="ml-0.5" />}
        </button>
        <div className="flex-1 hidden md:flex items-center gap-4">
          <div className="flex items-center gap-[1.5px] h-6 flex-1 opacity-60 group-hover:opacity-100 transition-opacity">
            {[...Array(60)].map((_, j) => (<div key={j} className={`w-[2px] rounded-full transition-all ${isCurrent && isPlaying ? 'bg-violet-500 animate-pulse' : 'bg-[#444]'}`} style={{ height: `${Math.random() * 60 + 20}%` }}></div>))}
          </div>
          <div className="flex items-center gap-1 text-[0.7rem] text-[#555] font-mono group-hover:text-[#888] transition-colors shrink-0"><Clock size={12} />{product.duration || '02:45'}</div>
        </div>
      </div>
      <div className="hidden lg:flex items-center gap-2 pr-2">
        <span className="text-[0.65rem] font-bold text-[#555] uppercase tracking-wider whitespace-nowrap">{product.bpm || '120'} BPM</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="bg-white/5 border border-white/5 rounded-full px-2.5 py-0.5 text-[0.65rem] text-[#777] font-bold uppercase tracking-wider group-hover:text-gray-400 transition-colors">WAV</span>
          <span className="bg-white/5 border border-white/5 rounded-full px-2.5 py-0.5 text-[0.65rem] text-[#777] font-bold uppercase tracking-wider group-hover:text-gray-400 transition-colors">STEMS</span>
        </div>
      </div>
      <div className="flex justify-center text-[0.9rem] font-extrabold text-[#eee]">
        <button onClick={handleAddToCart} className={`${isFree ? 'text-emerald-400' : 'hover:text-violet-400 transition-colors'}`}>{isFree ? 'FREE' : formatPrice(priceBasic)}</button>
      </div>
      <div className="flex items-center justify-end gap-3 pr-2">
        <button
          onClick={handleLike}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isLiked ? 'text-red-500 bg-red-500/10' : 'text-[#555] hover:text-white hover:bg-white/10'}`}
        >
          <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); }} className="w-8 h-8 rounded-full flex items-center justify-center text-[#555] hover:text-white hover:bg-white/10 transition-all"><Download size={18} /></button>
        <button onClick={(e) => { e.stopPropagation(); }} className="w-8 h-8 rounded-full flex items-center justify-center text-[#555] hover:text-white hover:bg-white/10 transition-all"><Share2 size={18} /></button>
      </div>
    </div>
  );
}

function ServiceCard({ emoji, title, desc }) {
  return (<div className="bg-[#111]/40 backdrop-blur-sm border border-white/5 p-8 rounded-2xl text-center group hover:bg-[#111]/60 transition-all"><div className="text-[2.5rem] mb-4">{emoji}</div><h4 className="text-white text-[1.1rem] mb-1 font-bold">{title}</h4><p className="text-[#888] text-[0.85rem] leading-relaxed">{desc}</p></div>);
}

function SpotifySection({ url }) {
  const embedUrl = url.includes('playlist/') ? `https://open.spotify.com/embed/playlist/${url.split('playlist/')[1]?.split('?')[0]}?utm_source=generator&theme=0` : url.includes('track/') ? `https://open.spotify.com/embed/track/${url.split('track/')[1]?.split('?')[0]}?utm_source=generator&theme=0` : "";
  return (<div className="mt-12"><h4 className="text-white mb-6 text-[0.85rem] font-black uppercase tracking-[2px] flex items-center gap-3"><span className="text-[#1DB954]"><FaSpotify size={20} /></span> Mi Portfolio / Playlist</h4><div className="rounded-2xl overflow-hidden bg-[#111] shadow-2xl border border-white/5"><iframe title="Spotify Embed" className="w-full h-[450px]" src={embedUrl} frameBorder="0" allowFullScreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe></div></div>);
}

function TechInfo({ label, value }) {
  return (<div className="flex justify-between items-center pb-4 border-b border-white/5"><span className="text-[#666] text-[0.9rem] font-bold">{label}</span><span className="text-white font-extrabold text-[1rem]">{value}</span></div>);
}

function EmptyState() {
  return (<div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/5 rounded-2xl bg-black/40 backdrop-blur-sm mt-4"><div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6"><Music2 className="w-10 h-10 text-gray-500" /></div><h3 className="text-2xl font-black text-white mb-2 tracking-wide">Aún no hay música</h3><p className="text-gray-500 font-medium max-w-sm text-center">Este productor está trabajando en su próximo gran lanzamiento en el cuarto oscuro. Vuelve pronto.</p></div>);
}

function ProfileSkeleton() {
  return (<div className="w-full min-h-screen bg-[#050505] animate-pulse"><div className="w-full h-screen bg-[#050505] relative overflow-hidden"><div className="max-w-[1400px] mx-auto px-6 mt-28 relative z-10 flex gap-10"><div className="w-[260px] h-[260px] rounded-full bg-white/5 border border-white/10 shrink-0"></div><div className="flex flex-col justify-end pb-8"><div className="h-14 w-[400px] bg-white/5 rounded-md mb-4"></div><div className="h-6 w-48 bg-white/5 rounded-md mb-4"></div></div></div></div></div>);
}
