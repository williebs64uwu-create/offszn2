import React from 'react';
import { Link } from 'react-router-dom';
import { FaInstagram, FaDiscord, FaYoutube, FaWhatsapp, FaCcVisa, FaCcMastercard, FaCcPaypal } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="mt-24 border-t border-[#111] bg-[#080808] pt-20 text-white font-sans">
      <div className="container mx-auto max-w-7xl px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 mb-16">
        
        {/* COLUMNA 1: IDENTIDAD */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="text-2xl font-extrabold tracking-tight text-white mb-4 font-montserrat">
            OFFSZN
          </div>
          <p className="text-[#888] text-sm leading-relaxed mb-6 max-w-[250px]">
            El primer marketplace musical <br />
            hecho en Perú 
            <span className="ml-1.5 text-[0.65rem] font-bold text-[#666] uppercase border border-[#333] px-1.5 py-0.5 rounded">PE</span>
          </p>
          <div className="flex gap-3">
            <SocialIcon href="https://instagram.com" icon={FaInstagram} title="Instagram" />
            <SocialIcon href="https://discord.gg" icon={FaDiscord} title="Discord" />
            <SocialIcon href="https://youtube.com" icon={FaYoutube} title="YouTube" />
            <SocialIcon href="#" icon={FaWhatsapp} title="WhatsApp" />
          </div>
        </div>

        {/* COLUMNA 2: EXPLORAR */}
        <FooterColumn title="Explorar">
          <FooterLink to="/drum-kits">Drum Kits</FooterLink>
          <FooterLink to="/loops">Loops & Samples</FooterLink>
          <FooterLink to="/presets">Presets</FooterLink>
          <FooterLink to="/one-shots">One-Shots</FooterLink>
          <li>
            <Link to="/free" className="text-sm text-sky-400 font-semibold hover:text-white transition-all hover:pl-1 block">
              Descargas Gratis
            </Link>
          </li>
        </FooterColumn>

        {/* COLUMNA 3: STUDIO & COMUNIDAD */}
        <FooterColumn title="Studio & Comunidad">
          <li>
            <Link to="/start-selling" className="text-sm text-white font-semibold hover:pl-1 transition-all block">
              Vender en OFFSZN
            </Link>
          </li>
          <FooterLink to="/productores">Productores / Collabs</FooterLink>
          <FooterLink to="/upload-youtube">Herramientas & Upload</FooterLink>
          <FooterLink to="/blog">Blog & Tips</FooterLink>
        </FooterColumn>

        {/* COLUMNA 4: SOPORTE */}
        <FooterColumn title="Soporte">
          <FooterLink to="/licenses">Licencias</FooterLink>
          <FooterLink to="/help">Centro de Ayuda</FooterLink>
          <FooterLink to="/refunds">Reembolsos</FooterLink>
          <FooterLink to="/terms">Términos</FooterLink>
        </FooterColumn>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-[#141414] bg-[#080808]">
        <div className="container mx-auto max-w-7xl px-10 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#555]">
          
          <div className="order-2 md:order-1">
            &copy; {new Date().getFullYear()} OFFSZN. Todos los derechos reservados.
          </div>

          <div className="order-1 md:order-2 font-medium text-[#777]">
            Hecho con <span className="text-primary">♥</span> en Perú
          </div>

          <div className="order-3 flex items-center gap-3 text-2xl text-[#666]">
            <FaCcVisa title="Visa" />
            <FaCcMastercard title="Mastercard" />
            <FaCcPaypal title="PayPal" />
            {/* YAPE BADGE CUSTOM */}
            <span className="bg-linear-to-br from-[#742284] to-[#a92db5] text-white text-[0.6rem] font-extrabold px-2 py-1 rounded tracking-wide leading-none">
              YAPE
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

/* --- Componentes Helper para mantener el código limpio --- */

const SocialIcon = ({ href, icon: Icon, title }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noreferrer"
    title={title}
    className="w-9 h-9 rounded-full bg-[#111] border border-[#222] flex items-center justify-center text-[#999] text-base transition-all duration-300 hover:bg-primary hover:border-primary hover:text-white hover:-translate-y-1 hover:shadow-[0_5px_15px_rgba(139,92,246,0.3)]"
  >
    <Icon />
  </a>
);

const FooterColumn = ({ title, children }) => (
  <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
    <h4 className="text-[#555] text-xs font-bold uppercase tracking-widest mb-6">{title}</h4>
    <ul className="space-y-3">
      {children}
    </ul>
  </div>
);

const FooterLink = ({ to, children }) => (
  <li>
    <Link to={to} className="text-[#bbb] text-sm hover:text-white transition-all hover:pl-1 block">
      {children}
    </Link>
  </li>
);

export default Footer;