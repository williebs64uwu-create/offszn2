import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useUploadStore } from '../store/uploadStore';
// He cambiado TODOS los iconos por versiones que SÍ existen en BoxIcons
import {
  BiGridAlt,          // Dashboard
  BiDisc,             // Mis Kits
  BiCloudUpload,      // Subir (Antes fallaba como BiCloudArrowUpFill)
  BiFile,             // Licencias
  BiPurchaseTag,      // Cupones
  BiGroup,            // Colaboraciones
  BiBook,             // Cursos
  BiBarChartAlt2,     // Estadísticas
  BiMoviePlay,        // Reels
  BiRocket            // Upgrade
} from 'react-icons/bi';

import logo from '../assets/images/LOGO-OFFSZN.png'; // Tu logo

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function DashboardLayout() {
  const { user, profile, loading } = useAuthStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && user && (!profile || !profile.nickname)) {
      navigate('/welcome');
    }
  }, [user, profile, loading, navigate]);

  if (loading) return null; // O un spinner
  return (
    <div className="min-h-screen bg-black text-white font-inter flex">
      {/* --- FONDO RADIAL GLOW --- */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.08), transparent 70%)'
        }}
      />

      {/* --- SIDEBAR --- */}
      <Sidebar />

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 ml-[80px] p-10 relative z-10">
        <Outlet />
      </main>
    </div>
  );
}

// --- SUB-COMPONENTE: SIDEBAR ---
function Sidebar() {
  const location = useLocation();
  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <aside className="fixed top-0 left-0 h-screen w-[80px] bg-black border-r border-[#1A1A1A] z-50 flex flex-col items-center py-5 gap-2">

      {/* LOGO */}
      <Link to="/" className="w-11 h-11 flex items-center justify-center mb-2">
        <img src={logo} alt="OFFSZN" className="w-9 mix-blend-screen" />
      </Link>

      {/* --- GRUPO 1: GESTIÓN --- */}
      <Divider />
      <SidebarItem to="/dashboard" icon={<BiGridAlt />} label="Dashboard" active={location.pathname === '/dashboard' || location.pathname === '/dashboard/'} />
      <SidebarItem to="/dashboard/my-products" icon={<BiDisc />} label="Mis Kits" active={isActive('/dashboard/my-products')} />

      <SidebarItem
        to="/dashboard/upload"
        icon={<BiCloudUpload />}
        label="Subir"
        active={isActive('/dashboard/upload')}
        onClick={() => useUploadStore.getState().resetForm()}
      />

      {/* --- GRUPO 2: NEGOCIO --- */}
      <Divider />
      <SidebarItem to="/dashboard/licenses" icon={<BiFile />} label="Licencias" active={isActive('/dashboard/licenses')} />
      <SidebarItem to="/dashboard/coupons" icon={<BiPurchaseTag />} label="Cupones" active={isActive('/dashboard/coupons')} />
      <SidebarItem to="/dashboard/collaborations" icon={<BiGroup />} label="Colaboraciones" active={isActive('/dashboard/collaborations')} />

      {/* --- GRUPO 3: ACADEMIA --- */}
      <Divider />
      <SidebarItem to="#" icon={<BiBook />} label="Cursos (Próximamente)" active={false} />
      <SidebarItem to="/dashboard/analytics" icon={<BiBarChartAlt2 />} label="Estadísticas" active={isActive('/dashboard/analytics')} />

      {/* --- GRUPO 4: SOCIAL --- */}
      <Divider />
      <SidebarItem to="#" icon={<BiMoviePlay />} label="Reels (Próximamente)" active={false} />

      {/* --- UPGRADE (ROCKET) --- */}
      <div className="mt-auto">
        <Link
          to="/dashboard/plans"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#FFD700] bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.2)] hover:scale-105 hover:bg-[rgba(255,215,0,0.2)] hover:shadow-[0_0_15px_rgba(255,215,0,0.2)] transition-all duration-200 relative group"
        >
          <BiRocket size={20} />
          <span className="absolute left-[70px] bg-[#111] border border-[#333] text-white text-xs px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl z-50 font-medium">
            Mejorar Plan
          </span>
        </Link>
      </div>
    </aside>
  );
}

function SidebarItem({ to, icon, label, active, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`
        w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all duration-200 relative group
        ${active
          ? 'bg-[#8B5CF6] text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]'
          : 'text-[#666] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
        }
      `}
    >
      {icon}

      <span className="absolute left-[70px] bg-[#111] border border-[#333] text-white text-xs px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl z-50 font-medium">
        {label}
      </span>
    </Link>
  );
}

function Divider() {
  return <div className="w-10 border-b border-[#222] my-1.5 opacity-50"></div>;
}