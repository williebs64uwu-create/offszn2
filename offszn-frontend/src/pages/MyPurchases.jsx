import React, { useEffect, useState } from 'react';
import { supabase } from '../api/client';
import { Link, useNavigate } from 'react-router-dom';
import { generateLicensePDF } from '../utils/licenseGenerator';
import { toast } from 'react-hot-toast';

const MyPurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // URL del backend para firmar descargas
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUser(session.user);

      // Consulta compleja replicando purchases-manager.js
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            id, transaction_id, status, created_at, total_price,
            order_items (
                id, price_at_purchase, license_name,
                products (
                    id, name, image_url, product_type,
                    mp3_url, wav_url, stems_url, kit_url,
                    users!products_producer_id_fkey (
                        id, nickname, license_settings
                    )
                )
            )
        `)
        .eq('user_id', session.user.id)
        .in('status', ['approved', 'completed'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Aplanar la estructura: De Ordenes -> Lista de Items Comprados
      const flattenedItems = [];
      orders?.forEach(order => {
        order.order_items.forEach(item => {
           if(item.products) {
               flattenedItems.push({
                   ...item,
                   orderId: order.id,
                   transactionId: order.transaction_id,
                   purchaseDate: order.created_at,
                   product: item.products,
                   producer: item.products.users
               });
           }
        });
      });

      setPurchases(flattenedItems);

    } catch (error) {
      console.error('Error cargando compras:', error);
      toast.error('No se pudo cargar el historial.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async (orderId, productId, fileType) => {
    const toastId = toast.loading('Preparando descarga segura...');
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Petición al backend para obtener URL firmada de S3/Supabase Storage
        const res = await fetch(`${API_URL}/orders/download-link?orderId=${orderId}&productId=${productId}&fileType=${fileType}`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        if (!res.ok) throw new Error('Error al generar enlace');

        const { signedUrl } = await res.json();

        // Forzar descarga
        const a = document.createElement('a');
        a.href = signedUrl;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        toast.success('Descarga iniciada', { id: toastId });
    } catch (error) {
        console.error(error);
        toast.error('Error en la descarga', { id: toastId });
    }
  };

  const handleGenerateLicense = async (item) => {
     const toastId = toast.loading('Generando contrato PDF...');
     try {
        const pdfBytes = await generateLicensePDF({
            productName: item.product.name,
            producerName: item.producer?.nickname || 'Productor',
            amount: item.price_at_purchase,
            buyerName: user.user_metadata?.nickname || user.email.split('@')[0],
            buyerEmail: user.email,
            purchaseDate: item.purchaseDate,
            orderId: item.orderId,
            licenseType: item.license_name,
            productType: item.product.product_type,
            licenseSettings: item.producer?.license_settings || {}
        });

        // Crear Blob y Descargar
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const safeName = item.product.name.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
        link.download = `OFFSZN_License_${safeName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Licencia descargada', { id: toastId });
     } catch (error) {
        console.error(error);
        toast.error('Error generando PDF', { id: toastId });
     }
  };

  if (loading) return <div className="min-h-screen bg-black text-white pt-32 text-center">Cargando tus compras...</div>;

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-10">
            <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">Mis Compras</h1>
            <p className="text-zinc-400">Gestiona tus archivos, licencias y recibos.</p>
        </div>

        {/* LIST CONTAINER */}
        <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            
            {/* Header Grid - Hidden on Mobile */}
            <div className="hidden md:grid grid-cols-[80px_minmax(0,2.5fr)_100px_120px_140px_minmax(200px,1.5fr)] gap-6 p-6 border-b border-white/10 bg-black/40 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                <div>Portada</div>
                <div>Producto</div>
                <div>Monto</div>
                <div>Fecha</div>
                <div>Transacción</div>
                <div className="text-right">Descargas</div>
            </div>

            {/* List Items */}
            <div className="divide-y divide-white/5">
                {purchases.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500">
                        <i className="bi bi-bag text-4xl mb-4 block opacity-50"></i>
                        <p>No tienes compras aún.</p>
                        <Link to="/explore" className="text-violet-400 hover:underline mt-2 inline-block">Ir a Explorar</Link>
                    </div>
                ) : (
                    purchases.map((item) => (
                        <div key={`${item.orderId}-${item.id}`} className="grid grid-cols-1 md:grid-cols-[80px_minmax(0,2.5fr)_100px_120px_140px_minmax(200px,1.5fr)] gap-6 p-6 items-center hover:bg-white/5 transition-colors group">
                            
                            {/* Cover */}
                            <div className="w-16 h-16 md:w-full md:h-auto aspect-square bg-black rounded-xl overflow-hidden border border-white/10 shadow-lg">
                                <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                            </div>

                            {/* Info */}
                            <div className="min-w-0">
                                <h4 className="font-bold text-white text-lg truncate">{item.product.name}</h4>
                                <p className="text-sm text-zinc-500">{item.producer?.nickname || 'Producer'}</p>
                                <span className="inline-block mt-1 text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded text-zinc-300 uppercase">
                                    {item.license_name || 'BASIC'}
                                </span>
                            </div>

                            {/* Mobile Labels included via flex/grid tricks usually, but sticking to desktop grid for brevity */}
                            
                            {/* Monto */}
                            <div className="font-bold text-white text-lg">
                                {item.price_at_purchase === 0 ? <span className="text-violet-400 text-sm">FREE</span> : `$${item.price_at_purchase}`}
                            </div>

                            {/* Fecha */}
                            <div className="text-zinc-500 text-sm">
                                {new Date(item.purchaseDate).toLocaleDateString()}
                            </div>

                            {/* Transacción */}
                            <div className="font-mono text-xs text-zinc-600 truncate" title={item.transactionId}>
                                {(item.transactionId || '---').substring(0, 12)}...
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap justify-end gap-2">
                                {/* Botones Dinámicos según disponibilidad */}
                                {item.product.mp3_url && (
                                    <button 
                                        onClick={() => handleDownloadFile(item.orderId, item.product.id, 'mp3')}
                                        className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-zinc-300 flex items-center gap-2 transition-all"
                                    >
                                        <i className="bi bi-music-note-beamed"></i> MP3
                                    </button>
                                )}
                                {item.product.wav_url && (
                                    <button 
                                        onClick={() => handleDownloadFile(item.orderId, item.product.id, 'wav')}
                                        className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-zinc-300 flex items-center gap-2 transition-all"
                                    >
                                        <i className="bi bi-disc"></i> WAV
                                    </button>
                                )}
                                {(item.product.stems_url || item.product.kit_url) && (
                                    <button 
                                        onClick={() => handleDownloadFile(item.orderId, item.product.id, item.product.kit_url ? 'kit' : 'stems')}
                                        className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-zinc-300 flex items-center gap-2 transition-all"
                                    >
                                        <i className="bi bi-archive"></i> ZIP
                                    </button>
                                )}
                                
                                {/* PDF LICENSE */}
                                <button 
                                    onClick={() => handleGenerateLicense(item)}
                                    className="px-3 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-white/10"
                                >
                                    <i className="bi bi-file-earmark-pdf-fill"></i> PDF
                                </button>
                            </div>

                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MyPurchases;