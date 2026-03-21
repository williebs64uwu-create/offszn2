import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Music } from 'lucide-react';

const NotFound = () => {
  return (
    <main className="relative flex flex-col items-center justify-center min-h-[calc(100vh-80px)] overflow-hidden text-center p-5">

      {/* Background Giant 404 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[clamp(15rem,30vw,45rem)] font-black text-white/[0.02] -z-10 leading-none font-['Plus_Jakarta_Sans'] pointer-events-none select-none">
        404
      </div>

      {/* Main Content Card */}
      <div className="z-10 w-full max-w-[600px] p-8 bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.4)]">

        <div className="w-[60px] h-[60px] rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl text-white">⚠️</span>
        </div>

        <h1 className="text-4xl md:text-[2.5rem] font-extrabold mb-2 text-white font-['Plus_Jakarta_Sans'] tracking-tight">
          Te perdiste en el estudio.
        </h1>

        <p className="text-[#999] mb-10 text-[1.05rem] leading-relaxed">
          La página que estás buscando no existe o está temporalmente fuera de temporada <span className="font-semibold text-[#ccc]">(OFFSZN)</span>.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            to="/"
            className="flex items-center gap-2 bg-white text-black border-none py-3.5 px-7 font-bold rounded-xl text-[0.95rem] font-['Plus_Jakarta_Sans'] transition-opacity hover:opacity-90"
          >
            <Home size={18} /> Ir al Inicio
          </Link>

          <Link
            to="/explorar"
            className="flex items-center gap-2 bg-white/5 text-white border border-white/10 py-3.5 px-7 font-semibold rounded-xl text-[0.95rem] font-['Plus_Jakarta_Sans'] transition-colors hover:bg-white/10"
          >
            <Music size={18} /> Explorar Sonidos
          </Link>
        </div>
      </div>
    </main>
  );
};

export default NotFound;