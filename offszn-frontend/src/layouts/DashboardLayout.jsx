import React, { useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { useUploadStore } from '../store/uploadStore';
import {
  BiGridAlt,
  BiDisc,
  BiCloudUpload,
  BiFile,
  BiPurchaseTag,
  BiGroup,
  BiBook,
  BiBarChartAlt2,
  BiMoviePlay,
  BiRocket,
  BiDollar,
  BiMenu,
  BiX,
  BiBell,
  BiSliderAlt,
  BiTransferAlt
} from 'react-icons/bi';
import { BsPeopleFill } from "react-icons/bs";
import logo from '../assets/images/LOGO-OFFSZN.png';
import { useAuthStore } from '../store/authStore';

export default function DashboardLayout() {
  const { user, profile, loading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isUploadPage = location.pathname.startsWith('/dashboard/upload');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  React.useEffect(() => {
    if (!loading && user && (!profile || !profile.nickname)) {
      navigate('/welcome');
    }
  }, [user, profile, loading, navigate]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-black text-white font-inter flex flex-col lg:flex-row">
      {/* --- FONDO RADIAL GLOW --- */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.08), transparent 70%)'
        }}
      />

      {/* --- MOBILE HEADER --- */}
      {!isUploadPage && (
        <header className="lg:hidden h-16 bg-black border-b border-[#1A1A1A] flex items-center justify-between px-6 sticky top-0 z-[60]">
          <Link to="/" className="w-8 h-8 flex items-center justify-center">
            <img src={logo} alt="OFFSZN" className="w-7 mix-blend-screen" />
          </Link>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-white text-3xl p-1"
          >
            {isSidebarOpen ? <BiX /> : <BiMenu />}
          </button>
        </header>
      )}

      {/* --- SIDEBAR --- */}
      {!isUploadPage && (
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      )}

      {/* --- BACKDROP (Mobile) --- */}
      {isSidebarOpen && !isUploadPage && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- MAIN CONTENT --- */}
      <main className={`flex-1 p-6 md:p-10 relative z-10 ${isUploadPage ? 'w-full' : 'lg:ml-[80px]'}`}>
        <Outlet />
      </main>
    </div>
  );
}

