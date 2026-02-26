import { Outlet, Link } from 'react-router-dom';
import logoImg from '../assets/images/LOGO-OFFSZN.png';

const AuthLayout = () => {
  return (
    <div className="bg-black min-h-screen flex flex-col font-sans">

      {/* Contenido Principal (Login/Register se renderizan aquí) */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">

          {/* Logo (Clickable -> Home) */}
          <div className="flex justify-center mb-6">
            <Link to="/" className="hover:opacity-80 transition-opacity" title="Volver al inicio">
              <img src={logoImg} alt="OFFSZN" className="h-[80px] w-auto" />
            </Link>
          </div>

          <Outlet />

        </div>
      </main>

      {/* Footer (Terminos y Privacidad) */}
      <footer className="flex items-center justify-center gap-4 py-4 text-zinc-500 text-sm">
        <Link to="/legal/terminos" className="hover:text-zinc-300 transition-colors">
          Términos
        </Link>
        <Link to="/legal/privacidad" className="hover:text-zinc-300 transition-colors">
          Política de Privacidad
        </Link>
      </footer>
    </div>
  );
};

export default AuthLayout;