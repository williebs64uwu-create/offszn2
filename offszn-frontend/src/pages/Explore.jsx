import React, { useEffect, useState } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { useSearchStore } from '../store/searchStore';
import { apiClient } from '../api/client';
import { useCurrencyStore } from '../store/currencyStore';

const Explore = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playTrack, currentTrack, isPlaying, setPlaylist } = usePlayerStore();
  const { results, query, isSearching } = useSearchStore();
  const { formatPrice } = useCurrencyStore();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Si hay resultados de búsqueda en el store, los usamos
        if (results.length > 0 || query !== '') {
          setProducts(results);
          setPlaylist(results);
          setLoading(false);
          return;
        }

        // Si no hay búsqueda activa, cargamos todo
        const response = await apiClient.get('/products');
        setProducts(response.data);
        setPlaylist(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [results, query, setPlaylist]);

  const handlePlay = (product) => {
    if (currentTrack?.id === product.id) {
      usePlayerStore.getState().togglePlay();
    } else {
      playTrack(product);
    }
  };

  if (loading || isSearching) {
    return <ExploreSkeleton />;
  }

  return (
    <div className="pb-32 pt-10 min-h-screen bg-black">
      {/* Hero Section */}
      <div className="max-w-[1400px] mx-auto px-6 mb-12">
        <div className="relative h-[300px] rounded-2xl bg-gradient-to-r from-violet-900/40 to-black border border-white/10 flex items-center p-10 overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="text-violet-400 text-xs font-bold tracking-widest uppercase bg-violet-500/10 px-3 py-1 rounded-full mb-4 inline-block">
              {query ? `Resultados para "${query}"` : 'Trending Ahora'}
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 font-display">
              {query ? 'ENCONTRAMOS TUS ' : 'ENCUENTRA TU '} <br />{query ? 'SONIDOS' : 'PRÓXIMO HIT'}
            </h1>
            <p className="text-zinc-400 mb-8 max-w-lg">
              Explora miles de beats, drum kits y loops creados por los mejores productores de la industria.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-violet-600/20 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Grid de Productos */}
      <div className="max-w-[1400px] mx-auto px-6">
        <h2 className="text-2xl font-bold text-white mb-6 font-display">
          {query ? `Mostrando ${products.length} resultados` : 'Nuevos Lanzamientos'}
        </h2>

        {products.length === 0 ? (
          <div className="text-center py-20 border border-white/5 rounded-2xl bg-zinc-900/20">
            <i className="bi bi-search text-5xl text-zinc-800 mb-4 block"></i>
            <h3 className="text-xl font-bold text-white mb-2">No encontramos resultados</h3>
            <p className="text-zinc-500">Prueba con otros términos o filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isPlaying={currentTrack?.id === product.id && isPlaying}
                onPlay={() => handlePlay(product)}
                formatPrice={formatPrice}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import ProductCard from '../components/ProductCard';

const ExploreSkeleton = () => (
  <div className="pb-32 pt-10 min-h-screen bg-black animate-pulse">
    <div className="max-w-[1400px] mx-auto px-6 mb-12">
      <div className="h-[300px] rounded-2xl bg-zinc-900 border border-white/5"></div>
    </div>
    <div className="max-w-[1400px] mx-auto px-6">
      <div className="h-8 w-48 bg-zinc-900 rounded mb-6"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
          <div key={i} className="bg-zinc-900 aspect-square rounded-xl"></div>
        ))}
      </div>
    </div>
  </div>
);

export default Explore;