// --- SUB-COMPONENTE: SIDEBAR ---
function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <aside className={`
      fixed top-0 left-0 h-screen w-[280px] lg:w-[80px] bg-black border-r border-[#1A1A1A] z-50 
      flex flex-col items-center py-5 gap-2 transition-transform duration-300 lg:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>

      {/* LOGO (Desktop) */}
      <Link to="/" className="hidden lg:flex w-11 h-11 items-center justify-center mb-2">
        <img src={logo} alt="OFFSZN" className="w-9 mix-blend-screen" />
      </Link>

      {/* LOGO (Mobile Header inside sidebar if needed) */}
      <div className="lg:hidden flex items-center gap-3 w-full px-6 mb-6">
        <img src={logo} alt="OFFSZN" className="w-8 mix-blend-screen" />
        <span className="font-bold text-lg tracking-tight">OFFSZN <span className="text-primary italic">HQ</span></span>
      </div>

      {/* --- GRUPO 1: GESTIÓN --- */}
      <Divider />
      <SidebarItem to="/dashboard" icon={<BiGridAlt />} label="Dashboard" active={location.pathname === '/dashboard' || location.pathname === '/dashboard/'} onClick={onClose} />
      <SidebarItem to="/dashboard/my-products" icon={<BiDisc />} label="Mis Kits" active={isActive('/dashboard/my-products')} onClick={onClose} />

      <SidebarItem
        to="/dashboard/upload"
        icon={<BiCloudUpload />}
        label="Subir"
        active={isActive('/dashboard/upload')}
        onClick={() => {
          useUploadStore.getState().resetForm();
          onClose();
        }}
      />

      {/* --- GRUPO 2: NEGOCIO --- */}
      <Divider />
      <SidebarItem to="/dashboard/licenses" icon={<BiFile />} label="Licencias" active={isActive('/dashboard/licenses')} onClick={onClose} />
      <SidebarItem to="/dashboard/coupons" icon={<BiPurchaseTag />} label="Cupones" active={isActive('/dashboard/coupons')} onClick={onClose} />
      <SidebarItem to="/dashboard/collaborations" icon={<BiGroup />} label="Colaboraciones" active={isActive('/dashboard/collaborations')} onClick={onClose} />
      <SidebarItem to="/dashboard/negotiations" icon={<BiDollar />} label="Negociar" active={isActive('/dashboard/negotiations')} onClick={onClose} />

      {/* --- GRUPO 3: ACADEMIA --- */}
      <Divider />
      <SidebarItem to="#" icon={<BiBook />} label="Cursos (Próximamente)" active={false} disabled />
      <SidebarItem to="/dashboard/analytics" icon={<BiBarChartAlt2 />} label="Estadísticas" active={isActive('/dashboard/analytics')} onClick={onClose} />

      {/* --- GRUPO 4: CUENTA --- */}
      <Divider />
      <SidebarItem to="/dashboard/notifications" icon={<BiBell />} label="Notificaciones" active={isActive('/dashboard/notifications')} onClick={onClose} />
      <SidebarItem to="/dashboard/following" icon={<BsPeopleFill />} label="Siguiendo" active={isActive('/dashboard/following')} onClick={onClose} />
      <SidebarItem to="/dashboard/preferences" icon={<BiSliderAlt />} label="Preferencias" active={isActive('/dashboard/preferences')} onClick={onClose} />
      <SidebarItem to="/dashboard/transactions" icon={<BiTransferAlt />} label="Transacciones" active={isActive('/dashboard/transactions')} onClick={onClose} />

      {/* --- GRUPO 5: SOCIAL --- */}
      <Divider />
      <SidebarItem to="#" icon={<BiMoviePlay />} label="Reels (Próximamente)" active={false} disabled />

      {/* --- UPGRADE (ROCKET) --- */}
      <div className="mt-auto w-full px-4 lg:px-0 flex justify-center">
        <Link
          to="/dashboard/plans"
          onClick={onClose}
          className="w-full lg:w-10 h-12 lg:h-10 rounded-xl flex items-center lg:justify-center px-4 lg:px-0 text-[#FFD700] bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.2)] hover:scale-105 hover:bg-[rgba(255,215,0,0.2)] hover:shadow-[0_0_15px_rgba(255,215,0,0.2)] transition-all duration-200 relative group gap-3"
        >
          <BiRocket size={20} className="shrink-0" />
          <span className="lg:hidden text-xs font-bold uppercase tracking-widest">Mejorar Plan</span>
          <span className="hidden lg:block absolute left-[70px] bg-[#111] border border-[#333] text-white text-xs px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl z-50 font-medium">
            Mejorar Plan
          </span>
        </Link>
      </div>
    </aside>
  );
}

function SidebarItem({ to, icon, label, active, onClick, disabled }) {
  return (
    <Link
      to={disabled ? '#' : to}
      onClick={disabled ? (e) => e.preventDefault() : onClick}
      className={`
        w-full lg:w-10 h-12 lg:h-10 rounded-xl flex items-center lg:justify-center px-6 lg:px-0 gap-4 transition-all duration-200 relative group
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
        ${active
          ? 'bg-[#8B5CF6] text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]'
          : 'text-[#666] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
        }
      `}
    >
      <span className="text-xl lg:text-2xl shrink-0">{icon}</span>
      <span className="lg:hidden text-sm font-medium">{label}</span>

      <span className="hidden lg:block absolute left-[70px] bg-[#111] border border-[#333] text-white text-xs px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl z-50 font-medium">
        {label}
      </span>
    </Link>
  );
}

function Divider() {
  return <div className="w-full lg:w-10 px-6 lg:px-0 my-1.5">
    <div className="w-full border-b border-[#222] opacity-50"></div>
  </div>;
}