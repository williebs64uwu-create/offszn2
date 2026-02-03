import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const PromoBanner = () => {
  return (
    <Link 
      to="/auth/register" 
      className="block w-full text-center py-1.5 text-xs font-bold tracking-wide text-white no-underline font-['Plus_Jakarta_Sans']
                 bg-linear-to-r from-[#560bad] via-[#7209b7] to-[#560bad] bg-size-[200%_100%] animate-[gradientMove_5s_infinite_alternate]
                 hover:brightness-110 transition-all group"
    >
      <span className="flex items-center justify-center gap-2">
        🎉 <b>OFERTA EXCLUSIVA:</b> REGÍSTRATE Y OBTÉN <b>$5 USD GRATIS</b> EN TU PRIMERA COMPRA 
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
};

export default PromoBanner;