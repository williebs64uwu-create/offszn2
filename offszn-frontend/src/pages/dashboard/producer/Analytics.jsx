import React, { useState } from 'react';
import {
    BarChart3, Eye, ShoppingBag, DollarSign,
    Activity, DownloadCloud, PlayCircle,
    ArrowLeft, Calendar, TrendingUp, Trophy,
    Loader2, AlertCircle, ChevronRight,
    Sparkles, ArrowUpRight, Zap, Target,
    Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../../../hooks/useAnalytics';
import PerformanceChart from '../../../components/dashboard/PerformanceChart';
import { useAuth } from '../../../store/authStore';

const PERIODS = [
    { id: '7d', label: '7 Días' },
    { id: '30d', label: '30 Días' },
    { id: 'all', label: 'Todo' }
];

export default function Analytics() {
    const navigate = useNavigate();
    const { loading: authLoading } = useAuth();
    const [period, setPeriod] = useState('30d');
    const { metrics, chartData, topProducts, loading } = useAnalytics(period);

    if (authLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
                <Loader2 className="animate-spin text-violet-500" size={48} />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 animate-pulse">Sincronizando analytics...</span>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1500px] mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">

            {/* --- HERO HEADER --- */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
                <div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="group flex items-center gap-3 text-gray-600 hover:text-white transition-all text-[9px] font-black uppercase tracking-[0.2em] mb-8 bg-white/5 px-4 py-2 rounded-full border border-white/5 hover:border-white/10"
                    >
                        <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
                        Panel Principal
                    </button>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full">
                            <span className="text-[9px] font-black text-violet-500 uppercase tracking-widest">Inteligencia</span>
                        </div>
                        <div className="h-px w-8 bg-white/5"></div>
                    </div>
                    <h1 className="text-6xl font-black uppercase tracking-tighter text-white leading-none">
                        Analytics <span className="text-violet-500">Center</span>
                    </h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-4 flex items-center gap-2">
                        <Target size={12} className="text-violet-500" /> Monitoreo de tracción, conversiones y revenue en tiempo real
                    </p>
                </div>

                <div className="flex p-1.5 bg-[#0A0A0A] rounded-[24px] border border-white/5 backdrop-blur-xl shadow-inner">
                    {PERIODS.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setPeriod(p.id)}
                            className={`px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${period === p.id
                                ? 'bg-white text-black shadow-2xl scale-[1.02]'
                                : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- METRICS GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <MetricCard label="Impressions" value={metrics.views} icon={Eye} color="text-blue-500" loading={loading} />
                <MetricCard label="Conversion" value={`${metrics.conversion}%`} icon={Activity} color="text-violet-500" loading={loading} />
                <MetricCard label="Revenue" value={`$${metrics.revenue.toLocaleString()}`} icon={DollarSign} color="text-emerald-500" loading={loading} />
                <MetricCard label="Sales" value={metrics.sales} icon={ShoppingBag} color="text-amber-500" loading={loading} />
                <MetricCard label="Samples" value={metrics.freeDownloads} icon={DownloadCloud} color="text-rose-500" loading={loading} />
                <MetricCard label="Streams" value={metrics.reelsViews} icon={PlayCircle} color="text-fuchsia-500" loading={loading} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">

                {/* --- CHART SECTION --- */}
                <div className="xl:col-span-2 bg-[#0A0A0A] border border-white/5 p-10 rounded-[48px] relative overflow-hidden group shadow-2xl">
                    <div className="absolute -top-10 -right-10 p-4 opacity-[0.02] group-hover:scale-125 transition-all duration-1000 rotate-12 pointer-events-none">
                        <TrendingUp size={240} />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 relative z-10">
                        <div>
                            <h3 className="text-white font-black uppercase tracking-tighter text-2xl mb-2 flex items-center gap-3">
                                <TrendingUp size={20} className="text-violet-500" /> Rendimiento
                            </h3>
                            <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">Data histórica procesada por periodo seleccionado</p>
                        </div>
                        <div className="flex items-center gap-8 bg-black/40 px-6 py-3 rounded-2xl border border-white/5">
                            <LegendItem color="bg-violet-500" label="Visitas" />
                            <div className="w-px h-4 bg-white/5" />
                            <LegendItem color="bg-emerald-500" label="Ventas" />
                        </div>
                    </div>

                    <div className="h-[480px] relative z-10">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="animate-spin text-violet-500" size={40} />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-700">Trazando vectores...</span>
                                </div>
                            </div>
                        ) : (
                            <PerformanceChart
                                labels={chartData.labels}
                                viewsData={chartData.views}
                                salesData={chartData.sales}
                            />
                        )}
                    </div>
                </div>

                {/* --- TOP LEADERBOARD --- */}
                <div className="bg-[#0A0A0A] border border-white/5 p-10 rounded-[48px] flex flex-col shadow-2xl relative overflow-hidden">
                    <div className="absolute -bottom-10 -left-10 opacity-[0.02]">
                        <Trophy size={180} />
                    </div>

                    <div className="flex items-center justify-between mb-12 relative z-10">
                        <div>
                            <h3 className="text-white font-black uppercase tracking-tighter text-2xl mb-1 flex items-center gap-3">
                                <Trophy size={20} className="text-amber-500" /> Top Activos
                            </h3>
                            <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Ranking por revenue generado</p>
                        </div>
                    </div>

                    <div className="flex-1 space-y-8 relative z-10">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => <TopProductSkeleton key={i} />)
                        ) : topProducts.length > 0 ? (
                            topProducts.map((p, index) => (
                                <TopProductRow key={p.id} product={p} index={index} />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                                    <AlertCircle className="text-gray-800" size={32} />
                                </div>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-700 italic">Data insuficiente para ranking</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-12 pt-10 border-t border-white/5 relative z-10">
                        <button
                            onClick={() => navigate('/dashboard/my-products')}
                            className="w-full bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex items-center justify-between group cursor-pointer hover:bg-violet-500 hover:border-violet-400 transition-all duration-500 shadow-inner"
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white group-hover:bg-white/20 transition-colors shadow-2xl">
                                    <Sparkles size={24} />
                                </div>
                                <div className="text-left">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-600 group-hover:text-white/70 transition-colors">Eficiencia Media</div>
                                    <div className="text-2xl font-black text-white group-hover:translate-x-1 transition-transform">{metrics.conversion}% Conversión</div>
                                </div>
                            </div>
                            <ArrowUpRight className="text-gray-700 group-hover:text-white group-hover:scale-125 transition-all" size={24} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

function MetricCard({ label, value, icon: Icon, color, loading }) {
    return (
        <div className="bg-[#0A0A0A] border border-white/5 p-10 rounded-[48px] group hover:bg-white/[0.02] hover:border-white/10 transition-all duration-700 relative overflow-hidden shadow-2xl">
            <div className="absolute -top-6 -right-6 p-6 opacity-0 group-hover:opacity-[0.03] transition-all duration-1000 group-hover:scale-125 pointer-events-none">
                <Icon size={120} />
            </div>

            <div className="flex items-center justify-between mb-10">
                <div className={`p-5 rounded-2xl bg-white/[0.03] border border-white/5 ${color} group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]`}>
                    <Icon size={20} />
                </div>
            </div>

            <div className="space-y-2">
                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600">
                    {label}
                </div>
                {loading ? (
                    <div className="h-10 w-24 bg-white/5 rounded-xl animate-pulse"></div>
                ) : (
                    <div className="text-4xl font-black tracking-tighter text-white leading-none">
                        {value}
                    </div>
                )}
            </div>
        </div>
    );
}

function TopProductRow({ product, index }) {
    const medals = ['bg-[#FFD700]', 'bg-[#C0C0C0]', 'bg-[#CD7F32]'];
    return (
        <div className="flex items-center gap-6 group cursor-default">
            <div className="relative flex-shrink-0">
                <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black z-20 shadow-2xl border-4 border-black ${index < 3 ? medals[index] + ' text-black' : 'bg-[#1A1A1A] text-gray-500'}`}>
                    {index + 1}
                </div>
                <div className="w-20 h-20 bg-black rounded-[24px] overflow-hidden border border-white/5 shadow-2xl relative group-hover:scale-105 transition-transform duration-700">
                    <img
                        src={product.image || '/images/PORTADA%20DEFAULT.png'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:rotate-3 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
            </div>
            <div className="flex-1 min-w-0 space-y-1">
                <div className="text-base font-black uppercase tracking-tighter text-white truncate group-hover:text-violet-500 transition-colors leading-tight">
                    {product.name}
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                    <div className="text-[9px] font-black text-gray-700 uppercase tracking-widest">{product.sales} Ventas Formales</div>
                </div>
            </div>
            <div className="text-right bg-white/[0.02] border border-white/5 px-4 py-3 rounded-2xl">
                <div className="text-base font-black text-emerald-500 leading-none">${product.revenue.toLocaleString()}</div>
            </div>
        </div>
    );
}

function LegendItem({ color, label }) {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${color} shadow-[0_0_10px_rgba(0,0,0,0.5)]`}></div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">{label}</span>
        </div>
    );
}

function TopProductSkeleton() {
    return (
        <div className="flex items-center gap-6 animate-pulse">
            <div className="w-20 h-20 bg-white/5 rounded-[24px]"></div>
            <div className="flex-1 space-y-3">
                <div className="h-5 bg-white/5 rounded-lg w-3/4"></div>
                <div className="h-3 bg-white/5 rounded-lg w-1/4"></div>
            </div>
        </div>
    );
}
