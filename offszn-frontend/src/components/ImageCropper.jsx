import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export default function ImageCropper({ image, onCrop, onCancel }) {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const imgRef = useRef(null);
    const containerRef = useRef(null);

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

        const container = containerRef.current;
        // El visor siempre es un cuadrado. En Studio Mode escalamos visualmente pero el crop usa estas dimensiones
        const viewSize = Math.min(container.clientWidth * 0.6, container.clientHeight * 0.6, 400);

        const displayedWidth = img.width * scale;
        const displayedHeight = img.height * scale;

        const viewRect = {
            left: (container.clientWidth - viewSize) / 2,
            top: (container.clientHeight - viewSize) / 2
        };

        const imgInitialLeft = (container.clientWidth - img.width) / 2;
        const imgInitialTop = (container.clientHeight - img.height) / 2;

        const imgCurrentLeft = imgInitialLeft + offset.x - (displayedWidth - img.width) / 2;
        const imgCurrentTop = imgInitialTop + offset.y - (displayedHeight - img.height) / 2;

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
        <div className="fixed inset-0 bg-black/98 z-[9999] flex flex-col lg:flex-row overflow-hidden animate-in fade-in duration-500 backdrop-blur-3xl">

            {/* --- WORKSPACE (LEFT) --- */}
            <div className="relative flex-1 bg-[#020202] overflow-hidden flex items-center justify-center cursor-crosshair group/cropper"
                ref={containerRef}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={(e) => {
                    const delta = e.deltaY > 0 ? -0.1 : 0.1;
                    setScale(prev => Math.max(0.1, Math.min(10, prev + delta)));
                }}>

                {/* Dynamic Image Engine */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <img
                        ref={imgRef}
                        src={image}
                        alt="Refining Asset"
                        onMouseDown={handleMouseDown}
                        draggable={false}
                        style={{
                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                            cursor: isDragging ? 'grabbing' : 'grab',
                            userSelect: 'none',
                            maxWidth: 'none',
                            maxHeight: 'none',
                            pointerEvents: 'auto'
                        }}
                        className="transition-transform duration-100 ease-out will-change-transform"
                    />
                </div>

                {/* Smart Crop Box (Standard 1:1) */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] lg:w-[400px] lg:h-[400px] border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.85)] relative backdrop-grayscale-[0.2]">
                        {/* Rule of Thirds Grid */}
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
                            {[...Array(9)].map((_, i) => <div key={i} className="border border-white/40"></div>)}
                        </div>
                        {/* High Fidelity Corners */}
                        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-violet-500 rounded-tl-sm shadow-[0_0_15px_rgba(139,92,246,0.5)]"></div>
                        <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-violet-500 rounded-tr-sm shadow-[0_0_15px_rgba(139,92,246,0.5)]"></div>
                        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-violet-500 rounded-bl-sm shadow-[0_0_15px_rgba(139,92,246,0.5)]"></div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-violet-500 rounded-br-sm shadow-[0_0_15px_rgba(139,92,246,0.5)]"></div>
                    </div>
                </div>

                {/* HUD Overlay */}
                <div className="absolute top-8 left-8 lg:top-12 lg:left-12 flex flex-col gap-2">
                    <div className="flex items-center gap-4 bg-black/40 backdrop-blur-2xl px-6 py-3 rounded-2xl border border-white/5 shadow-2xl">
                        <RotateCcw size={18} className="text-violet-500 animate-spin-slow" />
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Studio Mode <span className="text-violet-500/50">V2.4</span></h3>
                    </div>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/5 backdrop-blur-2xl px-8 py-3 rounded-full border border-white/10 text-[9px] text-gray-500 uppercase tracking-[0.2em] font-black shadow-2xl animate-pulse whitespace-nowrap lg:block hidden">
                    Drag Workspace • Scroll for Matrix Zoom
                </div>
            </div>

            {/* --- CONTROL PANEL (SIDEBAR) --- */}
            <div className="w-full lg:w-[400px] bg-[#050505] border-l border-white/5 flex flex-col shadow-[-50px_0_100px_rgba(0,0,0,0.8)] z-10 relative">

                {/* Header Section */}
                <div className="p-8 lg:p-10 border-b border-white/5 flex justify-between items-center bg-[#080808]">
                    <div className="space-y-1">
                        <span className="text-[9px] font-black text-violet-500 uppercase tracking-[0.3em]">Refinement Engine</span>
                        <h4 className="text-sm lg:text-base font-black text-white uppercase tracking-widest leading-none">Global Adjusts</h4>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-3 lg:p-4 rounded-2xl hover:bg-white/5 text-gray-500 hover:text-white transition-all border border-transparent hover:border-white/5 group"
                    >
                        <X size={24} className="group-hover:rotate-90 transition-transform duration-500" />
                    </button>
                </div>

                {/* Scrollable Adjustments */}
                <div className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-10 lg:space-y-12">

                    {/* Scale Protocol */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-end">
                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Scale Factor</label>
                            <span className="text-[11px] font-black text-violet-500 bg-violet-500/10 px-3 py-1 rounded-lg">{(scale * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <button onClick={() => setScale(prev => Math.max(0.1, prev - 0.2))} className="p-3 lg:p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-gray-500 hover:text-white transition-all active:scale-95 shadow-lg">
                                <ZoomOut size={18} />
                            </button>
                            <div className="flex-1 relative h-1.5 bg-white/5 rounded-full overflow-hidden group">
                                <input
                                    type="range"
                                    min="0.1"
                                    max="5"
                                    step="0.01"
                                    value={scale}
                                    onChange={(e) => setScale(parseFloat(e.target.value))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div
                                    className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-violet-500 bg-[length:200%_auto] animate-shimmer transition-all duration-300"
                                    style={{ width: `${(scale / 5) * 100}%` }}
                                ></div>
                            </div>
                            <button onClick={() => setScale(prev => Math.min(5, prev + 0.2))} className="p-3 lg:p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-gray-500 hover:text-white transition-all active:scale-95 shadow-lg">
                                <ZoomIn size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Metadata Readout */}
                    <div className="bg-black/40 border border-white/5 p-6 rounded-3xl space-y-5 shadow-inner">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Aspect Ratio</span>
                                <span className="text-[10px] font-black text-white bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest">1:1 Square</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Ouput Format</span>
                                <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/5 px-3 py-1 rounded-full uppercase tracking-widest">Ultra HQ</span>
                            </div>
                        </div>
                        <div className="pt-2">
                            <p className="text-[8px] text-gray-700 uppercase tracking-widest leading-relaxed font-bold">
                                Use the rule of thirds to align your visual elements for maximum impact across the OFFSZN network.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 lg:p-10 bg-[#070707] border-t border-white/5 space-y-4 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
                    <button
                        onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}
                        className="w-full flex items-center justify-center gap-3 py-4 lg:py-5 bg-white/[0.01] text-gray-600 rounded-3xl hover:text-white hover:bg-white/5 transition-all border border-white/5 font-black uppercase tracking-widest text-[9px] active:scale-95"
                    >
                        <RotateCcw size={14} className="opacity-50" />
                        Reset Studio
                    </button>
                    <button
                        onClick={handleSave}
                        className="w-full group flex items-center justify-center gap-4 py-5 lg:py-6 bg-white text-black rounded-[32px] hover:bg-violet-600 hover:text-white active:scale-95 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.4)] font-black uppercase tracking-widest text-[11px] relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
                        Finalize Asset
                        <X size={18} className="rotate-45 group-hover:translate-x-2 transition-transform duration-500" />
                    </button>
                </div>
            </div>
        </div>
    );
}