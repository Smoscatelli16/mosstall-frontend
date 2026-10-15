// src/app/layout.tsx
import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MandatoryReviewModal from "@/components/MandatoryReviewModal";
import NextTopLoader from 'nextjs-toploader'; // BRIEF #044: Top Loader

// Nueva tipografía corporativa "Mission Vende": Geométrica, limpia y amigable.
const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mission Vende",
  description: "Tu dinero protegido hasta que recibís el producto. Comprá, vendé y contratá servicios con garantía de confianza en Misiones.",
  icons: {
    icon: "/iso-color.png", 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        // FONDO CLARO ESTRICTO (Brief #034)
        className={`${quicksand.variable} font-sans antialiased bg-slate-50 text-gray-900 min-h-screen flex flex-col`}
      >
        {/* TASK 4.1: Barra de carga superior para feedback inmediato al navegar */}
        <NextTopLoader
          color="#1a237e"
          initialPosition={0.08}
          crawlSpeed={200}
          height={4}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #1a237e,0 0 5px #1a237e"
          zIndex={1600}
        />
        
        <Navbar />
        <MandatoryReviewModal />
        
        {/* Contenedor principal que empuja el footer hacia abajo si hubiera uno */}
        <div className="flex-grow flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}