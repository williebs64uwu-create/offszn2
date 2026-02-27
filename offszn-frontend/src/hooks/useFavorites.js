import { useState, useCallback } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../store/authStore';
import toast from 'react-hot-toast';

export const useFavorites = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [favorites, setFavorites] = useState([]);

    const fetchFavorites = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const response = await apiClient.get('/social/favorites');
            setFavorites(response.data || []);
        } catch (error) {
            console.error('Error fetching favorites:', error);
            toast.error('No se pudieron cargar tus favoritos');
        } finally {
            setLoading(false);
        }
    }, [user]);

    const toggleFavorite = async (productId) => {
        if (!user) {
            toast.error('Debes iniciar sesión para guardar favoritos');
            return false;
        }

        try {
            const response = await apiClient.post(`/social/favorites/${productId}/toggle`);
            const { liked } = response.data;

            if (liked) {
                toast.success('Añadido a favoritos');
            } else {
                toast.success('Eliminado de favoritos');
            }

            return liked;
        } catch (error) {
            console.error('Error toggling favorite:', error);
            toast.error('Error al actualizar favoritos');
            return null;
        }
    };

    return {
        favorites,
        loading,
        fetchFavorites,
        toggleFavorite
    };
};
