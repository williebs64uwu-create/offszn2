import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/ui/Navbar';
import Footer from '../components/ui/Footer';
import StickyPlayer from '../components/player/StickyPlayer';
import CartSidebar from '../components/CartSidebar';

const MainLayout = () => {
  const location = useLocation();
  const isMessagesRoute = location.pathname.startsWith('/mensajes');

  return (
    <div className="min-h-screen flex flex-col bg-secondary text-white font-sans selection:bg-primary/30 selection:text-white">
      <Navbar />

      {/* Contenido Dinámico */}
      <main className="flex-grow flex flex-col w-full">
        <Outlet />
      </main>

      {!isMessagesRoute && <Footer />}

      <StickyPlayer />
      <CartSidebar />
    </div>
  );
};

export default MainLayout;