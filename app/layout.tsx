// src/app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MandatoryReviewModal from "@/components/MandatoryReviewModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MossTall", // Título limpio como pediste
  description: "Tu dinero protegido hasta que recibís el producto. Comprá, vendé y contratá servicios con garantía de confianza en Misiones.",
  icons: {
    icon: "/logo-icon.svg", // Icono SVG nuevo
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-white`}
      >
        <Navbar />
        <MandatoryReviewModal />
        {children}
      </body>
    </html>
  );
}