import React, { useEffect, useState, useMemo } from 'react';
import { apiClient } from '../../api/client';
import { Link } from 'react-router-dom';
import {
   History as HistoryIcon,
   Search,
   Play,
   User,
   AlertCircle,
   Clock,
   Music,
   Loader2,
   ArrowUpRight,
   Eye,
   Headphones,
   ChevronRight
} from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';
import toast from 'react-hot-toast';

export default function History() {
   const [loading, setLoading] = useState(true);
   const [history, setHistory] = useState([]);
   const [searchQuery, setSearchQuery] = useState('');
   const [filterType, setFilterType] = useState('all');

   const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayerStore();

   useEffect(() => {
      fetchHistory();
   }, []);

   const fetchHistory = async () => {
      try {
         setLoading(true);
         const response = await apiClient.get('/activity/history');
         setHistory(response.data);
      } catch (error) {
         console.error('Error cargando historial:', error);
         toast.error("No se pudo cargar el historial");
      } finally {
         setLoading(false);
      }
   };

   const filteredHistory = useMemo(() => {
      return history.filter(item => {
         const name = item.entity_type === 'profile' ? item.entity_id : (item.product?.name || '');
         const nameMatches = name.toLowerCase().includes(searchQuery.toLowerCase());
         const matchesType = filterType === 'all' || item.entity_type === filterType;
         return nameMatches && matchesType;
      });
   }, [history, searchQuery, filterType]);

   const getGroupLabel = (dateString) => {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (date.toDateString() === today.toDateString()) return 'Hoy';
      if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
   };

   if (loading) {
      return (
         <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
            <Loader2 className="animate-spin text-violet-500" size={48} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 animate-pulse">Sincronizando cronología...</span>
         </div>
      );
   }

   return (
      <div className="w-full max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">

         {/* --- HEADER --- */}
         <div className="mb-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
               <div>
                  <div className="flex items-center gap-3 mb-6">
                     <div className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full">
                        <span className="text-[9px] font-black text-violet-500 uppercase tracking-widest">Actividad</span>
                     </div>
                     <div className="h-px w-8 bg-white/5"></div>
                  </div>
                  <h1 className="text-6xl font-black uppercase tracking-tighter text-white leading-none">Mi <span className="text-violet-500">Historial</span></h1>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-4 flex items-center gap-2">
                     <Clock size={12} className="text-violet-500" /> Registro de tus interacciones recientes en OFFSZN
                  </p>
               </div>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-center gap-6 p-4 bg-[#0A0A0A] border border-white/5 rounded-[32px] backdrop-blur-xl">
               {/* Search */}
               <div className="relative w-full lg:w-[450px] group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-violet-500 transition-colors" size={18} />
                  <input
                     type="text"
                     placeholder="Buscar en el historial..."
                     className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-16 pr-8 text-xs font-bold text-white focus:outline-none focus:border-violet-500/50 transition-all placeholder-gray-800"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>

               {/* Filters */}
               <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto no-scrollbar">
                  {[
                     { id: 'all', label: 'Todos' },
                     { id: 'product', label: 'Vistos' },
                     { id: 'listen', label: 'Escuchados' },
                     { id: 'profile', label: 'Perfiles' }
                  ].map(type => (
                     <button
                        key={type.id}
                        onClick={() => setFilterType(type.id)}
                        className={`px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all whitespace-nowrap border ${filterType === type.id
                           ? 'bg-white text-black border-white shadow-2xl shadow-white/10'
                           : 'bg-black/40 text-gray-600 border-white/5 hover:border-white/10 hover:text-white'
                           }`}
                     >
                        {type.label}
                     </button>
                  ))}
               </div>
            </div>
         </div>

         {/* --- CONTENT --- */}
         <div className="space-y-12 mb-20">
            {filteredHistory.length === 0 ? (
               <EmptyState />
            ) : (
               <HistoryList
                  items={filteredHistory}
                  getGroupLabel={getGroupLabel}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  onPlay={playTrack}
                  onToggle={togglePlay}
               />
            )}
         </div>
      </div>
   );
}

function HistoryList({ items, getGroupLabel, currentTrack, isPlaying, onPlay, onToggle }) {
   let lastGroup = '';

   const getIcon = (type) => {
      switch (type) {
         case 'profile': return <User size={16} />;
         case 'listen': return <Headphones size={16} />;
         default: return <Eye size={16} />;
      }
   };

   return items.map((item, idx) => {
      const currentGroup = getGroupLabel(item.last_action_at);
      const showHeader = currentGroup !== lastGroup;
      lastGroup = currentGroup;

      const isProfile = item.entity_type === 'profile';
      const isListen = item.entity_type === 'listen';
      const product = item.product;
      const isCurrent = currentTrack?.id === product?.id;

      return (
         <React.Fragment key={item.id}>
            {showHeader && (
               <div className="flex items-center gap-6 mb-8 mt-16 first:mt-0">
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-white">{currentGroup}</h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
               </div>
            )}

            <div className="group flex items-center gap-6 p-5 bg-[#0A0A0A] border border-white/5 hover:border-white/10 hover:bg-white/[0.02] transition-all duration-500 rounded-[32px] relative overflow-hidden mb-3">

               {/* Icon Type Label */}
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isProfile ? 'bg-blue-500/10 text-blue-500' :
                  isListen ? 'bg-emerald-500/10 text-emerald-500' :
                     'bg-violet-500/10 text-violet-500'
                  }`}>
                  {getIcon(item.entity_type)}
               </div>

               {/* Avatar/Thumbnail */}
               <div className="w-16 h-16 flex-shrink-0">
                  {isProfile ? (
                     <div className="w-full h-full rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white font-black text-xl overflow-hidden">
                        {item.profile?.avatar_url ? (
                           <img src={item.profile.avatar_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                           item.entity_id[0]?.toUpperCase()
                        )}
                     </div>
                  ) : (
                     <img
                        src={product?.image_url || 'https://via.placeholder.com/150'}
                        className="w-full h-full rounded-2xl object-cover border border-white/5 group-hover:scale-105 transition-transform duration-500"
                        alt=""
                     />
                  )}
               </div>

               {/* Info */}
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                     <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                        {new Date(item.last_action_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                     </span>
                     {isListen && <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest px-2 py-0.5 bg-emerald-500/10 rounded-full">Reproducido</span>}
                     {isProfile && <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest px-2 py-0.5 bg-blue-500/10 rounded-full">Perfil visitado</span>}
                  </div>
                  <h4 className="text-white font-black uppercase tracking-tighter text-xl truncate">
                     {isProfile ? `@${item.entity_id}` : (product?.name || 'Producto eliminado')}
                  </h4>
                  {!isProfile && product?.producer && (
                     <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                        {product.producer.nickname}
                     </div>
                  )}
               </div>

               {/* Quick Action */}
               <div className="flex items-center gap-4">
                  {isProfile ? (
                     <Link to={`/@${item.entity_id}`} className="p-4 rounded-2xl bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all active:scale-95">
                        <ChevronRight size={20} />
                     </Link>
                  ) : product && (
                     <div className="flex items-center gap-3">
                        {isListen && (
                           <button
                              onClick={() => isCurrent ? onToggle() : onPlay(product)}
                              className="w-12 h-12 flex items-center justify-center bg-violet-500 text-white rounded-2xl hover:bg-violet-400 transition-all active:scale-90 shadow-xl shadow-violet-500/20"
                           >
                              {isCurrent && isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-0.5" />}
                           </button>
                        )}
                        <Link to={`/producto/${product.slug || product.id}`} className="p-4 rounded-2xl bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                           <ChevronRight size={20} />
                        </Link>
                     </div>
                  )}
               </div>

            </div>
         </React.Fragment>
      );
   });
}

function EmptyState() {
   return (
      <div className="flex flex-col items-center justify-center py-32 text-center bg-[#070707] border border-white/5 rounded-[60px] relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-32 opacity-[0.02] group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000 pointer-events-none">
            <HistoryIcon size={400} />
         </div>

         <div className="w-24 h-24 bg-white/[0.02] border border-white/5 rounded-[32px] flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-700">
            <HistoryIcon className="text-gray-800" size={48} />
         </div>

         <h4 className="text-3xl font-black uppercase tracking-tighter text-white mb-4">Cronología Desierta</h4>
         <p className="text-[11px] font-bold text-gray-600 uppercase tracking-[0.3em] mb-12 max-w-sm leading-relaxed">
            Explora el marketplace y interactúa con la comunidad para comenzar a construir tu historial.
         </p>

         <Link to="/explorar" className="group flex items-center gap-3 px-12 py-5 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-violet-500 hover:text-white transition-all shadow-2xl active:scale-95">
            Explorar Catálogo
            <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
         </Link>
      </div>
   );
}
