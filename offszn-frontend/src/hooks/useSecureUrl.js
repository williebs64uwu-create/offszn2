
import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

const urlCache = new Map();

/**
 * Hook to resolve secure URLs for R2 assets (or return transparently if public/local).
 * @param {string} originalUrl - The raw URL from DB (e.g. "avatars/user.jpg" or "https://r2.../file.mp3")
 * @returns {Object} { url, loading, error }
 */
export const useSecureUrl = (originalUrl) => {
    // Initial check to avoid one-frame delay for cached URLs
    const [url, setUrl] = useState(() => {
        if (!originalUrl) return null;
        if (urlCache.has(originalUrl)) return urlCache.get(originalUrl);
        // If it looks like an R2 key (relative), return null so we don't try to load it as a bunk URL
        const isR2Key = !originalUrl.startsWith('http') && !originalUrl.startsWith('data:') && !originalUrl.startsWith('/');
        if (isR2Key) return null;
        return originalUrl;
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!originalUrl) {
            setUrl(null);
            return;
        }

        // 1. Check Cache
        if (urlCache.has(originalUrl)) {
            setUrl(urlCache.get(originalUrl));
            return;
        }

        // 2. Logic to detect R2
        // If it starts with http/https and NOT r2, it's public (e.g. Supabase, Google, etc)
        // EXCEPT if it is an explicit R2 domain.
        const isR2 = originalUrl.includes('r2.cloudflarestorage.com') ||
            originalUrl.includes('.r2.dev') ||
            (!originalUrl.startsWith('http') && !originalUrl.startsWith('data:') && !originalUrl.startsWith('/'));
        // Note: Relative paths in DB are often R2 keys in this system.

        if (!isR2) {
            setUrl(originalUrl);
            return;
        }

        // 3. fetch Signed URL
        const fetchSignedUrl = async () => {
            setLoading(true);
            try {
                // If we already possess a "final" URL from a previous signing, we might want to check expiry,
                // but for now simplistic caching is enough for session.

                const { data } = await apiClient.post('/storage/sign-url', { key: originalUrl });
                if (data.downloadUrl) {
                    urlCache.set(originalUrl, data.downloadUrl);
                    setUrl(data.downloadUrl);
                } else {
                    // Fallback
                    setUrl(originalUrl);
                }
            } catch (err) {
                console.error("Error signing URL:", originalUrl, err);
                setError(err);
                setUrl(originalUrl); // Fallback to original so it at least fails visibly
            } finally {
                setLoading(false);
            }
        };

        fetchSignedUrl();

    }, [originalUrl]);

    return { url, loading, error };
};
