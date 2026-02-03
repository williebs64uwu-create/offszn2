import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Home from '../pages/Home';

const AppRouter = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Ruta raíz carga el componente Home */}
        <Route path="/" element={<Home />} />
        
        {/* Placeholder para rutas futuras */}
        <Route path="/explorar" element={<div className="p-20 text-center">Explorar (Próximamente)</div>} />
        
        {/* Redirección 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRouter;