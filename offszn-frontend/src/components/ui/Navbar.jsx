import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ShoppingCart, Bell, LogOut, Settings, Heart, Disc, Sliders, Music, CheckCircle, Users, UserPlus, PlayCircle, BarChart, Briefcase } from 'lucide-react';
import clsx from 'clsx';
import PromoBanner from './PromoBanner';
import SearchBar from './SearchBar';
import { useAuthStore } from '../../store/authStore';

const Navbar = () => {
  const { user, profile, checkSession, signOut } = useAuthStore();
  const [activeDropdown, setActiveDropdown] = useState(null); 
  
  useEffect(() => { checkSession(); }, []);

  const toggleDropdown = (name) => setActiveDropdown(activeDropdown === name ? null : name);
  const closeDropdowns = () => setActiveDropdown(null);

  return (
    <>
      {!user && <PromoBanner />}

      <nav className="sticky top-0 z-1000 bg-black/95 backdrop-blur-xl border-b border-white/10 py-2">
        <div className="container mx-auto px-6 max-w-350 flex items-center justify-between gap-8">
          
          {/* LOGO */}
          <div className="shrink-0">
            <Link to="/" className="flex items-center">
              <img src="/images/LOGO OFFSZN.webp" alt="OFFSZN" className="h-8 w-auto scale-150 origin-left" />
            </Link>
          </div>

          {/* CENTER LINKS - Solucionado conflicto flex/hidden */}
          <div className="flex-1 items-center gap-6 hidden lg:flex">
            <ul className="flex items-center gap-1 list-none">
              <li>
                <Link to="/explorar" className="text-sm font-semibold text-gray-300 hover:text-white px-3 py-2 rounded-md hover:bg-white/5 transition-colors">
                  Explorar
                </Link>
              </li>

              {/* DROPDOWN RECURSOS */}
              <li className="relative group">
                <button 
                  className={clsx("flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-md transition-colors", activeDropdown === 'resources' ? "text-white bg-white/5" : "text-gray-300 hover:text-white")}
                  onClick={() => toggleDropdown('resources')}
                >
                  Recursos <ChevronDown className={clsx("w-3 h-3 transition-transform", activeDropdown === 'resources' && "rotate-180")} />
                </button>

                {/* MEGA MENU: w-[520px] -> w-130 */}
                <div className={clsx("absolute top-full left-0 mt-2 w-130 bg-[#080808] border border-white/10 rounded-xl p-3 shadow-2xl grid grid-cols-3 gap-4 transition-all duration-200 origin-top-left", activeDropdown === 'resources' ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2")}>
                  
                  {/* COL 1 */}
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <span className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Sonidos</span>
                    <div className="flex flex-col gap-1">
                      <MegaLink to="/recursos/drum-kits" icon={Disc} label="Drum Kits" />
                      <MegaLink to="/recursos/presets" icon={Sliders} label="Presets" />
                      <MegaLink to="/recursos/samples" icon={Music} label="Loops" />
                      <MegaLink to="/recursos/free" icon={CheckCircle} label="Gratis" />
                    </div>
                  </div>

                  {/* COL 2 */}
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <span className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Comunidad</span>
                    <div className="flex flex-col gap-1">
                      <MegaLink to="/productores" icon={Users} label="Productores" />
                      <MegaLink to="/collabs" icon={UserPlus} label="Collabs" />
                      <MegaLink to="/feed" icon={PlayCircle} label="Feed" />
                    </div>
                  </div>

                  {/* COL 3 */}
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <span className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Géneros</span>
                    <div className="flex flex-col gap-1">
                       <Link to="/beats/hiphop" className="text-sm text-gray-400 hover:text-white hover:translate-x-1 transition-transform px-2 py-1">Hip-Hop</Link>
                       <Link to="/beats/trap" className="text-sm text-gray-400 hover:text-white hover:translate-x-1 transition-transform px-2 py-1">Trap</Link>
                       <Link to="/beats/reggaeton" className="text-sm text-gray-400 hover:text-white hover:translate-x-1 transition-transform px-2 py-1">Reggaetón</Link>
                    </div>
                  </div>
                </div>
              </li>

              {/* DROPDOWN STUDIO: w-[250px] -> w-62.5 */}
              <li className="relative">
                <button 
                   className={clsx("flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-md transition-colors", activeDropdown === 'studio' ? "text-white bg-white/5" : "text-gray-300 hover:text-white")}
                   onClick={() => toggleDropdown('studio')}
                >
                  Studio <span className="text-[9px] bg-linear-to-r from-[#7209b7] to-[#560bad] text-white px-1.5 py-0.5 rounded font-bold uppercase ml-1">Beta</span> <ChevronDown className={clsx("w-3 h-3 transition-transform", activeDropdown === 'studio' && "rotate-180")} />
                </button>
                 <div className={clsx("absolute top-full left-0 mt-2 w-62.5 bg-[#080808] border border-white/10 rounded-xl p-2 shadow-2xl transition-all duration-200", activeDropdown === 'studio' ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2")}>
                    <div className="flex flex-col gap-1">
                       <span className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Growth & Analytics</span>
                       <MegaLink to="/studio/analyzer" icon={BarChart} label="Analyzer" />
                       <MegaLink to="/studio/manager" icon={Briefcase} label="Manager" />
                    </div>
                 </div>
              </li>
            </ul>

            <SearchBar />
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-3">
            
            <button className="relative w-9 h-9 flex items-center justify-center rounded-full bg-[#232323] hover:bg-[#333] transition-colors text-gray-300 hover:text-white">
              <ShoppingCart className="w-5 h-5" />
              {/* Badge Count: min-w-[18px] -> min-w-4.5, h-[18px] -> h-4.5 */}
              <span className="absolute -top-1.5 -right-1.5 bg-white text-black text-[10px] font-extrabold px-1 min-w-4.5 h-4.5 flex items-center justify-center rounded-full border-2 border-black">0</span>
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <button className="w-9 h-9 flex items-center justify-center rounded-full bg-[#232323] hover:bg-[#333] transition-colors text-gray-300 hover:text-white">
                   <Bell className="w-5 h-5" />
                </button>

                <div className="relative">
                  <button onClick={() => toggleDropdown('user')} className="w-9 h-9 rounded-full overflow-hidden border border-white/10 hover:border-white/30 transition-colors">
                     {profile?.avatar_url ? (
                       <img src={profile.avatar_url} alt="User" className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full bg-[#333] flex items-center justify-center text-xs font-bold text-gray-400">
                         {user.email?.charAt(0).toUpperCase()}
                       </div>
                     )}
                  </button>

                  <div className={clsx("absolute top-full right-0 mt-3 w-80 bg-[#141414] border border-white/10 rounded-2xl p-4 shadow-2xl transition-all duration-200 origin-top-right", activeDropdown === 'user' ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2")}>
                     <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                        <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-white font-bold">
                           {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                           <h4 className="text-white text-sm font-semibold">{profile?.nickname || 'Usuario'}</h4>
                           <span className="text-xs text-gray-500">{user.email}</span>
                        </div>
                     </div>

                     <div className="flex flex-col gap-1">
                        <UserLink to="/cuenta/dashboard" icon={BarChart} label="Dashboard" />
                        <UserLink to="/favoritos" icon={Heart} label="Mis Favoritos" />
                        <UserLink to="/settings" icon={Settings} label="Configuración" />
                        
                        <button 
                          onClick={signOut}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors w-full text-left mt-2 border-t border-white/5 pt-3"
                        >
                           <LogOut className="w-4 h-4" /> Cerrar Sesión
                        </button>
                     </div>
                  </div>
                </div>

                <Link to="/upload" className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-full text-sm font-bold transition-all ml-2 flex items-center gap-2">
                   Subir
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/auth/login" className="text-sm font-semibold text-gray-300 hover:text-white px-3 py-2">
                  Iniciar Sesión
                </Link>
                <Link to="/auth/register" className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-purple-900/20">
                  Únete 🚀
                </Link>
              </div>
            )}

          </div>
        </div>
      </nav>
      
      {activeDropdown && (
         <div className="fixed inset-0 z-999" onClick={closeDropdowns}></div>
      )}
    </>
  );
};

const MegaLink = ({ to, icon: Icon, label }) => (
  <Link to={to} className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all group">
     <Icon className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
     <span className="text-sm font-medium">{label}</span>
  </Link>
);

const UserLink = ({ to, icon: Icon, label }) => (
   <Link to={to} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-sm font-medium">{label}</span>
   </Link>
);

export default Navbar;