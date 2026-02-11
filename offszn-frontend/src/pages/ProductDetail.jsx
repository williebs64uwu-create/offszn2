import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { usePlayerStore } from '../store/playerStore';
import { useCartStore } from '../store/cartStore';
import { useCurrencyStore } from '../store/currencyStore';
import { BiPlay, BiPause, BiCartPlus, BiInfoCircle, BiLayoutThreeColumns, BiHeart, BiUpload, BiPlusLg, BiChevronDown, BiPatchCheckFill, BiDownload, BiArrowDownCircle } from 'react-icons/bi';
import '../styles/product-premium.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLicense, setSelectedLicense] = useState('basic');
  const [activeAccordion, setActiveAccordion] = useState(['desc', 'terms']);

  const addToCart = useCartStore(state => state.addToCart);
  const { formatPrice } = useCurrencyStore();
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayerStore();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        // Intentar buscar por ID or Slug (backend manejara esto si lo implementamos)
        const response = await apiClient.get(`/products/${id}`);
        const found = response.data;

        if (found) {
          setProduct({
            ...found,
            available_licenses: [
              { id: 'basic', name: 'Basic Lease', price: found.price_basic, features: ['MP3', '5,000 Streams'] },
              { id: 'premium', name: 'Premium Lease', price: found.price_premium || (found.price_basic + 20), features: ['MP3', 'WAV', '50,000 Streams'] },
              { id: 'unlimited', name: 'Unlimited', price: found.price_exclusive || (found.price_basic + 80), features: ['MP3', 'WAV', 'STEMS', 'Ilimitado'] }
            ].filter(l => l.price > 0 || found.is_free)
          });
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        // Fallback for demo/safety
        // navigate('/explorar');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [id, navigate]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!product) return <div className="min-h-screen bg-black flex flex-center text-white">Producto no encontrado</div>;

  const isCurrent = currentTrack?.id === product.id;

  const handlePlay = (e) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(product);
    }
  };

  const toggleAccordion = (section) => {
    setActiveAccordion(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const handleAddToCart = () => {
    addToCart(product, selectedLicense);
    // window.toast.success('Añadido al carrito');
  };

  const handleFreeDownload = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para descargar');
      navigate('/auth/login');
      return;
    }

    try {
      toast.loading('Iniciando descarga...', { id: 'free-dl' });
      const { data } = await apiClient.post('/orders/free', { productId: product.id });
      toast.success('¡Orden gratuita generada!', { id: 'free-dl' });
      // In a real app, logic to start the actual file download would go here
      // For now we just register the order
      navigate('/biblioteca');
    } catch (err) {
      toast.error('Error al procesar la descarga', { id: 'free-dl' });
    }
  };

  const renderBuyingModule = () => {
    const isKit = ['drumkit', 'loopkit', 'presets', 'plantilla'].includes(product.product_type?.toLowerCase());

    if (isKit) {
      return (
        <div id="buying-modules">
          <button className="btn-purchase-kit" onClick={handleAddToCart}>
            {product.is_free ? 'DESCARGA GRATIS' : `COMPRAR KIT - ${formatPrice(product.price_basic)}`}
          </button>
          <button onClick={handleFreeDownload} className="btn-minimal-link" style={{ margin: '10px auto', width: '100%', justifyContent: 'center' }}>
            <BiArrowDownCircle /> Descargar Demo / Gratis
          </button>
        </div>
      );
    }

    return (
      <div id="buying-modules">
        <div className="section-headline flex justify-between items-center">
          <span>Licencias</span>
          <button className="btn-minimal-link text-sm">
            <BiLayoutThreeColumns /> Comparar
          </button>
        </div>

        <div className="license-grid-v2">
          {product.available_licenses.map((lic) => (
            <div
              key={lic.id}
              className={`license-card-v2 ${selectedLicense === lic.id ? 'selected' : ''}`}
              onClick={() => setSelectedLicense(lic.id)}
            >
              <div className="lic-card-header">
                <span className="lic-name">{lic.name}</span>
                <BiInfoCircle className="lic-details-trigger" />
              </div>
              <div className="lic-card-body">
                <span className="lic-files-preview">{lic.features.join(' + ')}</span>
                <span className="lic-price-v2">{formatPrice(lic.price)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="beat-actions-footer mt-5 flex flex-col gap-2">
          <button className="btn-glass-primary w-full" onClick={handleAddToCart}>
            <BiCartPlus /> Añadir al Carrito
          </button>
          {product.is_free && (
            <button onClick={handleFreeDownload} className="btn-minimal-link w-full justify-center">
              <BiDownload /> Descargar Gratis (MP3 con Tag)
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="product-page-container" className="bg-black min-h-screen">
      <div className="product-split-layout">
        <div className="product-sidebar">
          <div className="product-cover-art relative group rounded-2xl overflow-hidden aspect-square">
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center">
              <button onClick={handlePlay} className="w-20 h-20 bg-violet-600 rounded-full flex items-center justify-center text-white shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                {isCurrent && isPlaying ? <BiPause size={48} /> : <BiPlay size={48} className="ml-1" />}
              </button>
            </div>
          </div>

          <div className="action-row flex justify-center mt-6 gap-4">
            <button className="action-btn-icon flex flex-col items-center gap-1">
              <BiHeart size={24} />
              <span className="text-xs text-zinc-500">{product.likes_count || 0}</span>
            </button>
            <button className="action-btn-icon">
              <BiUpload size={24} />
            </button>
            <button className="action-btn-icon">
              <BiPlusLg size={24} />
            </button>
          </div>

          <div className="info-list mt-8 bg-zinc-900/50 p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-[2px]">Detalles Técnicos</div>
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Publicado</span> <span className="text-white">Reciente</span></div>
            {product.bpm && <div className="flex justify-between text-sm"><span className="text-zinc-500">BPM</span> <span className="text-white">{product.bpm}</span></div>}
            {product.key && <div className="flex justify-between text-sm"><span className="text-zinc-500">Key</span> <span className="text-white">{product.key}</span></div>}
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Reproducciones</span> <span className="text-white">{product.plays_count || 0}</span></div>
          </div>

          {product.tags && (
            <div className="tags-row flex flex-wrap gap-2 mt-6">
              {product.tags.split(',').map(tag => (
                <span key={tag} className="px-3 py-1 bg-zinc-900 text-zinc-400 text-[10px] font-bold rounded-full border border-white/5 uppercase">#{tag.trim()}</span>
              ))}
            </div>
          )}
        </div>

        <div className="product-main-content pt-10">
          <div>
            <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-4 tracking-tight uppercase">{product.name}</h1>
            <Link to={`/u/${product.users?.nickname || product.producer_nickname}`} className="text-violet-400 text-lg font-bold hover:text-violet-300 transition-colors flex items-center gap-2">
              {product.users?.nickname || product.producer_nickname || 'Productor'}
              <BiPatchCheckFill className="text-violet-500" />
            </Link>
          </div>

          <div className="mt-10">
            {renderBuyingModule()}
          </div>

          <div className="mt-10 space-y-4">
            <div className="border-t border-white/10 pt-6">
              <button onClick={() => toggleAccordion('desc')} className="flex items-center justify-between w-full text-lg font-bold text-white uppercase tracking-wider">
                <span>Información</span>
                <BiChevronDown className={`transition-transform duration-300 ${activeAccordion.includes('desc') ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${activeAccordion.includes('desc') ? 'max-h-96 mt-4' : 'max-h-0'}`}>
                <p className="text-zinc-400 leading-relaxed italic">
                  {product.description || "Sin descripción proporcionada."}
                </p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <button onClick={() => toggleAccordion('terms')} className="flex items-center justify-between w-full text-lg font-bold text-white uppercase tracking-wider">
                <span>Licencia y Uso</span>
                <BiChevronDown className={`transition-transform duration-300 ${activeAccordion.includes('terms') ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${activeAccordion.includes('terms') ? 'max-h-96 mt-4' : 'max-h-0'}`}>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Al adquirir este producto, obtienes una licencia de uso limitada según el plan seleccionado. Está prohibido el re-sellado o distribución no autorizada.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
