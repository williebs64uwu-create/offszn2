import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from "../../api/client";
import { BiErrorCircle, BiPlay, BiPause, BiPencil, BiCheck } from 'react-icons/bi';
import { CheckCircle2, GripVertical } from 'lucide-react';
import { FaInstagram, FaYoutube, FaSpotify, FaDiscord, FaTwitter, FaTiktok, FaWhatsapp, FaFacebook, FaLinkedin, FaGlobe } from 'react-icons/fa';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, TouchSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/authStore';
import SecureImage from '../../components/ui/SecureImage';
import { useCurrencyStore } from '../../store/currencyStore';
import { usePlayerStore } from '../../store/playerStore';
import { supabase } from '../../api/client';
import ProfileShareModal from '../../components/profile/ProfileShareModal';
import logoImg from '../../assets/images/LOGO-OFFSZN.png';
import './Bio.css';

const ICON_MAP = {
    instagram: { icon: FaInstagram, isLarge: true },
    tiktok: { icon: FaTiktok, isLarge: true },
    youtube: { icon: FaYoutube, isLarge: true, label: "YouTube" },
    twitter: { icon: FaTwitter, isLarge: false },
    linkedin: { icon: FaLinkedin, isLarge: false },
    facebook: { icon: FaFacebook, isLarge: false },
    spotify: { icon: FaSpotify, isLarge: true, label: "Spotify" },
    discord: { icon: FaDiscord, isLarge: true, label: "Discord" },
    website: { icon: FaGlobe, isLarge: true, label: "Sitio Web" },
    whatsapp: { icon: FaWhatsapp, isLarge: true, label: "WhatsApp" }
};

const DEFAULT_ORDER = ['whatsapp', 'youtube', 'spotify', 'tiktok', 'instagram', 'discord', 'website', 'twitter', 'facebook', 'linkedin'];

