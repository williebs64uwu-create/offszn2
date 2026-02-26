import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore, supabase } from '../../store/authStore';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkSession } = useAuthStore();
  const [status, setStatus] = useState("Procesando autenticación...");

  useEffect(() => {
    const handleCallback = async () => {
      // 1. Obtener sesión actual (Supabase ya procesó el hash de la URL)
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        console.error("Error callback:", error);
        setStatus("Error de autenticación. Redirigiendo...");
        setTimeout(() => navigate('/auth/login'), 2000);
        return;
      }

      // 2. Sincronizar estado global y cookies
      await checkSession();

      // 3. Lógica de Redirección Inteligente (V3)
      const redirectParam = searchParams.get('redirect');
      const user = session.user;

      // Verificar perfil en base de datos
      const { data: profile } = await supabase
        .from('users')
        .select('nickname')
        .eq('id', user.id)
        .single();

      const hasCompletedOnboarding = profile && profile.nickname;

      if (redirectParam === 'carrito') {
        navigate('/carrito');
      } else if (!hasCompletedOnboarding) {
        navigate('/welcome');
      } else {
        navigate('/');
      }
    };

    handleCallback();
  }, [navigate, checkSession, searchParams]);

  return (
    <div className="bg-black min-h-screen flex items-center justify-center font-sans">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-zinc-700 border-t-white mb-4"></div>
        <p className="text-white text-lg font-medium">{status}</p>
        <p className="text-zinc-500 text-sm mt-2">Por favor espera un momento...</p>
      </div>
    </div>
  );
};

export default AuthCallback;