import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import Home from '../pages/Home';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import UpdatePassword from '../pages/auth/UpdatePassword';
import VerifyEmail from '../pages/auth/VerifyEmail';
import AuthCallback from '../pages/auth/AuthCallback';

//marketplace
import Explore from '../pages/Explore';
import ProductDetail from '../pages/ProductDetail';
import Checkout from '../pages/Checkout';
import Success from '../pages/Success';
import MyPurchases from '../pages/MyPurchases';

// General Pages
import NotFound from '../pages/NotFound';

const AppRouter = () => {
  return (
    <Routes>
      {/* Rutas Públicas con Layout Principal */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/explorar" element={<Explore />} />
        <Route path="/producto/:id" element={<ProductDetail />} />
        <Route path="/my-purchases" element={<MyPurchases />} />
      </Route>

      {/* Rutas de Autenticación (Diseño Centrado) */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="update-password" element={<UpdatePassword />} />
        <Route path="verify-email" element={<VerifyEmail />} />
        {/* Callback para OAuth y Magic Links */}
        <Route path="callback" element={<AuthCallback />} />
      </Route>

      {/* Rutas de Marketplace */}
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/success" element={<Success />} />

      {/* Redirección 404 */}
      <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
    </Routes>
  );
};

export default AppRouter;