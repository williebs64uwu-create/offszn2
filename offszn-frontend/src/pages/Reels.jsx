import React, { useEffect, useRef, useState } from 'react';
import { useReelsStore } from '../store/useReelsStore';
import { useAuthStore } from '../store/authStore';
import ReelItem from '../components/reels/ReelItem';
import { Loader2, Music2 } from 'lucide-react';

const Reels = () => {
    const { user } = useAuthStore();
    const { reels, fetchReels, checkIfLiked, loading, error } = useReelsStore();
    const containerRef = useRef(null);
    const [activeReelId, setActiveReelId] = useState(null);

    useEffect(() => {
        fetchReels().then(() => {
            if (user) checkIfLiked(user.id);
        });
    }, [user]);

    useEffect(() => {
        const options = {
            root: containerRef.current,
            threshold: 0.8 // 80% visibility to trigger "active"
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const reelId = entry.target.dataset.reelId;
                    setActiveReelId(reelId);
                }
            });
        }, options);

        const items = containerRef.current?.querySelectorAll('.reel-snap-item');
        items?.forEach(item => observer.observe(item));

        return () => items?.forEach(item => observer.disconnect());
    }, [reels]);

    if (loading && !reels.length) {
        return (
            <div className="flex-1 bg-black flex flex-col items-center justify-center text-white">
                <Loader2 className="animate-spin mb-4" size={48} />
                <p className="text-gray-500 animate-pulse">Cargando Reels...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 bg-black flex flex-col items-center justify-center text-white p-10 text-center">
                <h2 className="text-xl font-bold mb-2">Error al cargar</h2>
                <p className="text-gray-500 mb-6">{error}</p>
                <button
                    onClick={fetchReels}
                    className="bg-white text-black px-6 py-2 rounded-full font-bold"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-black overflow-hidden flex justify-center">
            <div
                ref={containerRef}
                className="w-full max-w-[450px] h-[calc(100vh-64px)] overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black border-x border-[#262626]/50"
            >
                {reels.length > 0 ? (
                    reels.map((reel) => (
                        <div
                            key={reel.id}
                            data-reel-id={reel.id}
                            className="reel-snap-item w-full h-full snap-start snap-always relative border-b border-[#121212]"
                        >
                            <ReelItem
                                reel={reel}
                                isActive={activeReelId === reel.id.toString()}
                            />
                        </div>
                    ))
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white p-10 text-center">
                        <Music2 size={64} className="text-gray-800 mb-4" />
                        <h3 className="text-xl font-bold">No hay Reels aún</h3>
                        <p className="text-gray-500 mt-2">¡Sé el primero en subir un video!</p>
                    </div>
                )}
            </div>

            <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
        </div>
    );
};

export default Reels;
