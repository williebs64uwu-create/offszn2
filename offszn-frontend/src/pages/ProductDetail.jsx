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
import { BiPlay, BiPause, BiCartAdd, BiHeart, BiShareAlt, BiCheck } from 'react-icons/bi';
import { BsPatchCheckFill } from 'react-icons/bs';
import { ShoppingCart, Download, Share2, Heart, Music2, Clock, CalendarDays, Eye, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLicense, setSelectedLicense] = useState('basic');
  const [waveLoading, setWaveLoading] = useState(true);

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
        const response = await apiClient.get(`/products/${id}`);
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
  }, [id]);

  useEffect(() => {
    if (!secureAudioUrl || !waveformRef.current) return;

    if (wavesurfer.current) {
      wavesurfer.current.destroy();
    }

    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'rgba(255, 255, 255, 0.2)',
      progressColor: '#8b5cf6', // Violet-500
      cursorColor: 'transparent',
      barWidth: 2,
      barGap: 3,
      height: 80,
      barRadius: 2,
      normalize: true,
      interact: false, // Prevent scrubbing here since StickyPlayer controls it
      backend: 'MediaElement'
    });

    // Event listeners
    wavesurfer.current.on('ready', () => {
      setWaveLoading(false);
    });

    // Use load method, we don't play it here to avoid dual tracks playing
    wavesurfer.current.load(secureAudioUrl);

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
    };
  }, [secureAudioUrl, product]);

  // Sync local waveform with global player progress IF this is the active track
  useEffect(() => {
    let animationFrame;
    const updateProgress = () => {
      if (currentTrack?.id === product?.id && isPlaying && wavesurfer.current) {
        // If the global player has progress, sync it visually.
        // Assuming we can't easily sync exact time without a global state, 
        // we'll let StickyPlayer handle audio, this is mainly visual.
      }
      animationFrame = requestAnimationFrame(updateProgress);
    };
    updateProgress();
    return () => cancelAnimationFrame(animationFrame);
  }, [currentTrack, isPlaying, product]);

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
      // Need the secure audio url to play
      playTrack({ ...product, secureAudio: secureAudioUrl });
    }
  };

  const handleAddToCart = () => {
    addItem(product, activeLicense);
    toast.success(`Añadido: ${product.name}`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-20 font-sans selection:bg-violet-500/30">
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-12 items-start">

        {/* --- SIDEBAR (Left) --- */}
        <div className="flex flex-col gap-5 w-full">
          {/* Cover Art */}
          <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/5 bg-[#111] relative group">
            <img
              src={product.image_url || 'https://via.placeholder.com/400x400/111111/333333?text=Cover'}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
              <button onClick={handlePlay} className="w-20 h-20 bg-violet-600 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 hover:bg-violet-500 transition-all">
                {isCurrent && isPlaying ? <BiPause size={46} /> : <BiPlay size={46} className="ml-2" />}
              </button>
            </div>
          </div>

          {/* Quick Info & Social Actions */}
          <div className="flex justify-center gap-8 py-3 w-full border-b border-white/5">
            <button className="flex flex-col items-center gap-2 text-gray-400 hover:text-white hover:-translate-y-1 transition-all group">
              <Heart className="w-6 h-6 group-hover:text-red-500 transition-colors" />
              <span className="text-xs font-bold text-gray-500">{product.likes_count || 0}</span>
            </button>
            <button className="flex flex-col items-center gap-2 text-gray-400 hover:text-white hover:-translate-y-1 transition-all group">
              <Share2 className="w-6 h-6 group-hover:text-blue-400 transition-colors" />
              <span className="text-xs font-bold text-gray-500">Share</span>
            </button>
            <button className="flex flex-col items-center gap-2 text-gray-400 hover:text-white hover:-translate-y-1 transition-all group">
              <Eye className="w-6 h-6 transition-colors" />
              <span className="text-xs font-bold text-gray-500">{product.plays_count || 0}</span>
            </button>
          </div>

          {/* Producer Info & Button */}
          <div className="bg-[#111] rounded-xl p-5 border border-white/5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#222]">
                <img src={product.users?.avatar_url || `https://ui-avatars.com/api/?name=${product.producer_nickname}&background=111&color=fff`} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Productor</span>
                <Link to={`/u/${product.users?.nickname || product.producer_nickname}`} className="text-white hover:text-violet-400 transition font-bold text-lg flex items-center gap-1.5">
                  {product.users?.nickname || product.producer_nickname || 'Productor'}
                  {product.users?.is_verified && <BsPatchCheckFill size={14} className="text-blue-500" />}
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* --- MAIN CONTENT (Right) --- */}
        <div className="flex flex-col gap-8 w-full">

          {/* Header: Title & Player */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-sm font-medium text-gray-400">
              <span className="px-2.5 py-1 bg-[#1a1a1a] border border-white/5 rounded-md text-[10px] uppercase tracking-widest text-[#8b5cf6] font-bold">
                {product.product_type?.toUpperCase() || 'BEAT'}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black leading-tight truncate text-white drop-shadow-md" title={product.name}>
              {product.name}
            </h1>

            <div className="flex items-center gap-6 mt-2 text-sm text-gray-400 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-500" /> {product.bpm ? `${product.bpm} BPM` : '--'}</span>
              <span className="flex items-center gap-1.5"><Music2 className="w-4 h-4 text-gray-500" /> {product.key || '--'}</span>
              <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-gray-500" /> {new Date(product.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</span>
            </div>

            {/* Player / Waveform visual */}
            <div className="mt-4 bg-[#111] p-6 rounded-2xl border border-white/5 flex items-center gap-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <button onClick={handlePlay} className="w-16 h-16 shrink-0 bg-white hover:bg-gray-200 rounded-full flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-transform hover:scale-105 relative z-10">
                {isCurrent && isPlaying ? <BiPause size={36} /> : <BiPlay size={36} className="ml-1" />}
              </button>
              <div className="flex-1 overflow-hidden relative z-10" style={{ height: '80px' }}>
                {waveLoading && secureAudioUrl && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 font-bold uppercase tracking-widest animate-pulse">
                    Generando onda...
                  </div>
                )}
                {!secureAudioUrl && !audioUrlLoading && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 font-bold uppercase tracking-widest">
                    Audio no disponible
                  </div>
                )}
                <div ref={waveformRef} className={`w-full h-full pointer-events-none ${isCurrent && isPlaying ? 'opacity-100' : 'opacity-50'} transition-opacity`} />
              </div>
            </div>

            {/* Tags */}
            {product.tags && (
              <div className="flex flex-wrap gap-2 mt-2">
                {(Array.isArray(product.tags) ? product.tags : product.tags.split(',')).map((tag, i) => (
                  <span key={i} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#111] text-gray-300 text-xs font-bold uppercase tracking-wider rounded-full border border-white/5 hover:border-violet-500/30 hover:bg-violet-900/10 transition cursor-default">
                    <Tag className="w-3 h-3 text-violet-500" />
                    {typeof tag === 'string' ? tag.trim() : tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* LICENSES SECTION */}
          {product.available_licenses && product.available_licenses.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xl font-bold mb-5 flex items-center gap-3 text-white">
                Licencias de Uso <span className="h-px flex-1 bg-white/5 mt-1"></span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.available_licenses.map((lic) => (
                  <div
                    key={lic.id}
                    onClick={() => setSelectedLicense(lic.id)}
                    className={`relative p-6 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col gap-4 overflow-hidden ${selectedLicense === lic.id
                      ? 'border-violet-500 bg-[#160c28] shadow-[0_0_30px_rgba(139,92,246,0.1)] -translate-y-1'
                      : 'border-white/5 bg-[#111] hover:border-white/20 hover:bg-[#141414]'
                      }`}
                  >
                    {/* Status Line */}
                    <div className={`absolute top-0 left-0 w-full h-1 ${selectedLicense === lic.id ? 'bg-violet-500' : 'bg-transparent'}`}></div>

                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className={`text-xs font-black uppercase tracking-widest ${selectedLicense === lic.id ? 'text-violet-400' : 'text-gray-500'}`}>
                          {lic.name}
                        </span>
                        <span className="text-2xl font-black text-white mt-1">
                          {formatPrice(lic.price)}
                        </span>
                      </div>
                      {/* Custom Radio */}
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedLicense === lic.id ? 'border-violet-500 bg-violet-500' : 'border-gray-600'}`}>
                        {selectedLicense === lic.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-2">
                      {lic.features.map((f, i) => (
                        <span key={i} className="flex items-center gap-2 text-[13px] text-gray-400 font-medium">
                          <BiCheck size={16} className={selectedLicense === lic.id ? 'text-violet-400' : 'text-green-500/70'} /> {f}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Main CTA */}
              <div className="mt-8">
                <button
                  onClick={handleAddToCart}
                  className="w-full py-5 bg-white hover:bg-gray-200 text-black font-black uppercase tracking-widest text-sm rounded-xl flex items-center justify-center gap-3 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.1)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.2)] active:scale-[0.98]"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>AÑADIR {activeLicense?.name} AL CARRITO • {formatPrice(activeLicense?.price || 0)}</span>
                </button>

                <p className="text-center text-xs text-gray-600 font-medium mt-4 flex items-center justify-center gap-2">
                  <BiCheck className="text-green-500" size={16} /> Pago 100% seguro. Entrega inmediata al correo.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProductDetail;