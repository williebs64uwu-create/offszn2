import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  Plus,
  ListFilter,
  Mail,
  CheckCircle,
  AlertCircle,
  Music,
  Disc,
  DollarSign,
  Users,
  Settings,
  ArrowRight,
  TrendingUp,
  Activity,
  CreditCard,
  ExternalLink,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Clock,
  Zap,
  Loader2
} from 'lucide-react';

import { useAuth } from '../../store/authStore';


import { supabase } from "../../api/client";

// --- CONFIGURACIÓN DE CHART.JS ---
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0A0A0A',
      titleColor: '#8B5CF6',
      bodyColor: '#FFF',
      borderColor: 'rgba(139, 92, 246, 0.2)',
      borderWidth: 1,
      padding: 16,
      displayColors: false,
      cornerRadius: 16,
      titleFont: { weight: '900', size: 12, family: 'Inter' },
      bodyFont: { weight: '800', size: 11, family: 'Inter' },
      callbacks: {
        label: (context) => ` ${context.parsed.y} INTERACCIONES`
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#555', font: { size: 10, weight: '900' } }
    },
    y: {
      display: false
    }
  },
  elements: {
    line: { tension: 0.5, borderWidth: 4, capStyle: 'round' },
    point: { radius: 0, hitRadius: 20, hoverRadius: 6, hoverBackgroundColor: '#8B5CF6', hoverBorderWidth: 4, hoverBorderColor: '#000' }
  }
};

export default function Overview() {
  const { loading: authLoading, user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ name: 'Productor', id: null });
  const [stats, setStats] = useState({ revenue: 0, sales: 0, plays: 0, clients: 0 });
  const [activities, setActivities] = useState([]);
  const [chartData, setChartData] = useState(null);

  // --- EFECTO: CARGA DE DATOS ---
  useEffect(() => {
    const fetchData = async () => {
      if (authLoading || !authUser) {
        setLoading(false); // Ensure loading is false if no authUser or still authenticating
        return;
      }

      setLoading(true);
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('nickname, first_name')
          .eq('id', authUser.id)
          .maybeSingle();

        const displayName = profile?.nickname || profile?.first_name || authUser.email.split('@')[0];
        setUser({ name: displayName, id: authUser.id });

        const { data: orders } = await supabase
          .from('orders')
          .select('amount, created_at, user_id')
          .eq('producer_id', authUser.id);

        const { data: products } = await supabase
          .from('products')
          .select('views')
          .eq('producer_id', authUser.id);

        let totalRev = 0;
        let monthSales = 0;
        let totalPlays = 0;
        const uniqueClients = new Set();
        const now = new Date();

        if (orders) {
          orders.forEach(o => {
            totalRev += parseFloat(o.amount || 0);
            if (o.user_id) uniqueClients.add(o.user_id);
            const d = new Date(o.created_at);
            if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
              monthSales++;
            }
          });
        }

        if (products) {
          products.forEach(p => totalPlays += (p.views || 0));
        }

        setStats({
          revenue: totalRev,
          sales: monthSales,
          plays: totalPlays,
          clients: uniqueClients.size
        });

        const { data: recentProds } = await supabase
          .from('products')
          .select('*')
          .eq('producer_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(3);

        const feed = [];
        if (recentProds) recentProds.forEach(p => feed.push({
          type: 'product',
          title: p.name,
          desc: 'Nuevo Lanzamiento',
          date: new Date(p.created_at),
          img: p.image_url,
          category: p.product_type
        }));

        feed.sort((a, b) => b.date - a.date);
        setActivities(feed);

        const labels = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
        });

        setChartData({
          labels,
          datasets: [{
            label: 'Visitas',
            data: [12, 19, 3, 15, 8, 12, 25],
            borderColor: '#8B5CF6',
            backgroundColor: (context) => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, 400);
              gradient.addColorStop(0, 'rgba(139, 92, 246, 0.2)');
              gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
              return gradient;
            },
            fill: true,
          }]
        });

      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (authLoading || (loading && !chartData)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
        <Loader2 className="animate-spin text-violet-500" size={48} />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 animate-pulse">Autenticando sesión...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">

      {/* --- HERO HEADER --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full">
              <span className="text-[9px] font-black text-violet-500 uppercase tracking-widest">Hub</span>
            </div>
            <div className="h-px w-8 bg-white/5"></div>
          </div>
          <h1 className="text-6xl font-black uppercase tracking-tighter text-white leading-none">
            HQ <span className="text-violet-500">Center</span>
          </h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-4 flex items-center gap-2">
            <Sparkles size={12} className="text-violet-500" /> Monitoreo en tiempo real para <span className="text-white">{user.name}</span>
          </p>
        </div>

        <button className="flex items-center gap-4 px-10 py-5 bg-white text-black text-xs font-black uppercase tracking-[0.2em] rounded-full hover:bg-violet-500 hover:text-white transition-all shadow-2xl active:scale-95 group">
          <Plus size={20} className="group-hover:rotate-180 transition-transform duration-500" />
          Subir Proyecto
        </button>
      </div>

      {/* --- BENTO STATS GRID --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          label="Ingresos Históricos"
          value={`$${stats.revenue.toLocaleString()}`}
          trend="Todo el tiempo"
          icon={DollarSign}
          color="text-emerald-500"
        />
        <StatCard
          label="Conversión Mes"
          value={stats.sales}
          trend="+14% vs mes anterior"
          trendType="up"
          icon={TrendingUp}
          color="text-violet-500"
        />
        <StatCard
          label="Interacciones"
          value={stats.plays.toLocaleString()}
          trend="Engagement global"
          icon={Activity}
          color="text-fuchsia-500"
        />
        <StatCard
          label="Audiencia Única"
          value={stats.clients}
          trend="Nuevos Clientes"
          icon={Users}
          color="text-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">

        {/* --- PERFORMANCE CHART --- */}
        <div className="xl:col-span-2 group">
          <div className="bg-[#0A0A0A] border border-white/5 p-10 rounded-[60px] hover:border-white/10 transition-all duration-700 h-[500px] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000">
              <Zap size={200} />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
              <div>
                <h4 className="text-xl font-black uppercase tracking-tighter text-white mb-1">Actividad de Red</h4>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                  <Activity size={14} className="text-violet-500" /> Rendimiento de visitas y clics
                </p>
              </div>
              <div className="flex p-1 bg-black/40 border border-white/5 rounded-2xl">
                <button className="px-6 py-2.5 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-xl">LAST 7D</button>
                <button className="px-6 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl text-gray-600 hover:text-white transition-all">MONTHLY</button>
              </div>
            </div>

            <div className="flex-1 w-full relative">
              {chartData && (
                <Line data={chartData} options={chartOptions} />
              )}
            </div>
          </div>
        </div>

        {/* --- MANAGEMENT SIDEBAR --- */}
        <div className="space-y-10">

          {/* Quick Connect & Licenses */}
          <div className="bg-[#0A0A0A] border border-white/5 p-10 rounded-[60px] hover:border-white/10 transition-all duration-700">
            <div className="flex justify-between items-center mb-10">
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">Marketplace Stats</h4>
              <ShieldCheck size={20} className="text-violet-500" />
            </div>
            <div className="space-y-8">
              <LicenseRow name="MP3 LEASE" price={20} active />
              <LicenseRow name="WAV LEASE" price={50} active />
              <LicenseRow name="UNLIMITED" price={300} active />
              <LicenseRow name="DRUM KITS" price={30} active />
            </div>

            <div className="mt-12 pt-10 border-t border-white/5">
              <button className="w-full py-5 bg-white/5 hover:bg-violet-500 text-white font-black uppercase tracking-widest text-[10px] rounded-[24px] transition-all active:scale-95 flex items-center justify-center gap-3 group/btn">
                Configurar Precios
                <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Status Panel */}
          <div className="bg-[#0A0A0A] border border-white/5 p-10 rounded-[60px] hover:border-white/10 transition-all duration-700 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-110 transition-transform">
              <Settings size={100} />
            </div>

            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 mb-10">System Status</h4>

            <div className="space-y-4">
              <StatusCard
                icon={CreditCard}
                label="Stripe Payments"
                status="Connected"
                color="emerald"
              />
              <StatusCard
                icon={Mail}
                label="Inbox Alerts"
                status="3 Unread"
                color="violet"
              />
            </div>
          </div>

        </div>
      </div>

      {/* --- FEED AREA --- */}
      <section className="bg-[#0A0A0A] border border-white/5 p-12 rounded-[60px] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-110 transition-all duration-1000">
          <Clock size={160} />
        </div>

        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[20px] bg-violet-500/10 flex items-center justify-center text-violet-500 border border-violet-500/20">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-white">Últimas Acciones</h3>
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Línea de tiempo de eventos críticos</p>
            </div>
          </div>
          <button className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/5 rounded-2xl text-gray-500 hover:text-white hover:bg-white/10 transition-all">
            <ListFilter size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {activities.length > 0 ? (
            activities.map((item, idx) => <ActivityItem key={idx} data={item} />)
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-700 opacity-20 gap-4">
              <Music size={48} />
              <p className="text-[10px] font-black uppercase tracking-widest">Esperando actividad...</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}

// --- SUB-COMPONENTES ---

function StatCard({ label, value, trend, trendType, icon: Icon, color }) {
  return (
    <div className="group relative h-[180px] p-10 bg-[#0A0A0A] border border-white/5 rounded-[40px] flex flex-col justify-between hover:border-white/10 hover:bg-white/[0.02] transition-all duration-500 overflow-hidden cursor-default shadow-2xl">
      <div className="absolute -right-8 -top-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12 group-hover:rotate-0 duration-1000">
        <Icon size={140} />
      </div>

      <div className="flex items-center gap-4">
        <div className={`p-4 rounded-[20px] bg-white/5 ${color || 'text-violet-500'} group-hover:scale-110 transition-transform duration-500`}>
          <Icon size={20} />
        </div>
        <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">{label}</span>
      </div>

      <div>
        <span className="block text-4xl lg:text-5xl font-black text-white tracking-tighter mb-2 leading-none">{value}</span>
        {trend && (
          <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${trendType === 'up' ? 'text-emerald-500' : 'text-gray-700'}`}>
            {trendType === 'up' && <TrendingUp size={12} />}
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusCard({ icon: Icon, label, status, color }) {
  const colMap = {
    emerald: 'bg-emerald-500 text-emerald-500 shadow-emerald-500/20',
    violet: 'bg-violet-500 text-violet-500 shadow-violet-500/20'
  };

  return (
    <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-6 rounded-[32px] group/status hover:bg-white/[0.04] transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-black border border-white/5 flex items-center justify-center">
          <Icon size={18} className={colMap[color].split(' ')[1]} />
        </div>
        <div>
          <span className="block text-[11px] font-black uppercase tracking-widest text-white">{label}</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 italic">{status}</span>
        </div>
      </div>
      <div className={`w-2 h-2 rounded-full ${colMap[color].split(' ')[0]} animate-pulse shadow-lg`}></div>
    </div>
  );
}

function ActivityItem({ data }) {
  return (
    <div className="bg-black/40 border border-white/5 p-8 rounded-[40px] hover:bg-white/[0.03] hover:border-violet-500/20 transition-all duration-700 group cursor-pointer relative overflow-hidden">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 rounded-[24px] overflow-hidden bg-white/5 border border-white/5 flex-shrink-0 relative group-hover:scale-110 transition-transform duration-700 shadow-2xl">
          {data.img ? (
            <img src={data.img} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-violet-500 bg-violet-500/10">
              <Music size={24} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-500">{data.category || data.type}</span>
            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter italic">{data.date.toLocaleDateString()}</span>
          </div>
          <h5 className="text-lg font-black uppercase tracking-tighter text-white group-hover:text-violet-400 transition-colors truncate">
            {data.title}
          </h5>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{data.desc}</span>
            <ArrowUpRight size={14} className="text-violet-500 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LicenseRow({ name, price, active }) {
  return (
    <div className="flex justify-between items-center group cursor-default">
      <div className="flex items-center gap-4">
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-violet-500 animate-pulse' : 'bg-gray-800'}`}></div>
        <span className="text-xs font-black uppercase tracking-[0.1em] text-gray-500 group-hover:text-white transition-colors">{name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black text-white px-4 py-2 bg-white/5 rounded-xl border border-white/5 group-hover:border-violet-500/40 transition-all shadow-xl">
          {typeof price === 'number' ? `$${price}` : price}
        </span>
      </div>
    </div>
  );
}
