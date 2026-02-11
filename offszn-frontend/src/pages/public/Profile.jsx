import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiClient } from "../../api/client";
import { useCurrencyStore } from '../../store/currencyStore';
import { usePlayerStore } from '../../store/playerStore';
import { useAuth } from '../../store/authStore';
import { useChatStore } from '../../store/useChatStore';
import {
  BiUserCheck,
  BiMessageDetail,
  BiPlay,
  BiPause,
  BiMusic,
  BiCart,
  BiGlobe,
  BiCheckCircle,
  BiErrorCircle
} from 'react-icons/bi';
import {
  FaInstagram,
  FaYoutube,
  FaSpotify,
  FaDiscord,
  FaTwitter,
  FaTiktok
} from 'react-icons/fa';

export default function Profile() {
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  const { formatPrice } = useCurrencyStore();
  const { playTrack, currentTrack, isPlaying, setPlaylist } = usePlayerStore();
  const { user: currentUser } = useAuth();
  const { startNewChat } = useChatStore();
  const navigate = useNavigate();

  const handleMessageClick = async () => {
    if (!currentUser) {
      // Logic for guest (could use a global modal if available)
      alert("Inicia sesión para enviar mensajes");
      return;
    }

    // The profile object contains the target user info
    await startNewChat(profile, currentUser);
    navigate('/mensajes');
  };

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Obtener Usuario por Nickname desde el Backend
        const userRes = await apiClient.get(`/users/${username}`);
        const user = userRes.data;
        setProfile(user);

        // 2. Obtener Productos del Usuario desde el Backend
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

  const handlePlay = (product) => {
    if (currentTrack?.id === product.id) {
      usePlayerStore.getState().togglePlay();
    } else {
      playTrack(product);
    }
  };

  if (loading) return <ProfileSkeleton />;

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-[#888] bg-black">
      <BiErrorCircle size={48} className="mb-4 text-red-500/50" />
      <h2 className="text-xl font-bold text-white">Ops, algo salió mal</h2>
      <p>{error}</p>
      <Link to="/explorar" className="mt-6 text-violet-500 hover:underline">Volver a explorar</Link>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-[#050505] pb-20">

      {/* 1. BANNER & HEADER */}
      <div className="w-full h-48 bg-gradient-to-r from-[#2e1065] to-[#000] relative">
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row items-end md:items-center gap-6 pb-6 border-b border-[#222]">

          {/* Avatar */}
          <div className="w-32 h-32 rounded-full border-4 border-[#050505] bg-[#111] overflow-hidden shadow-2xl shrink-0">
            <img
              src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.nickname}&background=111&color=fff`}
              alt={profile.nickname}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 mb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-white font-jakarta">
                {profile.first_name ? `${profile.first_name} ${profile.last_name || ''}` : profile.nickname}
              </h1>
              {profile.is_verified && <BiCheckCircle className="text-[#8B5CF6]" title="Verificado" />}
            </div>

            <p className="text-[#888] font-medium">@{profile.nickname} • <span className="text-[#666] text-sm">{profile.role || 'Productor'}</span></p>

            {/* Socials */}
            <div className="flex gap-4 mt-3">
              <SocialLinks socials={profile.socials} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none py-2 px-6 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 shadow-lg">
              <BiUserCheck size={20} /> Seguir
            </button>
            <button
              onClick={handleMessageClick}
              className="flex-1 md:flex-none py-2 px-6 border border-[#333] text-white font-bold rounded-full hover:border-[#666] transition-colors flex items-center justify-center gap-2"
            >
              <BiMessageDetail size={20} /> Mensaje
            </button>
          </div>
        </div>

        {/* 2. BIO & STATS */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 mt-8">

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="bg-[#0F0F0F] p-5 rounded-xl border border-[#1A1A1A]">
              <h3 className="text-white font-bold mb-3 uppercase text-xs tracking-widest text-zinc-500">Sobre mí</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {profile.bio || "Este productor no ha añadido una biografía aún."}
              </p>
              {profile.location && (
                <div className="mt-4 flex items-center gap-2 text-[#666] text-sm">
                  <BiGlobe /> {profile.location}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex justify-between bg-[#0F0F0F] p-5 rounded-xl border border-[#1A1A1A]">
              <div className="text-center">
                <span className="block text-xl font-bold text-white">0</span>
                <span className="text-xs text-[#666] uppercase">Seguidores</span>
              </div>
              <div className="text-center border-l border-[#222] pl-6">
                <span className="block text-xl font-bold text-white">{products.length}</span>
                <span className="text-xs text-[#666] uppercase">Tracks</span>
              </div>
            </div>
          </aside>

          {/* Main Content (Products) */}
          <main>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BiMusic className="text-[#8B5CF6]" /> Catálogo
              </h2>
            </div>

            {products.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                  <BeatCard
                    key={product.id}
                    product={product}
                    isPlaying={currentTrack?.id === product.id && isPlaying}
                    onTogglePlay={() => handlePlay(product)}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTES ---

function BeatCard({ product, isPlaying, onTogglePlay, formatPrice }) {
  const displayPrice = product.is_free ? "GRATIS" : formatPrice(product.price_basic);
  const imgUrl = product.image_url || 'https://via.placeholder.com/400x400/1a1a1a/333333?text=Cover';

  return (
    <div className="group bg-[#0F0F0F] border border-[#1A1A1A] rounded-xl overflow-hidden hover:border-[#8B5CF6]/50 transition-all hover:-translate-y-1">
      {/* Cover */}
      <div className="relative aspect-square overflow-hidden bg-[#111]">
        <img src={imgUrl} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />

        {/* Overlay Play Button */}
        <button
          onClick={(e) => { e.preventDefault(); onTogglePlay(); }}
          className={`absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm ${isPlaying ? 'opacity-100 bg-black/60' : ''}`}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-transform ${isPlaying ? 'bg-[#8B5CF6] scale-100' : 'bg-white text-black scale-90 group-hover:scale-100'}`}>
            {isPlaying ? <BiPause size={30} /> : <BiPlay size={30} className="ml-1" />}
          </div>
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <h4 className="text-white font-bold truncate pr-2" title={product.name}>{product.name}</h4>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-[#666] uppercase tracking-wider">{product.bpm ? `${product.bpm} BPM` : (product.product_type || 'Beat')}</span>
          <span className={`text-sm font-bold ${product.is_free ? 'text-emerald-400' : 'text-violet-400'}`}>
            {displayPrice}
          </span>
        </div>

        <Link
          to={`/producto/${product.id}`}
          className="w-full mt-4 py-2 bg-[#1A1A1A] hover:bg-[#222] text-[#ccc] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <BiCart size={16} /> VER DETALLES
        </Link>
      </div>
    </div>
  );
}

function SocialLinks({ socials }) {
  if (!socials) return null;

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

    return { icon: icons[platform] || <BiGlobe />, url };
  };

  return Object.entries(socials).map(([platform, handle]) => {
    if (!handle) return null;
    const { icon, url } = getIconAndUrl(platform, handle);

    return (
      <a
        key={platform}
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-[#888] hover:text-white text-xl transition-colors hover:scale-110"
        title={platform}
      >
        {icon}
      </a>
    );
  });
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-[#222] rounded-2xl bg-[#0A0A0A]">
      <BiMusic className="text-6xl text-[#222] mb-4" />
      <h3 className="text-lg font-bold text-white">Aún no hay música</h3>
      <p className="text-[#666] text-sm max-w-xs text-center mt-2">
        Este productor está trabajando en su próximo gran lanzamiento. Vuelve pronto.
      </p>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="w-full min-h-screen bg-[#050505] animate-pulse">
      <div className="w-full h-48 bg-[#111]"></div>
      <div className="max-w-6xl mx-auto px-6 -mt-16">
        <div className="flex flex-col md:flex-row items-end gap-6 pb-6">
          <div className="w-32 h-32 rounded-full bg-[#222] border-4 border-[#050505]"></div>
          <div className="space-y-3 mb-2 flex-1">
            <div className="h-8 w-48 bg-[#222] rounded"></div>
            <div className="h-4 w-32 bg-[#222] rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 mt-8">
          <div className="h-40 bg-[#111] rounded-xl"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-[#111] rounded-xl"></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}
