import { create } from 'zustand';
import { supabase } from '../api/client'; // Importamos el cliente centralizado

// --- 1. RE-EXPORTAR SUPABASE ---
// Esto arregla los errores en AuthCallback, UpdatePassword, etc.
// que buscan "import { supabase } from '../../store/authStore'"
export { supabase };

// --- 2. DEFINIR EL STORE ---
const authStoreDefinition = (set) => ({
  user: null,
  profile: null,
  loading: true,

  // Verificar sesión al cargar la app
  checkSession: async () => {
    set({ loading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchProfile(session.user, set);
        setAuthCookie(session.access_token);
      } else {
        // Preservar usuario si ya existe uno (ej. registro pendiente)
        set((state) => ({
          user: state.user || null,
          profile: state.profile || null,
          loading: false
        }));
      }
    } catch (error) {
      console.error("Error session:", error);
      set({ loading: false });
    }
  },

  // Iniciar Sesión Normal
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      await fetchProfile(data.user, set);
      setAuthCookie(data.session.access_token);
    }
    return data;
  },

  // Registrarse
  signUp: async (email, password, options = {}) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options
    });
    if (error) throw error;

    // Set user state immediately after signup
    if (data.user) {
      set({ user: data.user });
      await fetchProfile(data.user, set);
      if (data.session?.access_token) {
        setAuthCookie(data.session.access_token);
      }
    } else {
      set({ loading: false });
    }

    return data;
  },

  // Login con Google
  signInWithGoogle: async (redirectTo = '/auth/callback') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${redirectTo}`
      }
    });
    if (error) throw error;
    return data;
  },

  // Recuperar Contraseña
  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) throw error;
    return data;
  },

  // Actualizar Contraseña
  updatePassword: async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  },

  // Cerrar Sesión
  signOut: async () => {
    await supabase.auth.signOut();
    document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=Strict; Secure";
    set({ user: null, profile: null });
  }
});

// --- 3. EXPORTAR CON AMBOS NOMBRES ---
// Creamos el hook de Zustand
const useAuthBase = create(authStoreDefinition);

// Para el código NUEVO (UploadBeats.jsx usa 'useAuth')
export const useAuth = useAuthBase;

// Para el código VIEJO (Login.jsx, Navbar.jsx usan 'useAuthStore')
export const useAuthStore = useAuthBase;


// --- HELPERS ---
const fetchProfile = async (user, set) => {
  try {
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    set({ user, profile: profile || { nickname: user.user_metadata?.nickname }, loading: false });
  } catch (error) {
    set({ user, profile: { nickname: user.user_metadata?.nickname }, loading: false });
  }
};

const setAuthCookie = (token) => {
  const maxAge = 60 * 60 * 24 * 7; // 1 semana
  document.cookie = `sb-access-token=${token}; path=/; max-age=${maxAge}; SameSite=Strict; Secure`;
};