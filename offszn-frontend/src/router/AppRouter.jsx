import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Pages - General
import Home from '../pages/Home';
import Explore from '../pages/Explore';
import ProductDetail from '../pages/ProductDetail';
import NotFound from '../pages/NotFound';
import Success from '../pages/Success';
import Checkout from '../pages/Checkout';
import MyPurchases from '../pages/MyPurchases'; // Si existe
import Messages from '../pages/Messages';
import Reels from '../pages/Reels';
import { useAuth } from '../store/authStore';


// Pages - Public (AQUÍ FALTABA ESTE IMPORT)
import Profile from '../pages/public/Profile';
import CommunityPage from '../pages/public/CommunityPage';

// Pages - Auth
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import UpdatePassword from '../pages/auth/UpdatePassword';
import VerifyEmail from '../pages/auth/VerifyEmail';
import AuthCallback from '../pages/auth/AuthCallback';
import Welcome from '../pages/auth/Welcome';

// Pages - Dashboard
import Overview from '../pages/dashboard/Overview';
import AccountSettings from '../pages/dashboard/AccountSettings';
import UploadWizard from '../pages/account/UploadWizard';
import EditBeat from '../pages/account/EditBeat';
import YouTubeImport from '../pages/account/YouTubeImport';
import MyProducts from '../pages/dashboard/producer/MyProducts';
import LicenseManager from '../pages/dashboard/producer/LicenseManager';
import Collaborations from '../pages/dashboard/producer/Collaborations';
import Analytics from '../pages/dashboard/producer/Analytics';
import Coupons from '../pages/dashboard/producer/Coupons';
import SubscriptionPlans from '../pages/dashboard/producer/SubscriptionPlans';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";


const AppRouter = () => {
  const { checkSession } = useAuth();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <PayPalScriptProvider options={{ "client-id": "sb", currency: "USD" }}>
      <Routes>
        {/* --- RUTAS PÚBLICAS (Con MainLayout) --- */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/explorar" element={<Explore />} />

          {/* SEO Product Routes */}
          <Route path="/beat/:slug" element={<ProductDetail />} />
          <Route path="/loopkit/:slug" element={<ProductDetail />} />
          <Route path="/drumkit/:slug" element={<ProductDetail />} />
          <Route path="/preset/:slug" element={<ProductDetail />} />
          <Route path="/producto/:id" element={<ProductDetail />} />

          <Route path="/checkout" element={<Checkout />} />
          <Route path="/success" element={<Success />} />
          <Route path="/mensajes" element={<Messages />} />
          <Route path="/reels" element={<Reels />} />

          {/* SEO Resource Routes */}
          <Route path="/beats" element={<Explore />} />
          <Route path="/drum-kits" element={<Explore />} />
          <Route path="/loops" element={<Explore />} />
          <Route path="/presets" element={<Explore />} />
          <Route path="/one-shots" element={<Explore />} />
          <Route path="/gratis" element={<Explore />} />

          {/* Genre Routes */}
          <Route path="/hip-hop" element={<Explore />} />
          <Route path="/trap" element={<Explore />} />
          <Route path="/reggaeton" element={<Explore />} />
          <Route path="/drill" element={<Explore />} />
          <Route path="/rnb" element={<Explore />} />

          {/* Community Routes */}
          <Route path="/productores" element={<CommunityPage />} />
          <Route path="/collabs" element={<CommunityPage />} />
          <Route path="/feed" element={<CommunityPage />} />
          <Route path="/eventos" element={<CommunityPage />} />

          {/* Rutas de Usuario Público */}
          <Route path="/u/:username" element={<Profile />} />
          <Route path="/@:username" element={<Profile />} />
        </Route>

        {/* --- RUTAS DE AUTENTICACIÓN --- */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="update-password" element={<UpdatePassword />} />
          <Route path="verify-email" element={<VerifyEmail />} />
          <Route path="callback" element={<AuthCallback />} />
        </Route>

        {/* --- ONBOARDING (Standalone) --- */}
        <Route path="/welcome" element={<Welcome />} />

        {/* --- RUTAS DEL DASHBOARD (Protegidas) --- */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="settings" element={<AccountSettings />} />
          <Route path="my-purchases" element={<MyPurchases />} />

          {/* RUTA DEL WIZARD */}
          <Route path="upload" element={<UploadWizard />} />
          <Route path="edit-beat/:id" element={<EditBeat />} />
          <Route path="import-youtube" element={<YouTubeImport />} />
          <Route path="my-products" element={<MyProducts />} />
          <Route path="licenses" element={<LicenseManager />} />
          <Route path="collaborations" element={<Collaborations />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="plans" element={<SubscriptionPlans />} />

          {/* Placeholder para rutas futuras */}
          <Route path="licencias" element={<div>Licencias (Próximamente)</div>} />
        </Route>

        {/* --- 404 NOT FOUND --- */}
        <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
      </Routes>
    </PayPalScriptProvider>
  );
};

export default AppRouter;