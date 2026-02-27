import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useSecureUrl } from '../hooks/useSecureUrl';
import { usePlayerStore } from '../store/playerStore';
import { useCartStore } from '../store/cartStore';
import { useCurrencyStore } from '../store/currencyStore';
import { useAuth } from '../store/authStore';
import { useChatStore } from '../store/useChatStore';
import WaveSurfer from 'wavesurfer.js';
import { BiPlay, BiPause, BiCartAdd, BiHeart, BiShareAlt, BiCheck, BiChevronDown, BiPlus } from 'react-icons/bi';
import { BsPatchCheckFill } from 'react-icons/bs';
import { ShoppingCart, Download, Share2, Heart, Music2, Clock, CalendarDays, Eye, Tag } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import toast from 'react-hot-toast';

const ProductDetail = () => {
  const { id, slug } = useParams();
  const identifier = slug || id;
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLicense, setSelectedLicense] = useState('basic');
  const [waveLoading, setWaveLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isDescOpen, setIsDescOpen] = useState(true);
  const [isInfoOpen, setIsInfoOpen] = useState(true);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const { toggleFavorite } = useFavorites();

  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);

  // Stores
  const { addItem } = useCartStore();
  const { formatPrice } = useCurrencyStore();
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const { user } = useAuth();
  const { url: secureAudioUrl, loading: audioUrlLoading } = useSecureUrl(product?.audio_url || product?.demo_url);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/products/${identifier}`);
        const found = response.data;

        if (found) {
          setProduct({
            ...found,
            available_licenses: [
              { id: 'basic', name: 'Basic Lease', price: found.price_basic, features: ['MP3 de Alta Calidad', '5,000 Streams', 'Sin Monetización'] },
              { id: 'premium', name: 'Premium Lease', price: found.price_premium || (found.price_basic + 20), features: ['MP3 + WAV', '50,000 Streams', 'Monetización Limitada'] },
              { id: 'unlimited', name: 'Unlimited Trackout', price: found.price_exclusive || (found.price_basic + 80), features: ['MP3 + WAV + TRACKOUTS', 'Streams Ilimitados', 'Monetización Ilimitada'] }
            ].filter(l => l.price > 0 || found.is_free)
          });
          setIsLiked(!!found.is_liked);

          // Fetch related products (same producer or same type)
          const relatedRes = await apiClient.get(`/products?type=${found.product_type}&limit=6`);
          setRelatedProducts(relatedRes.data.filter(p => p.id !== found.id));
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error("No se pudo cargar el producto");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
    };
  }, [identifier]);

  useEffect(() => {
    if (!secureAudioUrl || !waveformRef.current) return;

    if (wavesurfer.current) {
      wavesurfer.current.destroy();
    }

    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'rgba(255, 255, 255, 0.1)',
      progressColor: '#8b5cf6',
      cursorColor: 'transparent',
      barWidth: 2,
      barGap: 3,
      height: 60,
      barRadius: 2,
      normalize: true,
      interact: true,
      backend: 'MediaElement'
    });

    wavesurfer.current.on('ready', () => {
      setWaveLoading(false);
    });

    wavesurfer.current.load(secureAudioUrl);

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
    };
  }, [secureAudioUrl, product]);

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
      <h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
      <button onClick={() => navigate(-1)} className="text-violet-400 hover:underline">Volver</button>
    </div>
  );

  const isCurrent = currentTrack?.id === product.id;
  const activeLicense = product.available_licenses.find(l => l.id === selectedLicense) || product.available_licenses[0];

  const handlePlay = (e) => {
    e?.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack({ ...product, secureAudio: secureAudioUrl });
    }
  };

  const handleAddToCart = () => {
    addItem(product, activeLicense);
    toast.success(`Añadido: ${product.name}`);
  };

  const handleLike = async () => {
    const result = await toggleFavorite(product.id);
    if (result !== null) {
      setIsLiked(result);
      setProduct(prev => ({
        ...prev,
        likes_count: result ? (prev.likes_count + 1) : (prev.likes_count - 1)
      }));
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Enlace copiado al portapapeles");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-[110px] pb-32 font-sans selection:bg-violet-500/30">
      <div className="max-w-[1240px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-[60px] items-start">

        {/* --- LEFT COL: SIDEBAR --- */}
        <aside className="product-sidebar flex flex-col gap-6">
          {/* Cover Art */}
          <div className="product-cover-art relative w-full aspect-square rounded-xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] bg-[#111] group">
            <img
              src={product.image_url || 'https://via.placeholder.com/400x400/111111/333333?text=Cover'}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Play Overlay */}
            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <button
                onClick={handlePlay}
                className="w-20 h-20 bg-violet-600 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all"
              >
                {isCurrent && isPlaying ? <BiPause size={48} /> : <BiPlay size={48} className="ml-1.5" />}
              </button>
            </div>
          </div>

          {/* Social Stats Action Row */}
          <div className="flex justify-center gap-12 py-2 w-full border-b border-white/5">
            <button
              onClick={handleLike}
              className={`flex flex-col items-center gap-1 transition-all hover:-translate-y-1 ${isLiked ? 'text-red-500' : 'text-[#888] hover:text-white'}`}
            >
              <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
              <span className="text-[0.75rem] font-bold text-[#666]">{product.likes_count || 0}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex flex-col items-center gap-1 text-[#888] hover:text-white transition-all hover:-translate-y-1"
            >
              <Share2 size={24} />
              <span className="text-[0.75rem] font-bold text-[#666]">Compartir</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-[#888] hover:text-white transition-all hover:-translate-y-1">
              <Eye size={24} />
              <span className="text-[0.75rem] font-bold text-[#666]">{product.plays_count || 0}</span>
            </button>
          </div>

          {/* Productor Info Summary (Compact) */}
          <div className="bg-[#111] border border-white/5 p-5 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#222] shrink-0">
              <img src={product.users?.avatar_url || `https://ui-avatars.com/api/?name=${product.users?.nickname}&background=111&color=fff`} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-[#555] font-black uppercase tracking-widest leading-none mb-1">Creador</span>
              <Link to={`/@${product.users?.nickname}`} className="text-white hover:text-violet-400 font-bold text-[0.95rem] truncate flex items-center gap-1 transition-colors">
                {product.users?.nickname}
                {product.users?.is_verified && <BsPatchCheckFill size={13} className="text-violet-500" />}
              </Link>
            </div>
          </div>

          {/* Information Section (Accordion style as requested) */}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setIsInfoOpen(!isInfoOpen)}
              className="flex items-center justify-between py-3 border-b border-white/5 text-[0.8rem] font-black uppercase tracking-widest text-white group"
            >
              Información
              <BiChevronDown className={`transition-transform duration-300 ${isInfoOpen ? 'rotate-180' : ''}`} size={20} />
            </button>
            {isInfoOpen && (
              <div className="flex flex-col pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <InfoRow label="Publicado" val={new Date(product.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} />
                <InfoRow label="Categoría" val={product.product_type} isCapitalized />
                <InfoRow label="BPM" val={product.bpm || '--'} />
                <InfoRow label="Key" val={`${product.key || '--'} ${product.key_scale || ''}`} />
                <InfoRow label="Reproducciones" val={product.plays_count || 0} />
              </div>
            )}
          </div>

          {/* Tags */}
          {product.tags && (
            <div className="flex flex-wrap gap-2 mt-4">
              {(Array.isArray(product.tags) ? product.tags : product.tags.split(',')).map((tag, i) => (
                <Link key={i} to={`/explorar?tag=${tag.trim()}`} className="px-3 py-1.5 bg-[#111] border border-white/5 rounded-full text-[0.7rem] font-bold text-[#888] hover:text-white hover:border-white/20 transition-all">
                  #{tag.trim()}
                </Link>
              ))}
            </div>
          )}
        </aside>

        {/* --- RIGHT COL: MAIN CONTENT --- */}
        <main className="product-main-content flex flex-col gap-10">

          {/* Header Title & Breadcrumb-ish */}
          <div className="flex flex-col gap-2">
            <h1 className="text-[3.5rem] font-black text-white leading-[1.1] tracking-tight drop-shadow-2xl">
              {product.name}
            </h1>
            <div className="flex items-center gap-2 text-sm text-[#888] font-bold">
              <span>Por</span>
              <Link to={`/@${product.users?.nickname}`} className="text-white hover:text-violet-400 flex items-center gap-1.5 transition-colors">
                {product.users?.nickname}
                {product.users?.is_verified && <BsPatchCheckFill size={14} className="text-violet-500" />}
              </Link>
            </div>
          </div>

          {/* Pricing / Licenses Section */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-white text-[1rem] font-black uppercase tracking-widest">Licencias de Uso</h3>
              <button className="text-[0.75rem] font-bold text-[#666] hover:text-white flex items-center gap-1.5 transition-colors">
                <BiPlus size={16} /> Comparar
              </button>
            </div>

            {product.product_type === 'beat' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.available_licenses.map(lic => (
                  <LicenseCard
                    key={lic.id}
                    lic={lic}
                    isSelected={selectedLicense === lic.id}
                    onClick={() => setSelectedLicense(lic.id)}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-[#111] border border-white/5 p-8 rounded-2xl flex flex-col items-center gap-6 text-center">
                <div className="text-[0.7rem] font-black uppercase tracking-[4px] text-[#555]">Inversión Única</div>
                <div className="text-[3rem] font-black text-white">{formatPrice(product.price_basic)}</div>
                <div className="text-gray-500 font-medium max-w-[300px]">Acceso total e instantáneo a todos los archivos y sonidos incluidos.</div>
              </div>
            )}

            {/* Main Checkout Button */}
            <button
              onClick={handleAddToCart}
              className="w-full py-5 bg-white hover:bg-[#f0f0f0] text-black font-black uppercase tracking-[2px] text-sm rounded-xl flex items-center justify-center gap-4 transition-all shadow-[0_4px_30px_rgba(255,255,255,0.1)] active:scale-[0.982]"
            >
              <ShoppingCart size={20} />
              Comprar {product.product_type === 'beat' ? activeLicense?.name : 'Kit'} • {formatPrice(product.product_type === 'beat' ? activeLicense?.price : product.price_basic)}
            </button>
            <p className="text-center text-[0.7rem] font-bold uppercase tracking-widest text-[#444] flex items-center justify-center gap-2">
              <BiCheck className="text-green-500" size={18} /> Pago Protegido & Entrega Inmediata
            </p>
          </div>

          {/* Waveform Player Section */}
          <div className="bg-[#111] p-8 rounded-2xl border border-white/5 flex flex-col gap-6 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-900/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-8 relative z-10">
              <button
                onClick={handlePlay}
                className="w-16 h-16 bg-white hover:bg-[#eee] rounded-full flex items-center justify-center text-black shadow-lg transition-transform hover:scale-105 active:scale-90"
              >
                {isCurrent && isPlaying ? <BiPause size={36} /> : <BiPlay size={36} className="ml-1" />}
              </button>
              <div className="flex-1 h-[60px] relative">
                {waveLoading && secureAudioUrl && (
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase font-black tracking-widest text-[#444] animate-pulse">
                    Analizando Audio...
                  </div>
                )}
                <div ref={waveformRef} className={`w-full h-full ${isCurrent ? 'opacity-100' : 'opacity-40'} transition-opacity`} />
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setIsDescOpen(!isDescOpen)}
              className="flex items-center justify-between py-3 border-b border-white/5 text-[0.8rem] font-black uppercase tracking-widest text-white group"
            >
              Descripción
              <BiChevronDown className={`transition-transform duration-300 ${isDescOpen ? 'rotate-180' : ''}`} size={20} />
            </button>
            {isDescOpen && (
              <div className="text-[#888] text-[0.95rem] leading-relaxed whitespace-pre-line animate-in fade-in slide-in-from-top-2 duration-300">
                {product.description || "Sin descripción disponible para este producto."}
              </div>
            )}
          </div>

          {/* Terms Section */}
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setIsTermsOpen(!isTermsOpen)}
              className="flex items-center justify-between py-3 border-b border-white/5 text-[0.8rem] font-black uppercase tracking-widest text-white group"
            >
              Términos de Uso
              <BiPlus className={`transition-transform duration-300 ${isTermsOpen ? 'rotate-45' : ''}`} size={20} />
            </button>
            {isTermsOpen && (
              <div className="text-[#666] text-[0.85rem] leading-relaxed bg-[#111]/30 p-5 rounded-xl border border-white/[0.03] animate-in fade-in zoom-in-95 duration-200">
                {product.product_type === 'beat' ? (
                  <p>Este producto está sujeto a licencias de uso. La descarga gratuita permite el uso únicamente para plataformas no monetizadas. Para distribución en plataformas digitales (Spotify, Apple Music, etc.) es obligatorio adquirir una licencia comercial.</p>
                ) : (
                  <p>Este Kit es 100% Royalty Free para la creación de nuevas obras musicales. Está prohibida la reventa de las muestras individuales sin consentimiento del autor.</p>
                )}
              </div>
            )}
          </div>

          {/* Related Products Grid */}
          <div className="related-section mt-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-white text-[1.4rem] font-black tracking-tight">Recomendado para ti</h3>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-[#555] hover:text-white hover:border-white/10 cursor-pointer transition-colors"><BiPlay /></div>
                <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-[#555] hover:text-white hover:border-white/10 cursor-pointer transition-colors"><BiPlay className="rotate-180" /></div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map(p => (
                <Link key={p.id} to={`/${p.product_type}/${p.public_slug || p.id}`} className="group flex flex-col gap-3">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-[#111] border border-white/5">
                    <img src={p.image_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <BiPlay size={40} className="text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-white font-bold text-[0.85rem] truncate">{p.name}</span>
                    <span className="text-[#555] text-[0.7rem] font-black uppercase tracking-wider">{p.users?.nickname}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </main>

      </div>
    </div>
  );
};

// --- SMALL HELPER COMPONENTS ---

const InfoRow = ({ label, val, isCapitalized }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/[0.03] text-[0.8rem]">
    <span className="text-[#555] font-bold">{label}</span>
    <span className={`text-[#bbb] font-extrabold ${isCapitalized ? 'capitalize' : ''}`}>{val}</span>
  </div>
);

const LicenseCard = ({ lic, isSelected, onClick, formatPrice }) => (
  <div
    onClick={onClick}
    className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col gap-4 cursor-pointer relative overflow-hidden ${isSelected ? 'border-violet-500 bg-violet-950/10 shadow-[0_0_30px_rgba(139,92,246,0.1)]' : 'border-white/5 bg-[#111] hover:bg-[#151515] hover:border-white/10'
      }`}
  >
    {/* active indicator top bar */}
    <div className={`absolute top-0 left-0 w-full h-[3px] transition-all ${isSelected ? 'bg-violet-600' : 'bg-transparent'}`}></div>

    <div className="flex justify-between items-start">
      <div className="flex flex-col gap-0.5">
        <span className={`text-[10px] font-black uppercase tracking-[2px] ${isSelected ? 'text-violet-500' : 'text-[#555]'}`}>{lic.name}</span>
        <span className="text-[1.8rem] font-black text-white leading-none mt-1">{formatPrice(lic.price)}</span>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-violet-600 bg-violet-600' : 'border-[#333]'}`}>
        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
      </div>
    </div>

    <div className="flex flex-col gap-2.5 mt-2">
      {lic.features.map((f, i) => (
        <div key={i} className="flex items-center gap-2.5 text-[0.75rem] font-semibold text-[#888]">
          <BiCheck className={`shrink-0 ${isSelected ? 'text-violet-500' : 'text-gray-600'}`} size={16} />
          {f}
        </div>
      ))}
    </div>
  </div>
);

export default ProductDetail;