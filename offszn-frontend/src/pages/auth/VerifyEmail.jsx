import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Info } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const VerifyEmail = () => {
  const [email, setEmail] = useState('tu@email.com');
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    // Solo redirigir si el correo YA está confirmado
    if (user?.email_confirmed_at) {
      navigate('/welcome');
      return;
    }

    // 2. Obtener email del storage (guardado durante el registro)
    const storedEmail = sessionStorage.getItem('pendingEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // Si no hay email pendiente, probablemente entraron directo -> Login
      // navigate('/auth/login'); // Descomentar si quieres ser estricto
    }
  }, [user, navigate]);

  return (
    <div className="text-center w-full max-w-sm mx-auto">

      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-violet-600/10 flex items-center justify-center">
          <Mail className="w-8 h-8 text-violet-500" />
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <h1 className="text-white text-2xl font-semibold mb-2 font-display">Revisa tu correo</h1>
      </div>

      {/* Email Display */}
      <div className="mb-8">
        <p className="text-zinc-400 text-sm leading-relaxed mb-4">
          Hemos enviado un enlace de confirmación a:
        </p>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg py-3 px-4 inline-block max-w-full overflow-hidden">
          <span className="text-white font-medium block truncate font-sans">{email}</span>
        </div>
        <p className="text-zinc-500 text-xs mt-4">
          Por favor, confírmalo para activar tu cuenta.
        </p>
      </div>

      {/* Back to Login Button */}
      <Link to="/auth/login" className="block w-full py-3.5 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl transition-colors mb-6 font-display">
        Volver a Iniciar Sesión
      </Link>

      {/* Spam Hint */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-lg p-3 text-left flex gap-3 mb-6">
        <Info className="w-5 h-5 text-zinc-400 shrink-0" />
        <p className="text-zinc-400 text-xs leading-5">
          Si no encuentras el correo en tu bandeja de entrada, revisa la carpeta de <strong>Spam</strong> o <strong>Correo no deseado</strong>.
        </p>
      </div>

    </div>
  );
};

export default VerifyEmail;