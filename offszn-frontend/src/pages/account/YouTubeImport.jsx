import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useYouTubeScanner } from '../../hooks/useYouTubeScanner';
import { useUploadStore } from '../../store/uploadStore';
import { cleanTitle, detectBPM, detectKey, extractTags } from '../../utils/metadataScanner';
import {
    Youtube, Loader2, ArrowLeft, Search, CheckCircle2,
    AlertCircle, Sparkles, ExternalLink, RefreshCcw
} from 'lucide-react';

export default function YouTubeImport() {
    const navigate = useNavigate();
    const {
        ready, videos, loading, error, nextPageToken,
        fetchVideos, loginAndFetch, getVideoDetails
    } = useYouTubeScanner();

    const { updateField, resetForm } = useUploadStore();
    const [importing, setImporting] = useState(false);

    const handleSelectVideo = async (video) => {
        setImporting(true);
        const snippet = video.snippet;
        const videoId = video.id.videoId;

        // 1. Get deep details (tags)
        const details = await getVideoDetails(videoId);
        const ytTags = details?.snippet?.tags || [];

        // 2. Scan for metadata
        const fullText = `${snippet.title} ${snippet.description}`;
        const bpm = detectBPM(fullText);
        const key = detectKey(fullText);
        const tags = extractTags(snippet.title, snippet.description, ytTags);
        const title = cleanTitle(snippet.title);

        // 3. Update Store
        resetForm(); // Start fresh
        updateField('title', title);
        updateField('description', snippet.description);
        updateField('tags', tags);
        if (bpm) updateField('bpm', bpm);
        if (key) updateField('musicalKey', key);

        // Handle Thumbnail
        const thumb = snippet.thumbnails.maxres?.url || snippet.thumbnails.high?.url || snippet.thumbnails.medium?.url;
        if (thumb) {
            updateField('coverImage', { preview: thumb, file: null });
        }

        setImporting(false);
        navigate('/dashboard/upload-beat'); // Correct path
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                                <Youtube className="text-red-600" size={32} />
                                Importar de YouTube
                            </h1>
                            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mt-1">
                                Sincroniza tus beats de forma inteligente
                            </p>
                        </div>
                    </div>

                    {!ready && (
                        <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 px-4 py-2 rounded-xl border border-amber-500/20 text-xs font-black uppercase">
                            <Loader2 size={14} className="animate-spin" />
                            Cargando SDK de Google...
                        </div>
                    )}

                    {ready && videos.length === 0 && !loading && (
                        <button
                            onClick={loginAndFetch}
                            className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all flex items-center gap-3 shadow-xl shadow-white/5"
                        >
                            Conectar mi Canal
                            <Sparkles size={16} />
                        </button>
                    )}
                </div>

                {/* Main Content */}
                {loading && videos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
                        <p className="text-gray-500 font-black uppercase tracking-widest text-xs animate-pulse">Escaneando tu canal...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-12 text-center max-w-2xl mx-auto">
                        <AlertCircle className="text-red-500 mx-auto mb-6" size={48} />
                        <h3 className="text-xl font-black uppercase mb-2">Error de Conexión</h3>
                        <p className="text-gray-500 mb-8">{error}</p>
                        <button
                            onClick={loginAndFetch}
                            className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs"
                        >
                            Reintentar Conexión
                        </button>
                    </div>
                ) : videos.length > 0 ? (
                    <div className="space-y-12">
                        {/* Grid de Videos */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {videos.map((video) => (
                                <VideoCard
                                    key={video.id.videoId}
                                    video={video}
                                    onSelect={() => handleSelectVideo(video)}
                                    disabled={importing}
                                />
                            ))}
                        </div>

                        {/* Load More */}
                        {nextPageToken && (
                            <div className="flex justify-center pb-20">
                                <button
                                    onClick={() => fetchVideos(nextPageToken)}
                                    disabled={loading}
                                    className="flex items-center gap-3 px-8 py-4 rounded-2xl border border-white/5 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCcw size={16} />}
                                    Cargar más videos
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-32 opacity-20 pointer-events-none">
                        <Youtube className="mx-auto mb-8" size={80} />
                        <p className="text-2xl font-black uppercase tracking-tighter">Selecciona tu canal para ver tus videos</p>
                    </div>
                )}
            </div>

            {/* Overlay de Importación */}
            {importing && (
                <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
                    <div className="relative mb-12">
                        <div className="w-32 h-32 border-4 border-violet-500/10 border-t-violet-500 rounded-full animate-spin"></div>
                        <CheckCircle2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-violet-500" size={48} />
                    </div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Analizando Metadata</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px] animate-pulse">
                        Extrayendo BPM, Key y Etiquetas inteligentes...
                    </p>
                </div>
            )}
        </div>
    );
}

function VideoCard({ video, onSelect, disabled }) {
    const { title, thumbnails, publishedAt } = video.snippet;
    const date = new Date(publishedAt).toLocaleDateString();

    return (
        <div
            className={`group relative bg-[#0a0a0a] rounded-3xl overflow-hidden border border-white/5 transition-all duration-500 hover:border-violet-500/30 ${disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:-translate-y-1'}`}
            onClick={onSelect}
        >
            {/* Thumbnail */}
            <div className="aspect-video relative overflow-hidden">
                <img
                    src={thumbnails.high?.url || thumbnails.medium?.url}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="px-6 py-3 bg-white text-black rounded-xl font-black uppercase text-[10px] tracking-widest translate-y-4 group-hover:translate-y-0 transition-transform">
                        Importar Metadata
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="p-5 space-y-2">
                <h3 className="text-sm font-black text-white line-clamp-2 uppercase tracking-tight group-hover:text-violet-400 transition-colors">
                    {title}
                </h3>
                <div className="flex items-center justify-between text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-auto">
                    <span>{date}</span>
                    <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>
        </div>
    );
}
