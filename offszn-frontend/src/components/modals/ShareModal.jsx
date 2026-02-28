import React, { useEffect, useState } from 'react';
import { X, Twitter, Facebook, Copy, Check } from 'lucide-react';
import { BiLogoWhatsapp } from 'react-icons/bi';
import toast from 'react-hot-toast';

const ShareModal = ({ isOpen, onClose, product }) => {
    const [copied, setCopied] = useState(false);
    const [active, setActive] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => setActive(true), 10);
        } else {
            setActive(false);
        }
    }, [isOpen]);

    if (!isOpen && !active) return null;

    const displayName = product?.name || 'Producto';
    const producerName = product?.users?.nickname || product?.artist_users?.nickname || 'Productor';

    // En el nuevo sistema, usamos el slug público si está disponible
    const shortLink = `${window.location.origin}/${product?.product_type || 'beat'}/${product?.public_slug || product?.id}`;

    const shareText = `Escucha "${displayName}" en OFFSZN 🔥`;
    const encodedLink = encodeURIComponent(shortLink);
    const encodedText = encodeURIComponent(shareText);

    const socials = [
        { name: 'Twitter', icon: <Twitter size={24} />, url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedLink}` },
        { name: 'WhatsApp', icon: <BiLogoWhatsapp size={28} />, url: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedLink}` },
        { name: 'Facebook', icon: <Facebook size={24} />, url: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}` }
    ];

    const handleCopy = () => {
        navigator.clipboard.writeText(shortLink).then(() => {
            setCopied(true);
            toast.success('Enlace copiado');
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div
            className={`fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className={`relative w-[440px] max-w-[calc(100vw-32px)] bg-[#111] border border-white/10 rounded-[20px] p-7 md:p-8 shadow-2xl transition-all duration-300 transform ${active ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#888] hover:text-white hover:bg-white/10 transition-all"
                >
                    <X size={18} />
                </button>

                <div className="text-center">
                    <img
                        src={product?.image_url || '/images/portada-default.png'}
                        alt={displayName}
                        className="w-[140px] h-[140px] rounded-[12px] object-cover border border-white/10 mx-auto mb-5 shadow-lg"
                    />

                    <h3 className="text-[1.15rem] font-extrabold text-white mb-1.5 leading-tight break-words">
                        {displayName}
                    </h3>
                    <p className="text-[0.9rem] text-[#888] mb-7">{producerName}</p>

                    <div className="flex justify-center gap-6 mb-7">
                        {socials.map((s, idx) => (
                            <a
                                key={idx}
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className="w-[58px] h-[58px] rounded-full bg-[#1a1a1a] flex items-center justify-center border border-white/5 text-white transition-all group-hover:-translate-y-1 group-hover:bg-[#222] group-hover:border-white/20">
                                    {s.icon}
                                </div>
                            </a>
                        ))}
                    </div>

                    <div className="flex items-center bg-black border border-white/10 rounded-[12px] px-4 h-[52px]">
                        <input
                            type="text"
                            value={shortLink}
                            readOnly
                            className="flex-1 bg-transparent border-none text-[#777] text-[0.9rem] outline-none truncate font-sans"
                        />
                        <button
                            onClick={handleCopy}
                            className="p-2 text-white/60 hover:text-white transition-all transform hover:scale-110"
                        >
                            {copied ? <Check size={20} className="text-[#4bff8f]" /> : <Copy size={20} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
