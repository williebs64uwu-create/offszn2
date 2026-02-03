import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; // Ajusta la ruta a tu cliente
import { toast } from 'react-hot-toast'; // O tu librería de notificaciones

const PaymentSetup = ({ userId }) => {
  const [paypalEmail, setPaypalEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPaymentSettings();
  }, [userId]);

  const fetchPaymentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('payment_methods')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data?.payment_methods?.paypal) {
        setPaypalEmail(data.payment_methods.paypal);
      }
    } catch (error) {
      console.error('Error cargando ajustes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Obtener métodos actuales para no sobrescribir otros (ej. cuenta bancaria futura)
      const { data: user } = await supabase
        .from('users')
        .select('payment_methods')
        .eq('id', userId)
        .single();

      const currentMethods = user?.payment_methods || {};
      
      // 2. Actualizar
      const { error } = await supabase
        .from('users')
        .update({
          payment_methods: { ...currentMethods, paypal: paypalEmail.trim() }
        })
        .eq('id', userId);

      if (error) throw error;
      toast.success('Cuenta de PayPal vinculada correctamente');
    } catch (error) {
      toast.error('Error al guardar configuración');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-zinc-500">Cargando configuración...</div>;

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-6 max-w-lg">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <i className="bi bi-paypal text-blue-500"></i> Configuración de Pagos
      </h3>
      <p className="text-zinc-400 text-sm mb-6">
        Para recibir dinero de tus ventas, necesitas conectar tu cuenta de PayPal. 
        Los pagos se enviarán automáticamente a este correo.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Correo de PayPal</label>
          <input 
            type="email" 
            value={paypalEmail}
            onChange={(e) => setPaypalEmail(e.target.value)}
            placeholder="ejemplo@correo.com"
            className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  );
};

export default PaymentSetup;