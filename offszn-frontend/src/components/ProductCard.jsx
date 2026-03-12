import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { usePlayerStore } from '../store/playerStore';
import SecureImage from './ui/SecureImage';
import { useCurrencyStore } from '../store/currencyStore';
import toast from 'react-hot-toast';

const ProductCard = ({ product }) => {
    const { addItem } = useCartStore();
    const { formatPrice } = useCurrencyStore();
    const { currentTrack, isPlaying: globalPlaying, playTrack, togglePlay } = usePlayerStore();

    const isPlaying = globalPlaying && currentTrack?.id === product.id;
    const productUrl = `/${product.product_type || 'beat'}/${product.public_slug || product.id}`;

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product);
        toast.success(`Añadido: ${product.name}`);
    };

    return (
        <Link to={productUrl} className="group relative bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/5 hover:border-violet-500/50 transition-all duration-300 hover:-translate-y-1 block">
            <div className="relative aspect-square">
                <SecureImage
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (isPlaying) {
                                togglePlay();
                            } else {
                                playTrack(product);
                            }
                        }}
                        className="w-14 h-14 bg-violet-600 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all border-2 border-white/20"
                    >
                        {isPlaying ? (
                            <i className="bi bi-pause-fill text-3xl"></i>
                        ) : (
                            <i className="bi bi-play-fill text-3xl ml-1"></i>
                        )}
                    </button>
                </div>
            </div>
            <div className="p-4">
                <h3 className="text-white font-bold text-sm truncate group-hover:text-violet-400 transition-colors uppercase tracking-tight">{product.name}</h3>
                <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest mt-0.5">
                    {product.users?.nickname || product.producer_nickname || 'Productor'}
                </p>
                <div className="flex items-center justify-between mt-3">
                    <span className={`text-sm font-black ${product.is_free ? 'text-green-500' : 'text-violet-300'}`}>
                        {product.is_free ? 'FREE' : formatPrice(product.price_basic)}
                    </span>
                    <button
                        onClick={handleAddToCart}
                        className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <i className="bi bi-cart-plus text-lg"></i>
                    </button>
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
