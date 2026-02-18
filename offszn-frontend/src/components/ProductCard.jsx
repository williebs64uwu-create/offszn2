
import React from 'react';
import { useSecureUrl } from '../hooks/useSecureUrl';

const ProductCard = ({ product, isPlaying, onPlay, formatPrice }) => {
    const { url: imageUrl, loading } = useSecureUrl(product.image_url);

    return (
        <div className="group relative bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/5 hover:border-violet-500/50 transition-all duration-300 hover:-translate-y-1">
            <div className="relative aspect-square">
                {loading ? (
                    <div className="w-full h-full bg-zinc-800 animate-pulse" />
                ) : (
                    <img
                        src={imageUrl || '/placeholder.jpg'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                )}

                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button
                        onClick={onPlay}
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
                <h3 className="text-white font-bold text-sm truncate">{product.name}</h3>
                <p className="text-zinc-500 text-xs mb-3">
                    {product.users?.nickname || product.producer_nickname || 'Productor'}
                </p>
                <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${product.is_free ? 'text-green-500' : 'text-violet-300'}`}>
                        {product.is_free ? 'FREE' : formatPrice(product.price_basic)}
                    </span>
                    <button className="text-zinc-400 hover:text-white transition-colors">
                        <i className="bi bi-cart-plus text-lg"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
