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
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4 md:p-8 backdrop-blur-md overflow-hidden">
            <div className="bg-[#121212] border border-white/10 rounded-[48px] w-full max-w-lg flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300 max-h-full overflow-hidden">

                {/* --- HEADER --- */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#181818] flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-500/10 rounded-xl text-violet-500">
                            <RotateCcw size={16} />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Asset Refiner</h3>
                    </div>
                    <button onClick={onCancel} className="text-gray-500 hover:text-white transition p-2 hover:bg-white/5 rounded-2xl">
                        <X size={20} />
                    </button>
                </div>

                {/* --- SCROLLABLE AREA / FLEX CONTAINER --- */}
                <div className="flex-1 flex flex-col overflow-y-auto min-h-0">

                    {/* --- PREVIEW ZONE --- */}
                    <div className="relative flex-1 min-h-[250px] md:min-h-[350px] flex items-center justify-center bg-black overflow-hidden cursor-crosshair"
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
                                maxWidth: '90%',
                                maxHeight: '90%'
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

                    {/* --- CONTROLS ZONE --- */}
                    <div className="p-8 bg-[#0c0c0c] space-y-8 flex-shrink-0">
                        <div className="flex items-center gap-6">
                            <button onClick={() => setScale(prev => Math.max(0.2, prev - 0.1))} className="text-gray-600 hover:text-violet-500 transition">
                                <ZoomOut size={20} />
                            </button>
                            <input
                                type="range"
                                min="0.2"
                                max="5"
                                step="0.01"
                                value={scale}
                                onChange={(e) => setScale(parseFloat(e.target.value))}
                                className="flex-1 accent-violet-500 h-1 bg-white/5 rounded-full appearance-none cursor-pointer"
                            />
                            <button onClick={() => setScale(prev => Math.min(5, prev + 0.1))} className="text-gray-600 hover:text-violet-500 transition">
                                <ZoomIn size={20} />
                            </button>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}
                                className="p-4 bg-white/[0.03] text-gray-500 rounded-2xl hover:text-white hover:bg-white/10 transition-all flex items-center justify-center border border-white/5"
                                title="Resetear Pipeline"
                            >
                                <RotateCcw size={20} />
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 py-4 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-violet-500 hover:text-white active:scale-[0.98] transition-all shadow-2xl"
                            >
                                Finalize Asset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
