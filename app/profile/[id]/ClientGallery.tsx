// app/profile/[id]/ClientGallery.tsx
"use client";

import { useState } from 'react';

type ClientGalleryProps = {
    images: string[];
    type: 'certifications' | 'portfolio';
};

export default function ClientGallery({ images, type }: ClientGalleryProps) {
    const [selectedImg, setSelectedImg] = useState<string | null>(null);

    // Ajustamos la relación de aspecto según el tipo de imagen
    const aspectClass = type === 'certifications' ? 'aspect-video' : 'aspect-square';

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                {images.map((img, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => setSelectedImg(img)} 
                        className={`${aspectClass} rounded-xl overflow-hidden border border-gray-200 hover:border-[#1a237e]/50 hover:shadow-md transition-all cursor-pointer bg-white shadow-sm group`}
                    >
                        <img 
                            src={img} 
                            alt={`Imagen ${idx}`} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                    </div>
                ))}
            </div>

            {selectedImg && (
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 sm:p-10 backdrop-blur-sm" 
                    onClick={() => setSelectedImg(null)}
                >
                    <button 
                        className="absolute top-4 right-4 sm:top-8 sm:right-8 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2 z-[10000] transition-all focus:outline-none" 
                        onClick={(e) => {
                            e.stopPropagation(); // Evita que el click se propague
                            setSelectedImg(null);
                        }}
                        aria-label="Cerrar imagen"
                    >
                        {/* SVG Nativo configurado con clases de Tailwind */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    
                    <img 
                        src={selectedImg} 
                        alt="Vista ampliada" 
                        className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl animate-in fade-in zoom-in duration-300 pointer-events-none" 
                    />
                </div>
            )}
        </>
    );
}