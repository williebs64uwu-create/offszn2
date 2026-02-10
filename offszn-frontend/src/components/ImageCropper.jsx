import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export default function ImageCropper({ image, onCrop, onCancel }) {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const imgRef = useRef(null);
    const containerRef = useRef(null);

    // Centrar imagen al cargar
    useEffect(() => {
        if (imgRef.current) {
            // Podríamos calcular el scale inicial para que cubra el cuadrado
        }
    }, [image]);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setOffset({
            x: e.clientX - startPos.x,
            y: e.clientY - startPos.y
        });
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleSave = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');

        const img = imgRef.current;
        if (!img) return;

        // Dimensiones del visor
        const viewSize = 300; // El tamaño del recuadro blanco en el UI

        // 1. Obtener dimensiones reales de la imagen mostrada
        const displayedWidth = img.width * scale;
        const displayedHeight = img.height * scale;

        // 2. Posición del centro del visor relativo al centro de la imagen
        // El visor está en el centro del contenedor
        const container = containerRef.current;
        const viewRect = {
            left: (container.clientWidth - viewSize) / 2,
            top: (container.clientHeight - viewSize) / 2
        };

        // 3. Calcular qué parte de la imagen está dentro del visor
        // La imagen está desplazada por 'offset' desde su posición inicial (centrada)
        const imgInitialLeft = (container.clientWidth - img.width) / 2;
        const imgInitialTop = (container.clientHeight - img.height) / 2;

        const imgCurrentLeft = imgInitialLeft + offset.x - (displayedWidth - img.width) / 2;
        const imgCurrentTop = imgInitialTop + offset.y - (displayedHeight - img.height) / 2;

        // Transformar coordenadas de pantalla a coordenadas de imagen original
        const scaleFactor = img.naturalWidth / displayedWidth;

        const sourceX = (viewRect.left - imgCurrentLeft) * scaleFactor;
        const sourceY = (viewRect.top - imgCurrentTop) * scaleFactor;
        const sourceSize = viewSize * scaleFactor;

        ctx.drawImage(
            img,
            sourceX, sourceY, sourceSize, sourceSize,
            0, 0, 1000, 1000
        );

        onCrop(canvas.toDataURL('image/jpeg', 0.9));
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">

                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#181818]">
                    <h3 className="font-semibold text-white">Recortar Portada</h3>
                    <button onClick={onCancel} className="text-gray-400 hover:text-white transition p-1 hover:bg-white/5 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <div className="relative h-[400px] flex items-center justify-center bg-black overflow-hidden cursor-crosshair"
                    ref={containerRef}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={(e) => {
                        const delta = e.deltaY > 0 ? -0.05 : 0.05;
                        setScale(prev => Math.max(0.2, Math.min(5, prev + delta)));
                    }}>

                    <img
                        ref={imgRef}
                        src={image}
                        alt="To crop"
                        onMouseDown={handleMouseDown}
                        draggable={false}
                        style={{
                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                            cursor: isDragging ? 'grabbing' : 'grab',
                            userSelect: 'none',
                            maxWidth: '80%',
                            maxHeight: '80%'
                        }}
                        className="transition-transform duration-75 ease-out select-none"
                    />

                    {/* Crop Box Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-[300px] h-[300px] border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] relative">
                            {/* Esquinas decorativas */}
                            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-violet-500"></div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-violet-500"></div>
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-violet-500"></div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-violet-500"></div>
                        </div>
                    </div>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                        Arrastra para mover • Rueda para zoom
                    </div>
                </div>

                <div className="p-6 bg-[#0c0c0c] space-y-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setScale(prev => Math.max(0.2, prev - 0.1))} className="text-gray-500 hover:text-white transition">
                            <ZoomOut size={18} />
                        </button>
                        <input
                            type="range"
                            min="0.2"
                            max="5"
                            step="0.01"
                            value={scale}
                            onChange={(e) => setScale(parseFloat(e.target.value))}
                            className="flex-1 accent-violet-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                        <button onClick={() => setScale(prev => Math.min(5, prev + 0.1))} className="text-gray-500 hover:text-white transition">
                            <ZoomIn size={18} />
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}
                            className="p-3 bg-white/5 text-gray-400 rounded-xl hover:text-white transition flex items-center gap-2 text-sm font-medium"
                            title="Resetear"
                        >
                            <RotateCcw size={18} />
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all shadow-lg shadow-white/5"
                        >
                            Aplicar Recorte
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
