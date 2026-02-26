import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

import StepIndicator from '../../components/onboarding/StepIndicator';

const Register = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { signUp, signInWithGoogle, user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectToFromURL = searchParams.get('redirect');

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState(null);

  const steps = [
    { num: 1, label: 'Cuenta' },
    { num: 2, label: 'Básico' },
    { num: 3, label: 'Rol' },
    { num: 4, label: 'Social' },
    { num: 5, label: 'Avatar' }
  ];

  const onSubmit = async (data) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const emailRedirectTo = `${window.location.origin}/auth/callback?redirect=welcome`;

      // 1. Llamamos a signUp. 
      // NOTA: Quitamos la desestructuración compleja para ver qué nos llega.
      const response = await signUp(data.email, data.password, { emailRedirectTo });

      // 2. Extraemos la data de forma segura
      // Esto maneja si el store devuelve {data, error} o solo data
      const resultData = response?.data || response;

      // 3. Guardamos el email para la pantalla de verificación
      sessionStorage.setItem('pendingEmail', data.email);

      // 4. Verificamos la sesión con seguridad usando el encadenamiento opcional (?.)
      if (!resultData?.session) {
        console.log("No hay sesión inmediata, yendo a verificación de email");
        navigate('/auth/verify-email');
      } else {
        console.log("Sesión iniciada automáticamente");
        navigate('/welcome');
      }
    } catch (error) {
      console.error("Error detallado de Supabase:", error); // <--- Mira la consola
      // Muestra el mensaje real que viene de Supabase (ej: "User already registered")
      setAuthError(error.message || "Error al crear cuenta. Intenta con otro correo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      await signInWithGoogle('/welcome');
    } catch (error) {
      setAuthError("Error al registrarse con Google.");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <StepIndicator currentStep={1} totalSteps={5} steps={steps} />

      <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 lg:p-12 shadow-2xl">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-white text-3xl font-bold mb-3 font-display">Crea tu cuenta</h1>
          <p className="text-zinc-400 text-sm">Empieza tu próxima temporada musical hoy mismo.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          <div className="grid grid-cols-1 gap-6">
            {/* Email */}
            <div>
              <label className="block text-zinc-400 text-[11px] font-bold uppercase tracking-widest mb-3 ml-1">Correo electrónico</label>
              <input
                {...register("email", {
                  required: "El correo es obligatorio",
                  pattern: {
                    value: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i,
                    message: "Ingresa un correo válido"
                  }
                })}
                type="email"
                placeholder="tu@email.com"
                className="w-full px-5 py-4 bg-[#0f0f0f] border border-white/10 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-600/50 focus:ring-1 focus:ring-purple-600/50 transition-all font-sans text-lg"
              />
              {errors.email && <span className="text-red-500 text-xs mt-3 block font-medium px-1">{errors.email.message}</span>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-zinc-400 text-[11px] font-bold uppercase tracking-widest mb-3 ml-1">Contraseña</label>
              <div className="relative">
                <input
                  {...register("password", {
                    required: "La contraseña es obligatoria",
                    minLength: { value: 6, message: "La contraseña debe tener al menos 6 caracteres" },
                    maxLength: { value: 15, message: "La contraseña no puede exceder 15 caracteres" }
                  })}
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-5 py-4 bg-[#0f0f0f] border border-white/10 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-600/50 focus:ring-1 focus:ring-purple-600/50 transition-all pr-14 font-sans text-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-5 flex items-center text-zinc-500 hover:text-white transition-colors cursor-pointer focus:outline-none"
                >
                  {showPassword ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
                </button>
              </div>
              {errors.password && <span className="text-red-500 text-xs mt-3 block font-medium px-1">{errors.password.message}</span>}
            </div>
          </div>

          {/* Error Message Global */}
          {authError && (
            <div className="text-red-400 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs font-medium animate-in fade-in zoom-in duration-300">
              {authError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.1)] flex items-center justify-center font-display text-lg mt-4"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Siguiente paso"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-10">
          <div className="flex-1 h-px bg-zinc-800"></div>
          <span className="px-6 text-zinc-500 text-xs font-bold uppercase tracking-widest">o continúa con</span>
          <div className="flex-1 h-px bg-zinc-800"></div>
        </div>

        {/* Social Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleGoogleRegister}
            className="w-full flex items-center justify-center gap-3 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-white hover:bg-zinc-800 transition-all font-bold text-lg"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
        </div>

        {/* Login Link */}
        <p className="text-center text-zinc-500 text-sm mt-10">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/auth/login" className="text-white hover:underline font-bold">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;