import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/ui/Navbar';
import Footer from '../components/ui/Footer';
import StickyPlayer from '../components/player/StickyPlayer';
import CartSidebar from '../components/CartSidebar';
import ShaderBackground from '../components/ui/ShaderBackground';
import clsx from 'clsx';

const MainLayout = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isMessagesRoute = location.pathname.startsWith('/mensajes');

  return (
    <div className={clsx(
      "min-h-screen flex flex-col text-white font-sans selection:bg-primary/30 selection:text-white transition-colors duration-500",
      isHome ? "bg-black/20" : "bg-secondary"
    )}>
      {isHome && <ShaderBackground />}
      <Navbar />

      {/* Contenido Dinámico */}
      <main id="app-main" className="flex-grow flex flex-col w-full">
        <Outlet />
      </main>

      {!isMessagesRoute && <Footer />}

      <StickyPlayer />
      <CartSidebar />
    </div>
  );
};

export default MainLayout;