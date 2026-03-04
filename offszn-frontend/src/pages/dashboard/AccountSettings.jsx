import React, { useState, useEffect } from 'react';
import { supabase, apiClient } from "../../api/client";
import {
  User,
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  Settings,
  Sliders,
  UserCircle,
  DollarSign,
  Users as UsersIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import './LegacyAccountSettings.css';

const NAV_ITEMS = [
  { id: 'settings', label: 'Ajustes de cuenta', icon: Settings, active: true },
  { id: 'preferences', label: 'Preferencias', icon: Sliders },
  { id: 'profile', label: 'Perfil', icon: UserCircle },
  { id: 'transactions', label: 'Transacciones', icon: DollarSign },
  { id: 'following', label: 'Siguiendo', icon: UsersIcon }
];

export default function AccountSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // User & Form State
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    email: '',
    avatarUrl: '',
    spotify: '',
    instagram: '',
    youtube: '',
    tiktok: ''
  });

  // Password State
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Avatar State
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (data) {
        setUser(data);
        setFormData({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          nickname: data.nickname || '',
          email: data.email || authUser.email,
          avatarUrl: data.avatar_url || '',
          spotify: data.socials?.spotify || '',
          instagram: data.socials?.instagram || '',
          youtube: data.socials?.youtube || '',
          tiktok: data.socials?.tiktok || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error("Error al cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const saveChanges = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let finalAvatarUrl = formData.avatarUrl;

      if (avatarFile) {
        const reader = new FileReader();
        const base64Promise = new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(avatarFile);
        });
        const base64Image = await base64Promise;

        const { data: cloudRes } = await apiClient.post('/cloudinary/upload', {
          image: base64Image,
          folder: 'avatars'
        });
        finalAvatarUrl = cloudRes.url;
      }

      const { error } = await supabase
        .from('users')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          nickname: formData.nickname,
          avatar_url: finalAvatarUrl,
          socials: {
            ...user.socials,
            spotify: formData.spotify,
            instagram: formData.instagram,
            youtube: formData.youtube,
            tiktok: formData.tiktok
          },
          updated_at: new Date()
        })
        .eq('id', user.id);

      if (error) throw error;

      setFormData(prev => ({ ...prev, avatarUrl: finalAvatarUrl }));
      setAvatarFile(null);
      toast.success("Perfil actualizado con éxito");
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setChangingPassword(true);
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      toast.success("Contraseña actualizada con éxito");
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Error al cambiar contraseña");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="animate-spin text-violet-500" size={48} />
    </div>
  );

  return (
    <div className="settings-container">
      {/* Sidebar */}
      <aside className="settings-sidebar">
        <div className="profile-card">
          <div className="profile-card-avatar">
            {(avatarPreview || formData.avatarUrl) ? (
              <img src={avatarPreview || formData.avatarUrl} alt="Avatar" />
            ) : (
              formData.nickname?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <div className="profile-card-name">{formData.nickname || 'Usuario'}</div>
          <div className="profile-card-role">
            {user?.is_producer ? 'Productor' : 'Usuario'}
          </div>
        </div>

        <nav className="settings-nav">
          {NAV_ITEMS.map(item => (
            <a key={item.id} href="#" className={`settings-nav-item ${item.active ? 'active' : ''}`}>
              <item.icon size={18} />
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="settings-main">
        <h1 className="settings-section-title">Editar cuenta</h1>

        <section className="settings-group">
          <h2 className="settings-group-title">Información Personal</h2>

          <div className="avatar-edit-wrapper">
            <div className="avatar-edit-preview">
              {(avatarPreview || formData.avatarUrl) ? (
                <img src={avatarPreview || formData.avatarUrl} alt="Preview" />
              ) : (
                formData.nickname?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <label className="btn-change-avatar">
              Cambiar avatar
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>

          <form className="form-grid" onSubmit={saveChanges}>
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleFormChange}
                className="form-input"
                placeholder="Tu nombre"
              />
            </div>
            <div className="form-group">
              <label>Apellido</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleFormChange}
                className="form-input"
                placeholder="Tu apellido"
              />
            </div>
            <div className="form-group full-width">
              <label>Nombre de usuario (Username)</label>
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleFormChange}
                className="form-input"
                placeholder="nombredeusuario"
              />
            </div>
            <div className="form-group full-width">
              <label>Correo electrónico</label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="form-input opacity-50 cursor-not-allowed"
              />
            </div>
            <div className="form-actions">
              <button type="submit" disabled={saving} className="btn-primary-sm">
                {saving ? <Loader2 className="animate-spin" size={20} /> : 'Guardar información personal'}
              </button>
            </div>
          </form>
        </section>

        <section className="settings-group">
          <h2 className="settings-group-title">Redes Sociales</h2>
          <form className="form-grid" onSubmit={saveChanges}>
            <div className="form-group">
              <label>Spotify (Link de artista)</label>
              <input
                type="text"
                name="spotify"
                value={formData.spotify}
                onChange={handleFormChange}
                className="form-input"
                placeholder="https://open.spotify.com/artist/..."
              />
            </div>
            <div className="form-group">
              <label>Instagram</label>
              <input
                type="text"
                name="instagram"
                value={formData.instagram}
                onChange={handleFormChange}
                className="form-input"
                placeholder="@usuario"
              />
            </div>
            <div className="form-group">
              <label>YouTube</label>
              <input
                type="text"
                name="youtube"
                value={formData.youtube}
                onChange={handleFormChange}
                className="form-input"
                placeholder="Canal o handle"
              />
            </div>
            <div className="form-group">
              <label>TikTok</label>
              <input
                type="text"
                name="tiktok"
                value={formData.tiktok}
                onChange={handleFormChange}
                className="form-input"
                placeholder="@usuario"
              />
            </div>
            <div className="form-actions">
              <button type="submit" disabled={saving} className="btn-primary-sm">
                {saving ? <Loader2 className="animate-spin" size={20} /> : 'Guardar redes sociales'}
              </button>
            </div>
          </form>
        </section>

        <section className="settings-group">
          <h2 className="settings-group-title">Cambiar contraseña</h2>
          <form className="form-grid" onSubmit={updatePassword}>
            <div className="form-group full-width">
              <label>Contraseña actual</label>
              <div className="relative">
                <input
                  type={showPasswords.current ? "text" : "password"}
                  name="current"
                  value={passwords.current}
                  onChange={handlePasswordChange}
                  className="form-input pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  name="new"
                  value={passwords.new}
                  onChange={handlePasswordChange}
                  className="form-input pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Confirmar nueva contraseña</label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  name="confirm"
                  value={passwords.confirm}
                  onChange={handlePasswordChange}
                  className="form-input pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="form-actions flex justify-between">
              <a href="/auth/forgot-password" style={{ color: '#a1a1aa', fontSize: '0.85rem', textDecoration: 'underline' }}>
                Olvidé mi contraseña
              </a>
              <button type="submit" disabled={changingPassword} className="btn-primary-sm">
                {changingPassword ? <Loader2 className="animate-spin" size={20} /> : 'Actualizar contraseña'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
