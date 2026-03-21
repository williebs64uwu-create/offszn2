import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown, ShoppingCart, Bell, LogOut, Settings, Heart, Disc, Sliders, Music,
  CheckCircle, Users, UserPlus, PlayCircle, BarChart, Briefcase, Tag, Rocket,
  MessageSquare, Calendar, BookOpen, Target, UploadCloud, LayoutDashboard,
  Layers, History, Gift, LifeBuoy, Menu, X, Search
} from 'lucide-react';
import clsx from 'clsx';
import PromoBanner from './PromoBanner';
import SearchBar from './SearchBar';
import { useAuthStore } from '../../store/authStore';
import { useCurrencyStore } from '../../store/currencyStore';
import { useCartStore } from '../../store/cartStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import CartPanel from '../cart/CartPanel';
import logoImg from '../../assets/images/LOGO-OFFSZN.png';

const Navbar = () => {
  const { user, profile, checkSession, signOut } = useAuthStore();
  const { currency, setCurrency } = useCurrencyStore();
  const { items, syncWithSupabase } = useCartStore();
  const { notifications, unreadCount, fetchNotifications, markAllAsRead, hasFetchedOnce } = useNotificationStore();

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => { checkSession(); }, []);

  // Smart Toggle System: Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Don't hide at the very top of the page
      if (currentScrollY < 50) {
        setShowNavbar(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down
        setShowNavbar(false);
        closeDropdowns(); // Also close dropdowns when hiding
      } else {
        // Scrolling up
        setShowNavbar(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    if (user && !hasFetchedOnce) {
      fetchNotifications();
    }
  }, [user, hasFetchedOnce]);

  const toggleDropdown = (name) => setActiveDropdown(activeDropdown === name ? null : name);
  const closeDropdowns = () => setActiveDropdown(null);

  // Close mobile menu when screen resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <div className={clsx(
        "fixed top-0 left-0 right-0 z-[1001] transition-transform duration-300 ease-in-out",
        !showNavbar && "-translate-y-full"
      )}>
        {!user && <PromoBanner />}

        <nav className="bg-black/95 backdrop-blur-xl border-b border-white/10 py-2">
          <div className="container mx-auto px-4 md:px-6 max-w-[1400px] flex items-center justify-between gap-4 md:gap-8">

            {/* LEFT: HAMBURGER (Mobile) */}
            <button
              className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* LOGO */}
            <div className="shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <img src={logoImg} alt="OFFSZN" className="h-6 md:h-8 w-auto scale-125 md:scale-150 origin-left" />
              </Link>
            </div>

            {/* CENTER LINKS (Desktop) */}
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

                  <div className={clsx("absolute top-full left-0 mt-2 w-130 bg-[#080808] border border-white/10 rounded-xl p-3 shadow-2xl grid grid-cols-3 gap-4 transition-all duration-200 origin-top-left z-50", activeDropdown === 'resources' ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2")}>
                    {/* COL 1 */}
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <span className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Sonidos</span>
                      <div className="flex flex-col gap-1">
                        <MegaLink to="/beats" icon={Music} label="Beats" />
                        <MegaLink to="/drum-kits" icon={Disc} label="Drum Kits" />
                        <MegaLink to="/presets" icon={Sliders} label="Presets" />
                        <MegaLink to="/loops" icon={Music} label="Loops" />
                        <MegaLink to="/one-shots" icon={Target} label="One-Shots" />
                        <MegaLink to="/gratis" icon={CheckCircle} label="Gratis" />
                      </div>
                    </div>

                    {/* COL 2 */}
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <span className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Comunidad</span>
                      <div className="flex flex-col gap-1">
                        <MegaLink to="/productores" icon={Users} label="Productores" />
                        <MegaLink to="/collabs" icon={UserPlus} label="Collabs" />
                        <MegaLink to="/reels" icon={PlayCircle} label="Reels" />
                        <MegaLink to="/feed" icon={PlayCircle} label="Feed" />
                        <MegaLink to="/eventos" icon={Calendar} label="Eventos" />
                      </div>
                    </div>

                    {/* COL 3 */}
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <span className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Géneros</span>
                      <div className="flex flex-col gap-1">
                        <Link to="/hip-hop" className="text-sm text-gray-400 hover:text-white hover:translate-x-1 transition-transform px-2 py-1">Hip-Hop</Link>
                        <Link to="/trap" className="text-sm text-gray-400 hover:text-white hover:translate-x-1 transition-transform px-2 py-1">Trap</Link>
                        <Link to="/reggaeton" className="text-sm text-gray-400 hover:text-white hover:translate-x-1 transition-transform px-2 py-1">Reggaetón</Link>
                      </div>
                    </div>
                  </div>
                </li>

                <li className="relative">
                  <button
                    className={clsx("flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-md transition-colors", activeDropdown === 'studio' ? "text-white bg-white/5" : "text-gray-300 hover:text-white")}
                    onClick={() => toggleDropdown('studio')}
                  >
                    Studio <span className="text-[9px] bg-linear-to-r from-[#7209b7] to-[#560bad] text-white px-1.5 py-0.5 rounded font-bold uppercase ml-1">Beta</span> <ChevronDown className={clsx("w-3 h-3 transition-transform", activeDropdown === 'studio' && "rotate-180")} />
                  </button>
                  <div className={clsx("absolute top-full left-0 mt-2 w-62.5 bg-[#080808] border border-white/10 rounded-xl p-2 shadow-2xl transition-all duration-200 z-50", activeDropdown === 'studio' ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2")}>
                    <div className="flex flex-col gap-1">
                      <span className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Growth & Analytics</span>
                      <MegaLink to="/studio/analyzer" icon={BarChart} label="Analyzer" />
                      <MegaLink to="/dashboard/my-products" icon={Briefcase} label="Manager" />
                    </div>
                  </div>
                </li>
              </ul>

              <SearchBar />
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-2 md:gap-3">

              {/* SEARCH BUTTON (Mobile) */}
              <button
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full bg-[#232323] text-gray-300"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                <Search className="w-5 h-5" />
              </button>

              {/* CURRENCY SELECTOR (Desktop Only) */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => toggleDropdown('currency')}
                  className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase"
                >
                  {currency} <ChevronDown className={clsx("w-3 h-3 transition-transform", activeDropdown === 'currency' && "rotate-180")} />
                </button>
                <div className={clsx("absolute top-full right-0 mt-2 w-24 bg-[#080808] border border-white/10 rounded-xl p-2 shadow-2xl z-1003 transition-all", activeDropdown === 'currency' ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2")}>
                  {['USD', 'PEN'].map(c => (
                    <div
                      key={c}
                      className={clsx(
                        "px-3 py-1.5 rounded-md text-xs cursor-pointer transition-colors",
                        currency === c ? "bg-primary/10 text-primary font-bold" : "text-gray-400 hover:bg-white/5 hover:text-white"
                      )}
                      onClick={() => { setCurrency(c); closeDropdowns(); }}
                    >
                      {c}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative w-9 h-9 flex items-center justify-center rounded-full bg-[#232323] hover:bg-[#333] transition-colors text-gray-300 hover:text-white"
              >
                <ShoppingCart className="w-5 h-5" />
                {items.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-white text-black text-[10px] font-extrabold px-1 min-w-4.5 h-4.5 flex items-center justify-center rounded-full border-2 border-black animate-in zoom-in duration-300">
                    {items.length}
                  </span>
                )}
              </button>

              {user ? (
                <div className="flex items-center gap-2 md:gap-3">
                  <Link to="/mensajes" className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full bg-[#232323] hover:bg-[#333] transition-colors text-gray-300 hover:text-white">
                    <MessageSquare className="w-5 h-5" />
                  </Link>
                  <div className="relative">
                    <button onClick={() => {
                      toggleDropdown('notifications');
                      if (activeDropdown !== 'notifications' && !hasFetchedOnce) fetchNotifications();
                    }} className="w-9 h-9 flex items-center justify-center rounded-full bg-[#232323] hover:bg-[#333] transition-colors text-gray-300 hover:text-white relative">
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#141414]"></span>
                      )}
                    </button>
                    <div className={clsx("absolute top-full right-0 mt-3 w-80 bg-[#141414] border border-white/10 rounded-2xl shadow-2xl transition-all duration-200 origin-top-right z-[1002]", activeDropdown === 'notifications' ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2")}>
                      <div className="p-4 border-b border-white/5 flex justify-between items-center">
                        <h4 className="font-bold text-sm text-white">Notificaciones</h4>
                        <div className="flex gap-3">
                          <button onClick={markAllAsRead} className="text-[10px] text-gray-400 font-bold uppercase">Marcar Leídas</button>
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 && <p className="p-8 text-center text-xs text-gray-500">No hay notificaciones</p>}
                        {notifications.map(n => (
                          <div key={n.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                            <p className="text-xs text-gray-300" dangerouslySetInnerHTML={{ __html: n.message }}></p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <button onClick={() => toggleDropdown('user')} className="w-8 h-8 md:w-9 h-9 rounded-full overflow-hidden border border-white/10 hover:border-white/30 transition-colors">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#333] flex items-center justify-center text-xs font-bold text-gray-400 border border-white/10">
                          {user.email?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </button>

                    <div className={clsx("absolute top-full right-0 mt-3 w-72 md:w-80 lg:w-96 bg-[#141414] border border-white/10 rounded-2xl p-4 shadow-2xl transition-all duration-200 origin-top-right z-[1002]", activeDropdown === 'user' ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2")}>
                      <div className="flex items-center justify-between gap-3 bg-[#232323] border border-white/5 rounded-xl p-4 mb-3">
                        <Link to={`/@${profile?.nickname}`} className="flex items-center gap-3 w-full" onClick={closeDropdowns}>
                          <div className="w-10 h-10 rounded-full bg-[#333] overflow-hidden flex-shrink-0 border border-white/10">
                            {profile?.avatar_url ? (
                              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white font-bold">{user.email?.charAt(0).toUpperCase()}</div>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <h4 className="text-white text-sm font-semibold truncate">{profile?.nickname || 'Usuario'}</h4>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider italic">Ver Perfil Público</span>
                          </div>
                        </Link>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <UserLink to="/dashboard" icon={LayoutDashboard} label="Panel de Control" onClick={closeDropdowns} />
                        <UserLink to="/dashboard/my-products" icon={Layers} label="Mis Kits" onClick={closeDropdowns} />
                        <UserLink to="/dashboard/upload" icon={UploadCloud} label="Subir Producto" onClick={closeDropdowns} />

                        <div className="h-px bg-white/5 my-2 mx-3" />

                        <UserLink to="/dashboard/my-purchases" icon={History} label="Mis Compras" onClick={closeDropdowns} />
                        <UserLink to="/dashboard/favorites" icon={Heart} label="Favoritos" onClick={closeDropdowns} />
                        <UserLink to="/dashboard/settings" icon={Settings} label="Configuración" onClick={closeDropdowns} />

                        <button onClick={signOut} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors w-full text-left border-t border-white/5 mt-2 pt-2">
                          <LogOut className="w-4 h-4" /> Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  </div>

                  <Link to="/dashboard/upload" className="hidden lg:flex bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-full text-sm font-bold transition-all ml-2 items-center gap-2 group shadow-[0_4px_15px_rgba(114,9,183,0.3)]">
                    <UploadCloud className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" /> Subir
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2 md:gap-3">
                  <Link to="/auth/login" className="text-xs md:text-sm font-semibold text-gray-300 hover:text-white px-2 md:px-4 py-2 rounded-lg transition-colors">
                    Login
                  </Link>
                  <Link to="/auth/register" className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all shadow-lg shadow-purple-900/10">
                    Join <Rocket className="hidden sm:inline w-4 h-4 ml-1" />
                  </Link>
                </div>
              )}

            </div>
          </div>

          {/* MOBILE SEARCH BAR (Toggleable) */}
          <div className={clsx("lg:hidden px-4 pb-2 transition-all duration-300 overflow-hidden", isSearchOpen ? "max-h-20 opacity-100 mt-2" : "max-h-0 opacity-0 pointer-events-none")}>
            <SearchBar />
          </div>
        </nav>
      </div>

      {/* Spacer to push content down since navbar is now fixed */}
      <div className={!user ? "h-[72px] md:h-[80px]" : "h-[48px] md:h-[56px]"}></div>

      {/* --- MOBILE MENU DRAWER --- */}
      <div className={clsx("fixed inset-0 z-[2000] lg:hidden transition-all duration-300", isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible")}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsMobileMenuOpen(false)}></div>
        <div className={clsx("absolute top-0 left-0 w-[300px] h-full bg-[#0a0a0a] border-r border-white/10 flex flex-col transition-transform duration-300 shadow-2xl", isMobileMenuOpen ? "translate-x-0" : "-translate-x-full")}>
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#111]">
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="OFFSZN" className="h-6 w-auto" />
              <span className="font-bold tracking-tighter text-lg">HQ <span className="text-primary">MOBILE</span></span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 p-2">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-8">
            {/* Main Navigation */}
            <div className="space-y-1">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-3 mb-4 block">Explora el Hub</span>
              <MobileNavItem to="/explorar" icon={Disc} label="Marketplace" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNavItem to="/reels" icon={PlayCircle} label="OFFSZN Reels" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNavItem to="/productores" icon={Users} label="Productores" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNavItem to="/collabs" icon={UserPlus} label="Colaboraciones" onClick={() => setIsMobileMenuOpen(false)} />
            </div>

            {/* Categorias */}
            <div className="space-y-1">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-3 mb-4 block">Kit de Sonidos</span>
              <MobileNavItem to="/beats" icon={Music} label="Beats" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNavItem to="/drum-kits" icon={Disc} label="Drum Kits" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNavItem to="/loops" icon={Music} label="Loops & Samples" onClick={() => setIsMobileMenuOpen(false)} />
              <MobileNavItem to="/presets" icon={Sliders} label="Presets VST" onClick={() => setIsMobileMenuOpen(false)} />
            </div>

            {/* Preferences */}
            <div className="pt-6 border-t border-white/5 space-y-6">
              <div className="flex items-center justify-between px-3 bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Moneda</span>
                  <span className="text-[9px] text-gray-600 font-bold uppercase mt-1">Configuración Regional</span>
                </div>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-black border border-white/10 rounded-lg text-xs font-bold px-3 py-2 outline-none text-white appearance-none min-w-20 text-center"
                >
                  <option value="USD">USD</option>
                  <option value="PEN">PEN</option>
                </select>
              </div>
            </div>
          </div>

          {!user ? (
            <div className="p-4 bg-[#111] border-t border-white/10 grid grid-cols-2 gap-3 pb-8">
              <Link to="/auth/login" className="py-4 text-center rounded-2xl bg-white/5 text-xs font-black uppercase tracking-widest border border-white/5" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
              <Link to="/auth/register" className="py-4 text-center rounded-2xl bg-primary text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20" onClick={() => setIsMobileMenuOpen(false)}>Join Now</Link>
            </div>
          ) : (
            <div className="p-4 bg-[#111] border-t border-white/10 pb-8">
              <Link to="/dashboard/upload" className="w-full py-4 text-center rounded-2xl bg-primary text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                <UploadCloud className="w-4 h-4" /> Subir Producto
              </Link>
            </div>
          )}
        </div>
      </div>

      <CartPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

const MegaLink = ({ to, icon: Icon, label }) => (
  <Link to={to} className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all group">
    <Icon className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
    <span className="text-sm font-medium">{label}</span>
  </Link>
);

const UserLink = ({ to, icon: Icon, label, onClick }) => (
  <Link to={to} onClick={onClick} className="flex items-center gap-4 px-3 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
    <Icon className="w-5 h-5 text-primary" />
    <span className="text-sm font-semibold">{label}</span>
  </Link>
);

const MobileNavItem = ({ to, icon: Icon, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-5 px-3 py-4 rounded-2xl hover:bg-violet-500/10 text-gray-300 hover:text-white transition-all group border border-transparent hover:border-violet-500/20"
  >
    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
      <Icon className="w-5 h-5 text-gray-500 group-hover:text-violet-500" />
    </div>
    <span className="text-sm font-black uppercase tracking-tight">{label}</span>
  </Link>
);

export default Navbar;