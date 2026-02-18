import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2 } from 'lucide-react'; // Usamos iconos limpios para el ojo
import { useAuthStore } from '../../store/authStore';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { signIn, signInWithGoogle, user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Instant Guard: Si ya hay usuario, redirigir
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await signIn(data.email, data.password);
      navigate(redirectTo);
    } catch (error) {
      setAuthError("Credenciales incorrectas o error en el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle(redirectTo);
    } catch (error) {
      setAuthError("Error al iniciar sesión con Google.");
    }
  };

  return (
    <>
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-white text-2xl font-semibold mb-2 font-display">Iniciar Sesión</h1>
        <p className="text-zinc-400 text-sm">Bienvenido de nuevo.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Email */}
        <div>
          <label className="block text-zinc-400 text-sm mb-2 font-medium">Correo electrónico</label>
          <input
            {...register("email", { required: "El correo es obligatorio" })}
            type="email"
            placeholder="tu@email.com"
            className="w-full px-4 py-3 bg-[#0f0f0f] border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-600/50 focus:ring-1 focus:ring-purple-600/50 transition-all font-sans"
          />
          {errors.email && <span className="text-red-500 text-xs mt-2 block font-medium">{errors.email.message}</span>}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-zinc-400 text-sm font-medium">Contraseña</label>
            <Link to="/auth/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <div className="relative">
            <input
              {...register("password", { required: "La contraseña es obligatoria" })}
              type={showPassword ? "text" : "password"}
              placeholder="Tu contraseña"
              className="w-full px-4 py-3 bg-[#0f0f0f] border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-600/50 focus:ring-1 focus:ring-purple-600/50 transition-all pr-12 font-sans"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 px-4 flex items-center text-zinc-500 hover:text-white transition-colors cursor-pointer focus:outline-none"
            >
              {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <span className="text-red-500 text-xs mt-2 block font-medium">{errors.password.message}</span>}
        </div>

        {/* Error Message Global */}
        {authError && (
          <div className="text-red-500 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg text-xs font-medium">
            {authError}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-colors shadow-[0_4px_20px_rgba(124,58,237,0.3)] flex items-center justify-center font-display"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Iniciar sesión"}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center my-6">
        <div className="flex-1 h-px bg-zinc-800"></div>
        <span className="px-4 text-zinc-500 text-sm">o continúa con</span>
        <div className="flex-1 h-px bg-zinc-800"></div>
      </div>

      {/* Social Buttons (Google SVG Original) */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white hover:bg-zinc-800 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>
      </div>

      {/* Register Link */}
      <p className="text-center text-zinc-400 text-sm mt-6">
        ¿No tienes una cuenta?{' '}
        <Link to="/auth/register" className="text-white hover:underline font-medium">Regístrate</Link>
      </p>
    </>
  );
};

export default Login;