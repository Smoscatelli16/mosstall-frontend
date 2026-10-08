// app/components/HeroCarousel.tsx
"use client";

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { banners } from '../../config/banners';

export default function HeroCarousel() {
  const [emblaRef] = useEmblaCarousel({ loop: true, align: 'center' }, [
    Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true })
  ]);

  const activeAds = banners.filter((ad) => ad.active);

  if (activeAds.length === 0) return null;

  return (
    <div className="w-full relative bg-slate-100 overflow-hidden shadow-sm" ref={emblaRef}>
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

             {/* Imagen para Celular (Mobile - Tamaños más compactos para no comer pantalla) */}
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
      
      {/* Degrade inferior para fundirse con la interfaz */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-slate-50 to-transparent pointer-events-none"></div>
    </div>
  );
}