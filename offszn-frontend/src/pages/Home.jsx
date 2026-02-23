import React from 'react';
import { Link } from 'react-router-dom';
import { Disc, Sliders, Music, Target, CheckCircle, ArrowRight } from 'lucide-react';

const Home = () => {
  return (
    <div className="w-full">

      {/* ================= HERO SECTION ================= */}
      <section className="relative min-h-[75vh] flex items-center justify-center px-6 py-20 overflow-hidden bg-black">

        {/* Legacy Background */}
        <div className="absolute inset-0 bg-[url('/hero-bg.png')] bg-center bg-cover bg-no-repeat opacity-50 z-0"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_80%)] z-10"></div>

        {/* Contenido Hero */}
        <div className="relative z-20 max-w-4xl text-center flex flex-col items-center">
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-500 text-xs font-bold tracking-widest uppercase">
            THE PREMIUM HUB FOR CREATORS
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-[1.1] font-montserrat drop-shadow-[0_0_25px_rgba(114,9,183,0.2)]">
            Domina la Escena <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-white to-gray-400">Produce sin Límites.</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed font-sans mt-2">
            El ecosistema definitivo para productores. Marketplace de élite, herramientas de automatización para YouTube y una comunidad que impulsa tu carrera al siguiente nivel.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Link to="/auth/register" className="relative group overflow-hidden px-8 py-4 rounded-xl bg-linear-to-r from-[#7209b7] to-[#560bad] text-white font-bold text-lg tracking-wide shadow-[0_0_20px_rgba(114,9,183,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(114,9,183,0.6)]">
              <span className="relative z-10">Empezar Ahora — Gratis</span>
              {/* Efecto brillo */}
              <div className="absolute top-0 -left-full w-1/2 h-full bg-white/20 skew-x-[-20deg] group-hover:left-[130%] transition-all duration-500" />
            </Link>

            <Link to="/explorar" className="px-8 py-4 rounded-xl border border-primary/40 text-gray-200 font-bold text-lg hover:bg-primary/10 hover:text-white hover:border-primary/80 transition-all">
              Explorar Marketplace
            </Link>
          </div>
        </div>

      </section>

      {/* ================= STATS BAR ================= */}
      <div className="w-full border-y border-white/5 bg-black/40 backdrop-blur-sm py-8">
        <div className="container mx-auto flex flex-wrap justify-center gap-12 md:gap-24">
          <StatItem number="5k+" label="Productores" />
          <StatItem number="12k+" label="Sound Kits" />
          <StatItem number="24/7" label="Soporte" />
        </div>
      </div>

      {/* ================= MARKETPLACE SECTION ================= */}
      <section className="py-24 px-6 container mx-auto text-center">
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-white mb-4 font-montserrat">Todo lo que un Producer necesita</h2>
          <p className="text-gray-400 text-lg">Sonidos de alta calidad curados por profesionales de la industria.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            to="/recursos/drum-kits"
            icon={Disc}
            title="Drum Kits"
            desc="Kits diseñados para que tus drums suenen profesionales desde el primer hit."
          />
          <FeatureCard
            to="/recursos/presets"
            icon={Sliders}
            title="Presets VST"
            desc="Lleva tus plugins favoritos al límite con parches diseñados para hits."
          />
          <FeatureCard
            to="/recursos/samples"
            icon={Music}
            title="Loops & Samples"
            desc="Inspiración instantánea con loops melódicos y progresiones de alta gama."
          />
          <FeatureCard
            to="/recursos/one-shots"
            icon={Target}
            title="One-Shots"
            desc="Sonidos únicos procesados analógicamente para tu próximo hit."
          />
        </div>
      </section>

      {/* ================= STUDIO TOOLS SECTION ================= */}
      <section className="py-24 bg-[#080808]">
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

          {/* Texto */}
          <div className="text-left">
            <div className="inline-block px-3 py-1 mb-4 rounded border border-white/10 bg-white/5 text-gray-400 text-xs font-bold tracking-widest uppercase">
              OFFSZN STUDIO
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 font-display leading-tight">
              Automatización Inteligente
            </h2>
            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              Nuestra herramienta de YouTube Upload te permite publicar tus beats automáticamente con visualizers generados al instante.
            </p>

            <ul className="space-y-4 mb-10">
              <ListItem>Publicación en YouTube</ListItem>
              <ListItem>Generación de Reels</ListItem>
              <ListItem>Gestión de Licencias</ListItem>
            </ul>

            <Link to="/studio" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-black font-bold text-lg hover:bg-gray-200 transition-colors">
              Explorar Studio <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Imagen */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
            <div className="absolute inset-0 bg-primary/20 mix-blend-overlay group-hover:bg-transparent transition-all duration-500"></div>
            <img
              src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop"
              alt="Music Studio"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
          </div>

        </div>
      </section>

      {/* ================= CTA BANNER ================= */}
      <section className="py-24 px-6 text-center bg-black">
        <div className="max-w-4xl mx-auto bg-gradient-to-b from-[#1c1c1c] to-black border border-white/10 rounded-3xl p-12 md:p-20 relative overflow-hidden">
          {/* Glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-primary/5 blur-[100px] pointer-events-none"></div>

          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10 font-montserrat">¿Listo para empezar?</h2>
          <p className="text-xl text-gray-400 mb-10 relative z-10">
            Crea tu perfil profesional hoy mismo y revoluciona tu carrera.
          </p>
          <Link to="/auth/register" className="relative z-10 inline-block px-10 py-5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xl transition-all shadow-lg hover:shadow-primary/40 hover:-translate-y-1">
            Crear Mi Cuenta Gratis
          </Link>
        </div>
      </section>

    </div>
  );
};

/* --- Componentes Helper --- */

const StatItem = ({ number, label }) => (
  <div className="flex flex-col items-center">
    <span className="text-3xl font-bold text-[#c9a7eb] font-montserrat">{number}</span>
    <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">{label}</span>
  </div>
);

const FeatureCard = ({ to, icon: Icon, title, desc }) => (
  <Link to={to} className="group p-8 rounded-2xl bg-[#1a0a2e]/40 border border-primary/30 backdrop-blur-md hover:-translate-y-2 hover:border-[#c9a7eb]/60 hover:shadow-[0_8px_40px_rgba(114,9,183,0.2)] transition-all duration-300 text-left">
    <div className="w-12 h-12 rounded-lg bg-[#0a0a0a] border border-white/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#c9a7eb] transition-colors">{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
  </Link>
);

const ListItem = ({ children }) => (
  <li className="flex items-center gap-3 text-gray-300 text-lg">
    <CheckCircle className="w-5 h-5 text-primary shrink-0" />
    {children}
  </li>
);

export default Home;