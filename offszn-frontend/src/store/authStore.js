import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';

// Inicializamos Supabase aquí (o impórtalo desde tu config si ya la tienes)
// REEMPLAZA CON TUS CREDENCIALES REALES DEL NAVBAR.HTML
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://qtjpvztpgfymjhhpoouq.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0anB2enRwZ2Z5bWpoaHBvb3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3ODA5MTUsImV4cCI6MjA3NjM1NjkxNX0.YsItTFk3hSQaVuy707-z7Z-j34mXa03O0wWGAlAzjrw";

export const supabase = createClient(supabaseUrl, supabaseKey);

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  loading: true,

  // Función para inicializar sesión (Reemplaza initAuth)
  checkSession: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Buscar perfil extendido (nickname, avatar)
        const { data: profile } = await supabase
          .from('users') // Asegúrate que la tabla sea 'users' o 'profiles'
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({ user: session.user, profile: profile || {}, loading: false });
      } else {
        set({ user: null, profile: null, loading: false });
      }
    } catch (error) {
      console.error("Error checking session:", error);
      set({ loading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
    window.location.href = '/';
  }
}));