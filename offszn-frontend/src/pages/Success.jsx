import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const Success = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order');

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center">
      <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.4)]">
        <i className="bi bi-check-lg text-5xl text-black"></i>
      </div>
      
      <h1 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
        ¡Pago Exitoso!
      </h1>
      
      <p className="text-zinc-400 max-w-md mb-8">
        Tu transacción ha sido completada. Hemos enviado un recibo a tu correo y tus archivos ya están listos.
      </p>

      <div className="bg-[#111] border border-white/10 rounded-xl p-6 w-full max-w-md mb-8 text-left">
        <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-zinc-500">Orden ID</span>
            <span className="font-mono text-white text-sm">{orderId || '---'}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-zinc-500">Estado</span>
            <span className="text-green-400 font-bold">Completado</span>
        </div>
      </div>

      <div className="flex gap-4">
        <Link to="/my-purchases" className="px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg font-bold transition-all">
            <i className="bi bi-download mr-2"></i> Mis Compras
        </Link>
        <Link to="/explore" className="px-6 py-3 border border-white/20 hover:bg-white/5 rounded-lg font-bold transition-all">
            Seguir comprando
        </Link>
      </div>
    </div>
  );
};

export default Success;