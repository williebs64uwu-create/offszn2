import React from 'react';
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
import Checkout from '../pages/Checkout'; // Si existe
import MyPurchases from '../pages/MyPurchases'; // Si existe
import Messages from '../pages/Messages';
import Reels from '../pages/Reels';

// Pages - Public (AQUÍ FALTABA ESTE IMPORT)
import Profile from '../pages/public/Profile';

// Pages - Auth
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import UpdatePassword from '../pages/auth/UpdatePassword';
import VerifyEmail from '../pages/auth/VerifyEmail';
import AuthCallback from '../pages/auth/AuthCallback';

// Pages - Dashboard
import Overview from '../pages/dashboard/Overview';
import AccountSettings from '../pages/dashboard/AccountSettings';
import UploadBeats from '../pages/account/UploadBeats';
import YouTubeImport from '../pages/account/YouTubeImport';
import MyProducts from '../pages/dashboard/producer/MyProducts';
import LicenseManager from '../pages/dashboard/producer/LicenseManager';
import Collaborations from '../pages/dashboard/producer/Collaborations';
import Analytics from '../pages/dashboard/producer/Analytics';
import Coupons from '../pages/dashboard/producer/Coupons';
import SubscriptionPlans from '../pages/dashboard/producer/SubscriptionPlans';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

const AppRouter = () => {
  return (
    <PayPalScriptProvider options={{ "client-id": "sb", currency: "USD" }}>
      <Routes>
        {/* --- RUTAS PÚBLICAS (Con MainLayout) --- */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/explorar" element={<Explore />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/success" element={<Success />} />
          <Route path="/mensajes" element={<Messages />} />
          <Route path="/reels" element={<Reels />} />

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

        {/* --- RUTAS DEL DASHBOARD (Protegidas) --- */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="settings" element={<AccountSettings />} />
          <Route path="my-purchases" element={<MyPurchases />} />

          {/* 🔥 AQUÍ ESTÁ LA RUTA DEL WIZARD QUE HICIMOS HOY */}
          <Route path="upload-beat" element={<UploadBeats />} />
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