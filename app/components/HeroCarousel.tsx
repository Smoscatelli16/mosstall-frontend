// app/components/HeroCarousel.tsx
"use client";

import React, { useCallback, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { banners } from '../../config/banners';

export default function HeroCarousel() {
  // 1. Encapsulamos el plugin en un useRef para que React no destruya el temporizador en cada renderizado
  const autoplayPlugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false })
  );

  // 2. Pasamos la referencia actual (.current) al hook
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'center' }, 
    [autoplayPlugin.current]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) {
        emblaApi.scrollPrev();
        // Opcional: Reiniciar el temporizador al hacer clic manual
        autoplayPlugin.current.reset();
    }
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) {
        emblaApi.scrollNext();
        autoplayPlugin.current.reset();
    }
  }, [emblaApi]);

  const activeAds = banners.filter((ad) => ad.active);

  if (activeAds.length === 0) return null;

  return (
    <div className="w-full relative group">
      
      {/* Viewport de Embla */}
      <div className="overflow-hidden bg-slate-100 shadow-sm" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {activeAds.map((ad, index) => (
            <div 
              key={ad.id} 
              className="flex-[0_0_100%] min-w-0 relative cursor-pointer" 
              onClick={() => window.location.href = ad.linkUrl}
            >
               {/* Imagen para Escritorio (Desktop) */}
               <img 
                  src={ad.imageUrlDesktop} 
                  alt={ad.altText} 
                  className="w-full h-auto object-cover max-h-[350px] lg:max-h-[450px] hidden md:block"
                  fetchPriority={index === 0 ? "high" : "auto"}
                  loading={index === 0 ? "eager" : "lazy"}
               />

               {/* Imagen para Celular (Mobile) */}
               <img 
                  src={ad.imageUrlMobile} 
                  alt={ad.altText} 
                  className="w-full h-auto object-cover max-h-[220px] sm:max-h-[280px] md:hidden"
                  fetchPriority={index === 0 ? "high" : "auto"}
                  loading={index === 0 ? "eager" : "lazy"}
               />
            </div>
          ))}
        </div>
      </div>
      
      {/* Controles de Navegación Manual (Prev/Next) */}
      <button 
        onClick={scrollPrev} 
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-[#1a237e] p-2.5 rounded-full shadow-lg transition-all z-10 focus:outline-none hover:scale-105 active:scale-95"
        aria-label="Anuncio Anterior"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      <button 
        onClick={scrollNext} 
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-[#1a237e] p-2.5 rounded-full shadow-lg transition-all z-10 focus:outline-none hover:scale-105 active:scale-95"
        aria-label="Anuncio Siguiente"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {/* Degrade inferior para fundirse con la interfaz */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none z-0"></div>
    </div>
  );
}