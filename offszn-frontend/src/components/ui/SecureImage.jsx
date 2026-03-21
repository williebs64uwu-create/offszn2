import React, { useState, useEffect } from 'react';
import { useSecureUrl } from '../../hooks/useSecureUrl';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Reusable image component that handles R2 signed URLs and loading states.
 * Includes a cascading fallback from R2 -> Supabase Legacy -> Local Default
 */
const SecureImage = ({ src, alt, className, skeletonClassName = "w-full h-full bg-zinc-800 animate-pulse" }) => {
    const { url: secureUrl, loading } = useSecureUrl(src);
    const [imgSrc, setImgSrc] = useState(null);

    // Sync state when custom hook completes fetching the R2 presigned URL
    useEffect(() => {
        if (!loading && secureUrl) {
            setImgSrc(secureUrl);
        } else if (!loading && !secureUrl) {
            setImgSrc('/images/portada-default.png');
        }
    }, [secureUrl, loading]);

    if (loading) {
        return <div className={skeletonClassName} />;
    }

    const handleError = () => {
        if (!imgSrc) return;

        // Is the original DB src a relative path? (e.g. 'products/covers/beat.jpg' or 'avatars/user.jpg')
        const isRelativePath = src && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('/');

        let supabaseFallbackUrl = null;
        if (isRelativePath) {
            let supabasePath = src;

            // Case 1: Key is "products/covers/[uuid]/[file]" 
            // -> Supabase used "products/[uuid]/covers/[file]"
            if (src.startsWith('products/covers/')) {
                const parts = src.split('/');
                if (parts.length >= 4) {
                    supabasePath = `products/${parts[2]}/covers/${parts.slice(3).join('/')}`;
                }
            }
            // Case 2: Key is "[uuid]/covers/[file]" (Missing bucket prefix in DB)
            // -> Supabase needs "products/[uuid]/covers/[file]"
            else if (!src.includes('/') || (!src.startsWith('products/') && !src.startsWith('avatars/') && !src.startsWith('secure-products/'))) {
                supabasePath = `products/${src}`;
            }

            supabaseFallbackUrl = `${SUPABASE_URL}/storage/v1/object/public/${supabasePath}`;
        }

        if (imgSrc === secureUrl && supabaseFallbackUrl && secureUrl !== supabaseFallbackUrl) {
            console.log(`[SecureImage] R2 404/403 for ${src}. Falling back to Supabase: ${supabaseFallbackUrl}`);
            setImgSrc(supabaseFallbackUrl);
        } else if (imgSrc !== '/images/portada-default.png') {
            console.warn(`[SecureImage] All storage sources failed for ${src}. Showing fallback cover.`);
            setImgSrc('/images/portada-default.png');
        }
    };

    return (
        <img
            src={imgSrc || '/images/portada-default.png'}
            alt={alt || ''}
            className={className}
            onError={handleError}
            loading="lazy"
        />
    );
};

export default SecureImage;