// --- Sortable Item Component ---
function SortableLink({ id, link, isEditMode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 999 : 1,
        opacity: isDragging ? 0.8 : 1,
        scale: isDragging ? 1.05 : 1,
        boxShadow: isDragging ? '0 10px 30px rgba(0,0,0,0.5)' : 'none',
    };

    const Icon = link.icon;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative flex items-center w-full min-h-[64px] px-6 py-4 bg-black border rounded-[16px] transition-all duration-300 ${isEditMode ? 'border-blue-500/50 hover:bg-zinc-900/80 cursor-default' : 'border-white/20 hover:border-white hover:bg-zinc-900 transform hover:-translate-y-1'}`}
        >
            <div className="flex items-center absolute left-6">
                <Icon className="text-xl md:text-2xl text-white" />
            </div>
            <div className="flex-1 flex justify-center text-center">
                {isEditMode ? (
                    <span className="font-bold text-sm md:text-base tracking-wide select-none transition-none">{link.label}</span>
                ) : (
                    <a href={link.href} target="_blank" rel="noreferrer" className="absolute inset-0 z-10 flex items-center justify-center">
                        <span className="font-bold text-sm md:text-base tracking-wide">{link.label}</span>
                    </a>
                )}
            </div>

            {/* Drag Handle - Only visible in edit mode */}
            {isEditMode && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute right-4 text-gray-400 hover:text-white cursor-grab active:cursor-grabbing p-3 touch-none z-20"
                >
                    <GripVertical size={24} />
                </div>
            )}
        </div>
    );
}

export default function Bio() {
    const { username } = useParams();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const [isReady, setIsReady] = useState(false);

    // Edit mode state
    const [isEditMode, setIsEditMode] = useState(false);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const [orderedLargeLinks, setOrderedLargeLinks] = useState([]);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const { formatPrice } = useCurrencyStore();
    const { playTrack, currentTrack, isPlaying, setPlaylist } = usePlayerStore();
    const { user: currentUser } = useAuth();
    const isOwner = currentUser && profile && currentUser.id === profile.id;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        const fetchBioData = async () => {
            try {
                setLoading(true);
                setError(null);
                const cleanUsername = username?.startsWith('@') ? username.slice(1) : username;
                const cacheBuster = Date.now();

                const userRes = await apiClient.get(`/users/${cleanUsername}?t=${cacheBuster}`);
                setProfile(userRes.data);

                const prodRes = await apiClient.get(`/products?nickname=${cleanUsername}&t=${cacheBuster}`);
                const userProducts = prodRes.data || [];
                setProducts(userProducts.slice(0, 3)); // Only top 3 latest
                setPlaylist(userProducts);

                // Initial parse of social links for state
                try {
                    const socialsObj = typeof userRes.data.socials === 'string' ? JSON.parse(userRes.data.socials) : userRes.data.socials;
                    let customOrderedKeys = [];
                    if (userRes.data.socials_order) {
                        customOrderedKeys = typeof userRes.data.socials_order === 'string' ? JSON.parse(userRes.data.socials_order) : userRes.data.socials_order;
                    }

                    const allKnownKeys = Object.keys(socialsObj || {}).filter(k => k !== 'dynamic_theme' && k !== 'offered_services' && k !== 'spotify_content');
                    const seenKeys = new Set(customOrderedKeys);
                    const remainingKeys = allKnownKeys.filter(k => !seenKeys.has(k));
                    const orderedRemaining = DEFAULT_ORDER.filter(k => remainingKeys.includes(k));
                    const finalOrderedKeys = [...customOrderedKeys, ...orderedRemaining];

                    // Pre-calculate large links for state so dnd-kit has a stable ID array
                    const initialLargeLinks = [];
                    finalOrderedKeys.forEach(k => {
                        const val = socialsObj[k];
                        if (!val) return;
                        const iconDef = ICON_MAP[k];
                        if (iconDef && iconDef.isLarge) {
                            initialLargeLinks.push(k);
                        }
                    });
                    setOrderedLargeLinks(initialLargeLinks);

                } catch (e) {
                    console.error("Error parsing initial links", e);
                }

                // Trigger animations after a short delay
                setTimeout(() => setIsReady(true), 100);
            } catch (err) {
                console.error(err);
                setError("Perfil no encontrado o enlace inválido");
                setIsReady(true);
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            fetchBioData();
        }
    }, [username, setPlaylist]);

    const handlePlay = (product) => {
        if (currentTrack?.id === product.id) {
            usePlayerStore.getState().togglePlay();
        } else {
            playTrack(product);
        }
    };

    const getThemeColor = () => {
        const val = profile?.banner_url;
        if (!val) return 'rgba(255, 0, 0, 0.4)'; // Default red glow
        if (val.startsWith('#') && (val.length === 4 || val.length === 7)) return `${val}66`; // Add alpha
        if (val.startsWith('solid:')) return `${val.split(':')[1]}66`;
        if (val.startsWith('gradient:')) {
            const match = val.match(/#[0-9a-fA-F]{3,6}|rgba?\([^)]+\)/);
            return match ? `${match[0]}44` : 'rgba(255, 0, 0, 0.4)';
        }
        return profile?.theme_color ? `${profile.theme_color}66` : 'rgba(255, 0, 0, 0.4)';
    };

    const getSocialLinks = () => {
        if (!profile?.socials) return { small: [], large: [] };

        let socialsObj = profile.socials;
        if (typeof socialsObj === 'string') {
            try { socialsObj = JSON.parse(socialsObj); } catch (e) { socialsObj = {}; }
        }

        let customOrderedKeys = [];
        if (profile.socials_order) {
            try {
                customOrderedKeys = typeof profile.socials_order === 'string'
                    ? JSON.parse(profile.socials_order)
                    : profile.socials_order;
            } catch (e) { }
        }

        const allKnownKeys = Object.keys(socialsObj).filter(k => k !== 'dynamic_theme' && k !== 'offered_services' && k !== 'spotify_content');
        const seenKeys = new Set(customOrderedKeys);
        const remainingKeys = allKnownKeys.filter(k => !seenKeys.has(k));
        const orderedRemaining = DEFAULT_ORDER.filter(k => remainingKeys.includes(k));
        const finalOrderedKeys = [...customOrderedKeys, ...orderedRemaining];

        const small = [];
        const large = [];

        const buildHref = (k, val) => {
            if (!val) return '';
            if (val.startsWith('http')) return val;
            if (k === 'instagram') return `https://instagram.com/${val}`;
            if (k === 'tiktok') return `https://tiktok.com/@${val}`;
            if (k === 'twitter') return `https://twitter.com/${val}`;
            if (k === 'youtube') return `https://youtube.com/@${val}`;
            if (k === 'whatsapp') {
                const cleanNum = val.replace(/\D/g, '');
                return `https://wa.me/${cleanNum}`;
            }
            return `https://${val}`;
        };

        // We use the state array for large links if it's populated (to maintain drag order)
        // Otherwise fallback to calculation
        const keysToUse = orderedLargeLinks.length > 0 ? orderedLargeLinks : finalOrderedKeys;

        // Small links display ALL icons, following the finalOrderedKeys
        finalOrderedKeys.forEach(k => {
            const val = socialsObj[k];
            if (!val) return;
            const iconDef = ICON_MAP[k];
            if (!iconDef) return;

            const href = buildHref(k, val);
            small.push({ id: k, href, icon: iconDef.icon, label: iconDef.label || k.toUpperCase() });
        });

        // Large links use the state-managed order
        keysToUse.forEach(k => {
            const val = socialsObj[k];
            if (!val) return;
            const iconDef = ICON_MAP[k];
            if (!iconDef || !iconDef.isLarge) return;

            const href = buildHref(k, val);
            large.push({ id: k, href, icon: iconDef.icon, label: iconDef.label || k.toUpperCase() });
        });

        return { small, large };
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        // 1. Calculamos el nuevo orden PRIMERO y al instante
        const oldIndex = orderedLargeLinks.indexOf(active.id);
        const newIndex = orderedLargeLinks.indexOf(over.id);
        const newOrder = arrayMove(orderedLargeLinks, oldIndex, newIndex);

        // 2. Actualizamos la vista para que el usuario lo vea fluido
        setOrderedLargeLinks(newOrder);

        // 3. Preparamos y guardamos en la base de datos
        try {
            const { small } = getSocialLinks();
            const smallIds = small.map(s => s.id);

            // Juntamos las grandes (con el nuevo orden) y las pequeñas
            const combinedSet = new Set([...newOrder, ...smallIds]);
            const fullNewOrder = Array.from(combinedSet);

            const { error } = await supabase
                .from('users')
                .update({ socials_order: fullNewOrder, updated_at: new Date() })
                .eq('id', profile.id);

            if (error) throw error;

            // Actualizamos el perfil local en silencio
            setProfile(prev => ({ ...prev, socials_order: fullNewOrder }));
            toast.success("Orden guardado", { position: 'bottom-center', icon: '✅' });

        } catch (error) {
            console.error("Error saving order:", error);
            toast.error("No se pudo guardar el nuevo orden.");
        }
    };

    const toggleEditMode = () => {
        const enteringEdit = !isEditMode;
        setIsEditMode(enteringEdit);

        if (enteringEdit) {
            // Check if tutorial has been shown
            const hasSeenTutorial = localStorage.getItem('offszn_bio_edit_tutorial_shown') === 'true';
            if (!hasSeenTutorial) {
                setIsTutorialOpen(true);
            }
        }
    };

    const closeTutorial = () => {
        setIsTutorialOpen(false);
        localStorage.setItem('offszn_bio_edit_tutorial_shown', 'true');
    };

    const shareBio = () => {
        setIsShareModalOpen(true);
    };

    if (loading) {
        return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 rounded-full border-t-2 border-white animate-spin"></div></div>;
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-[#888] font-sans">
                <BiErrorCircle size={48} className="mb-4 text-red-500/50" />
                <h2 className="text-xl font-bold text-white mb-2">{error || "Perfil no encontrado"}</h2>
                <Link to="/explorar" className="mt-4 px-6 py-2 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors">Volver a explorar</Link>
            </div>
        );
    }

    const { small: smallLinks, large: largeLinks } = getSocialLinks();
    const themeColorGlow = getThemeColor();

    return (
        <div className="bio-page min-h-screen bg-black flex flex-col items-center py-10 px-4 font-sans text-white overflow-x-hidden">
            <div className={`w-full max-w-[480px] flex flex-col gap-6 relative transition-opacity duration-700 ${isReady ? 'opacity-100' : 'opacity-0'}`}>

                {/* TOP ACTIONS BAR */}
                <div className={`flex items-center justify-between w-full mb-2 z-20 animate-cascade delay-1`}>
                    {/* Empty div for flex spacing if not owner */}
                    {isOwner ? (
                        <button
                            onClick={toggleEditMode}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-lg ${isEditMode ? 'bg-blue-600 text-white border border-blue-500' : 'bg-zinc-900/50 text-gray-400 hover:text-white border border-white/5'}`}
                        >
                            {isEditMode ? <><BiCheck size={14} /> HECHO</> : <><BiPencil size={14} /> EDITAR</>}
                        </button>
                    ) : <div></div>}

                    <button
                        onClick={shareBio}
                        className="w-8 h-8 rounded-full bg-zinc-900/50 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="Compartir"
                    >
                        <i className="bi bi-share-fill text-sm"></i>
                    </button>
                </div>

                {/* 1. HEADER & AVATAR */}
                <div className="flex flex-col items-center text-center relative mb-4">
                    <div
                        className="absolute top-0 w-32 h-32 rounded-full blur-[60px] z-0 transition-opacity duration-1000"
                        style={{
                            backgroundColor: themeColorGlow.replace(/[\d.]+\)$/g, '1)'),
                            opacity: isReady ? 0.3 : 0
                        }}
                    ></div>

                    <div
                        className="relative z-10 w-28 h-28 rounded-full overflow-hidden border-2 border-zinc-800 bg-zinc-900 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] mb-4 animate-cascade delay-1"
                        style={{ boxShadow: `0 0 40px -10px ${themeColorGlow}` }}
                    >
                        <SecureImage src={profile.avatar_url} alt={profile.nickname} className="w-full h-full object-cover" />
                    </div>

                    <div className="relative z-10 flex flex-col items-center gap-1 mt-2 animate-cascade delay-2">
                        <div className="flex flex-col items-center gap-0 justify-center">
                            <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-2xl md:text-3xl tracking-tight flex items-center justify-center gap-2">
                                <span>{profile.nickname}</span>
                                {profile.is_verified && <CheckCircle2 className="text-[#3b82f6] w-6 h-6" />}
                            </h1>
                            {profile.role && <span className="font-medium text-sm md:text-base text-gray-300 mt-1">{profile.role}</span>}
                        </div>
                    </div>

                    {profile.bio && (
                        <p className="relative z-10 text-sm md:text-base text-gray-200 mt-3 text-center tracking-wide max-w-[90%] whitespace-pre-wrap font-medium animate-cascade delay-3">
                            {profile.bio}
                        </p>
                    )}
                </div>

                {/* 2. SOCIAL ICONS ROW (Small) */}
                {smallLinks.length > 0 && (
                    <div className="flex justify-center gap-5 text-2xl text-white mb-2 animate-cascade delay-4">
                        {smallLinks.map(link => {
                            const Icon = link.icon;
                            return (
                                <a key={`small-${link.id}`} href={link.href} target="_blank" rel="noreferrer" className="hover:text-gray-300 transition-transform hover:scale-110">
                                    <Icon />
                                </a>
                            );
                        })}
                    </div>
                )}

                {/* 3. MAIN "TIENDA DE BEATS" PRIORITY LINK */}
                <Link
                    to={`/u/${profile.handle || profile.nickname}`}
                    className="group relative flex items-center w-full min-h-[64px] px-6 py-4 bg-black border border-white rounded-[16px] hover:bg-zinc-900 transition-all duration-300 transform hover:-translate-y-1 animate-cascade delay-5"
                >
                    <div className="flex items-center absolute left-6">
                        <img src={logoImg} alt="OFFSZN" className="w-[28px] h-[28px] object-contain" />
                    </div>
                    <div className="flex-1 flex justify-center text-center">
                        <span className="font-bold text-sm md:text-base tracking-wide">Tienda de Beats</span>
                    </div>
                </Link>

                {/* 4. SOCIAL LINKS (Large) */}
                {largeLinks.length > 0 && (
                    <div className="flex flex-col gap-4 animate-cascade delay-6">
                        <div className="text-center text-xs font-bold tracking-[0.2em] text-gray-400 mb-1">
                            {isEditMode ? "ARRASTRA PARA ORDENAR" : "REDES SOCIALES"}
                        </div>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={largeLinks.map(l => l.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="flex flex-col gap-4">
                                    {largeLinks.map(link => (
                                        <SortableLink key={link.id} id={link.id} link={link} isEditMode={isEditMode} />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                )}

                {/* 5. RECENT PRODUCTS LIST */}
                {products.length > 0 && (
                    <div className="flex flex-col gap-4 mt-6 animate-cascade delay-7">
                        <div className="text-center text-xs font-bold tracking-[0.2em] text-gray-400 mb-1 uppercase">LO MÁS NUEVO</div>
                        <div className="flex flex-col gap-4">
                            {products.map(p => {
                                const isFree = p.is_free;
                                const priceValue = parseFloat(p.price_basic) || 0;
                                const displayPrice = (priceValue > 0) ? formatPrice(priceValue) : 'GRATIS';
                                const productUrl = `/${p.product_type || 'beat'}/${p.public_slug || p.id}`;
                                const isCurrent = currentTrack?.id === p.id;

                                return (
                                    <div key={p.id} className="relative w-full bg-[#0a0a0a] rounded-xl overflow-hidden border border-zinc-800 flex flex-col md:flex-row shadow-2xl group hover:border-zinc-500 transition-colors duration-300">
                                        {/* Cover */}
                                        <div className="w-full md:w-[120px] aspect-square bg-zinc-900 relative flex-shrink-0 p-3 flex items-center justify-center">
                                            <SecureImage
                                                src={p.image_url}
                                                alt={p.name}
                                                className="shadow-2xl rounded-md transform group-hover:scale-105 transition-transform duration-500 w-full h-full object-cover border border-white/5"
                                                style={{ boxShadow: '-5px 5px 15px rgba(0,0,0,0.5)' }}
                                            />
                                            <button
                                                onClick={(e) => { e.preventDefault(); handlePlay(p); }}
                                                className={`absolute flex items-center justify-center w-10 h-10 rounded-full text-white backdrop-blur-sm border border-white/20 transition-all ${isCurrent && isPlaying ? 'bg-white text-black scale-110' : 'bg-black/60 hover:scale-110 hover:bg-white hover:text-black'}`}
                                            >
                                                {isCurrent && isPlaying ? <BiPause size={24} /> : <BiPlay size={24} className="ml-1" />}
                                            </button>
                                        </div>

                                        {/* Right Content */}
                                        <div className="flex-1 p-4 flex flex-col justify-center">
                                            <div className="flex items-start justify-between mb-1">
                                                <div>
                                                    <h3 className="font-bold text-base leading-tight text-white mb-0.5">{p.name}</h3>
                                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{p.product_type || 'Beat'}</p>
                                                    {(p.bpm || p.key) && (
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {p.bpm && <span className="text-[10px] text-zinc-500 font-bold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded uppercase">{p.bpm} BPM</span>}
                                                            {p.key && <span className="text-[10px] text-zinc-500 font-bold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded uppercase">{p.key}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-800">
                                                <span className="text-sm md:text-base font-bold text-white">{displayPrice}</span>
                                                <Link
                                                    to={productUrl}
                                                    className="bg-white hover:bg-gray-200 text-black text-[11px] md:text-xs font-bold px-5 py-2 rounded-full transition-all duration-300 uppercase tracking-wider text-center"
                                                >
                                                    LO QUIERO!
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <Link
                    to="/explorar"
                    className="mt-8 opacity-50 hover:opacity-100 transition-opacity text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 w-full text-center pb-8 border-b-0 animate-cascade delay-8"
                >
                    Diseñado con <img src={logoImg} alt="OFFSZN" className="h-4 object-contain border-none" />
                </Link>

                <ProfileShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} profile={profile} />

                {/* Edit Mode Tutorial Modal */}
                {isTutorialOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-[#111] border border-zinc-800 rounded-3xl w-full max-w-[340px] p-6 flex flex-col items-center text-center shadow-[0_0_50px_rgba(0,0,0,0.8)] relative animate-in zoom-in-95 duration-300">

                            <h3 className="text-white font-black text-xl mb-2 tracking-wide uppercase">Organiza tus links</h3>
                            <p className="text-gray-400 text-sm mb-6 font-medium leading-relaxed">
                                Mantén presionado y arrastra para cambiar el orden de tus redes sociales. El cambio se guarda automáticamente.
                            </p>

                            {/* Decorative animation box instead of video to avoid asset issues */}
                            <div className="w-full h-[180px] bg-black border border-zinc-800 rounded-2xl mb-8 flex flex-col gap-2 p-3 justify-center relative overflow-hidden shadow-inner">
                                <div className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center px-4 relative">
                                    <div className="w-4 h-4 rounded-full bg-zinc-700"></div>
                                    <div className="w-16 h-2 bg-zinc-700 rounded ml-3"></div>
                                    <GripVertical className="text-zinc-600 absolute right-3" size={16} />
                                </div>
                                {/* Dragging item */}
                                <div className="w-full h-10 bg-blue-900/30 border border-blue-500/50 rounded-lg flex items-center px-4 relative z-10 shadow-lg transform -translate-y-4 scale-[1.02] transition-transform animate-pulse">
                                    <div className="w-4 h-4 rounded-full bg-blue-400"></div>
                                    <div className="w-20 h-2 bg-blue-400 rounded ml-3"></div>
                                    <GripVertical className="text-blue-400 absolute right-3" size={16} />
                                </div>
                                <div className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center px-4 relative">
                                    <div className="w-4 h-4 rounded-full bg-zinc-700"></div>
                                    <div className="w-12 h-2 bg-zinc-700 rounded ml-3"></div>
                                    <GripVertical className="text-zinc-600 absolute right-3" size={16} />
                                </div>
                            </div>

                            <button
                                onClick={closeTutorial}
                                className="w-full bg-white text-black font-black py-4 rounded-xl text-sm uppercase tracking-widest hover:bg-gray-200 transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
