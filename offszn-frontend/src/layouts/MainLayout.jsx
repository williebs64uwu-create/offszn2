import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/ui/Navbar';
import Footer from '../components/ui/Footer';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-secondary text-white font-sans selection:bg-primary/30 selection:text-white">
      <Navbar />
      
      {/* Contenido Dinámico */}
      <main className="flex-grow flex flex-col w-full">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default MainLayout;