import React, { useRef, useEffect } from 'react';
import { BiX, BiCopy, BiCheck } from 'react-icons/bi';
import { FaWhatsapp, FaTwitter, FaFacebookF } from 'react-icons/fa';
import toast from 'react-hot-toast';
import SecureImage from '../ui/SecureImage';

export default function ProfileShareModal({ isOpen, onClose, profile }) {
    const modalRef = useRef(null);
    const [copied, setCopied] = React.useState(false);

    // Handle escape key to close
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Handle click outside to close
    const handleBackdropClick = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            onClose();
        }
    };

    if (!profile) return null;

    // The share URL is the link to the Bio page (linktree)
    const shareUrl = `${window.location.origin}/b/${profile.nickname}`;
    const shareText = `Mira el perfil de música de ${profile.nickname} en OFFSZN 🔥`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success("Enlace copiado al portapapeles");
        setTimeout(() => setCopied(false), 2000);
    };

    const shareLinks = {
        whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    };

    const openShare = (url) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={handleBackdropClick}
            aria-modal="true"
            role="dialog"
        >
            <div
                ref={modalRef}
                className={`bg-[#111] border border-zinc-800 rounded-2xl w-full max-w-[360px] p-6 flex flex-col items-center transform transition-transform duration-300 relative shadow-2xl ${isOpen ? 'scale-100' : 'scale-95'}`}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                    aria-label="Cerrar modal"
                >
                    <BiX size={24} />
                </button>

                <h3 className="text-lg font-bold text-white mb-6 tracking-wide">COMPARTIR PERFIL</h3>

                {/* Avatar */}
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-800 mb-4 bg-zinc-900 shadow-xl">
                    <SecureImage src={profile.avatar_url} alt={profile.nickname} className="w-full h-full object-cover" />
                </div>

                {/* Details */}
                <h4 className="font-bold text-white text-xl mb-1">{profile.nickname}</h4>
                <p className="text-sm text-gray-400 mb-8 tracking-wide">@{profile.handle || profile.nickname}</p>

                {/* Quick Share Buttons */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => openShare(shareLinks.whatsapp)}
                        className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center text-xl hover:scale-110 transition-transform"
                        aria-label="Compartir en WhatsApp"
                    >
                        <FaWhatsapp />
                    </button>

                    <button
                        onClick={() => openShare(shareLinks.twitter)}
                        className="w-12 h-12 rounded-full bg-black border border-zinc-700 text-white flex items-center justify-center text-xl hover:scale-110 transition-transform"
                        aria-label="Compartir en X (Twitter)"
                    >
                        <FaTwitter />
                    </button>

                    <button
                        onClick={() => openShare(shareLinks.facebook)}
                        className="w-12 h-12 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-xl hover:scale-110 transition-transform"
                        aria-label="Compartir en Facebook"
                    >
                        <FaFacebookF />
                    </button>
                </div>

                {/* Copy Link Native Input */}
                <div className="w-full relative">
                    <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="w-full bg-[#0a0a0a] border border-zinc-800 text-gray-300 text-sm rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:border-zinc-500"
                    />
                    <button
                        onClick={handleCopy}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md bg-zinc-800 flex items-center justify-center text-white hover:bg-zinc-700 transition-colors group"
                        aria-label="Copiar enlace"
                    >
                        {copied ? <BiCheck className="text-sm text-green-500" /> : <BiCopy className="text-sm group-hover:text-white transition-colors duration-200" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
