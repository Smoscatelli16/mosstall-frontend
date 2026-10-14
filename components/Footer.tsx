// src/components/Footer.tsx
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-12 mt-auto">
      <div className="container mx-auto px-4 flex flex-col items-center justify-center">
        
        <Link href="/" className="mb-6 hover:scale-105 transition-transform duration-300">
            <Image 
                src="/isologo-color.png" 
                alt="Mission Vende" 
                width={120} 
                height={120} 
                className="w-[120px] h-auto object-contain drop-shadow-sm"
            />
        </Link>
        
        <p className="text-sm font-medium text-gray-400 text-center max-w-sm leading-relaxed mb-6">
          Tu dinero protegido hasta que recibís el producto. Comprá, vendé y contratá servicios con garantía de confianza en Misiones.
        </p>
        
        <div className="flex items-center gap-6 text-sm font-bold text-[#1a237e]">
            <Link href="#" className="hover:text-[#d50000] transition-colors">Términos de Uso</Link>
            <Link href="#" className="hover:text-[#d50000] transition-colors">Privacidad</Link>
            <Link href="#" className="hover:text-[#d50000] transition-colors">Ayuda</Link>
        </div>

        <p className="text-xs text-gray-300 font-bold mt-8 uppercase tracking-widest">
          © {new Date().getFullYear()} Mission Vende. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}