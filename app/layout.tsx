// src/app/layout.tsx
import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MandatoryReviewModal from "@/components/MandatoryReviewModal";

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
    icon: "/logo-icon.svg", 
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