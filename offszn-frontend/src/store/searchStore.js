import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../api/client';

export const useSearchStore = create(
    persist(
        (set, get) => ({
            query: '',
            category: 'Todo',
            results: [],
            history: ['Dark Piano', 'Tainy Drums'],
            loading: false,

            // Search Cache
            cache: {
                products: null,
                users: null,
                profileMap: {},
                lastFetch: 0
            },

            setQuery: (query) => set({ query }),
            setCategory: (category) => set({ category }),

            // Helper: Normalize string for comparison
            normalizeString: (str) => {
                if (!str) return '';
                return str.toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "") // Remove accents
                    .replace(/\s+/g, '')             // Remove spaces
                    .replace(/[^\w]/g, '');          // Remove symbols
            },

            // Helper: Dice Coefficient for fuzzy similarity
            getSimilarity: (s1, s2) => {
                const n1 = get().normalizeString(s1);
                const n2 = get().normalizeString(s2);
                if (n1 === n2) return 1.0;
                if (n1.length < 2 || n2.length < 2) return 0;

                const bigrams1 = new Set();
                for (let i = 0; i < n1.length - 1; i++) bigrams1.add(n1.substring(i, i + 2));
                const bigrams2 = new Set();
                for (let i = 0; i < n2.length - 1; i++) bigrams2.add(n2.substring(i, i + 2));

                let intersection = 0;
                for (const b of bigrams1) {
                    if (bigrams2.has(b)) intersection++;
                }
                return (2.0 * intersection) / (bigrams1.size + bigrams2.size);
            },

            getSearchCache: async () => {
                const now = Date.now();
                const { cache } = get();

                // Cache valid for 5 minutes
                if (cache.products && cache.users && (now - cache.lastFetch < 300000)) {
                    return cache;
                }

                try {
                    const [pRes, uRes] = await Promise.all([
                        supabase.from('products').select('*').eq('visibility', 'public').neq('status', 'draft'),
                        supabase.from('users').select('id, nickname, avatar_url, is_verified, is_producer').eq('is_producer', true)
                    ]);

                    let profileMap = {};
                    if (uRes.data) {
                        uRes.data.forEach(u => profileMap[u.id] = u);
                    }

                    const newCache = {
                        products: pRes.data || [],
                        users: uRes.data || [],
                        profileMap: profileMap,
                        lastFetch: now
                    };
                    set({ cache: newCache });
                    return newCache;
                } catch (err) {
                    console.error("Search cache fetch error:", err);
                    return cache; // Return old cache as fallback
                }
            },

            performSearch: async (query, category) => {
                if (!query || query.trim().length === 0) {
                    set({ results: [] });
                    return;
                }

                set({ loading: true });
                const lQuery = query.toLowerCase().trim();
                const normQuery = get().normalizeString(lQuery);

                const cache = await get().getSearchCache();
                if (!cache.products || !cache.users) {
                    set({ loading: false });
                    return;
                }

                // 1. Search Users (Producers)
                let matchedUsers = [];
                if (!category || category === 'Todo' || category === 'Productores') {
                    matchedUsers = cache.users.filter(u => {
                        const nick = (u.nickname || '').toLowerCase();
                        const normNick = get().normalizeString(nick);
                        const similarity = get().getSimilarity(nick, lQuery);
                        return nick.includes(lQuery) || normNick.includes(normQuery) || similarity > 0.7;
                    }).slice(0, 3);
                }

                // 2. Search Products
                let matchedProducts = [];
                if (!category || category !== 'Productores') {
                    matchedProducts = cache.products.filter(p => {
                        const name = (p.name || '').toLowerCase();
                        const normName = get().normalizeString(name);
                        const producer = cache.profileMap[p.producer_id];
                        const prodName = producer ? (producer.nickname || '').toLowerCase() : '';
                        const normProd = get().normalizeString(prodName);

                        const matchesCat = (!category || category === 'Todo') ? true :
                            (category === 'Beats' ? p.product_type === 'beat' :
                                category === 'Drum Kits' ? p.product_type === 'drumkit' :
                                    (category === 'Samples' || category === 'Loops & Samples') ? p.product_type === 'loopkit' :
                                        category === 'Presets' ? p.product_type === 'preset' :
                                            category === 'Plantillas' ? p.product_type === 'plantilla' : true);

                        if (!matchesCat) return false;

                        return name.includes(lQuery) || normName.includes(normQuery) || prodName.includes(lQuery) || normProd.includes(normQuery);
                    }).slice(0, 3);
                }

                // Fallback: If no results, show top products
                let finalResults = [];
                if (matchedProducts.length === 0 && matchedUsers.length === 0) {
                    finalResults = [...cache.products]
                        .sort((a, b) => (b.plays_count || 0) - (a.plays_count || 0))
                        .slice(0, 3)
                        .map(p => ({ ...p, isFallback: true }));
                } else {
                    // Map Users to unified format
                    const userItems = matchedUsers.map(u => ({
                        type: 'user',
                        id: u.id,
                        nickname: u.nickname,
                        avatar_url: u.avatar_url,
                        is_verified: u.is_verified,
                        title: u.nickname,
                        img: u.avatar_url
                    }));

                    // Map Products to unified format
                    const productItems = matchedProducts.map(p => {
                        const producer = cache.profileMap[p.producer_id];
                        return {
                            ...p,
                            type: p.product_type,
                            title: p.name,
                            producer_name: producer ? producer.nickname : 'Productor',
                            img: p.image_url
                        };
                    });

                    // Interleave or combine as per legacy logic (Users priority if small list)
                    if (userItems.length > 0) {
                        finalResults = [...userItems, ...productItems].slice(0, 5);
                    } else {
                        finalResults = productItems;
                    }
                }

                set({ results: finalResults, loading: false });
            },

            addToHistory: (term) => {
                const { history } = get();
                const newHistory = [term, ...history.filter((t) => t !== term)].slice(0, 50);
                set({ history: newHistory });
            },

            removeHistoryItem: (term) => {
                const { history } = get();
                set({ history: history.filter((t) => t !== term) });
            }
        }),
        {
            name: 'offszn-search-history',
            partialize: (state) => ({ history: state.history }),
        }
    )
);
