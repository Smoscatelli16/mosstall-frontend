import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"; // <-- ¡NUEVA LÍNEA IMPORTADA!

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// --- METADATA MODIFICADA ---
export const metadata: Metadata = {
  title: "MossTall Marketplace",
  description: "Tu marketplace de confianza en Misiones",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // --- IDIOMA MODIFICADO ---
    <html lang="es">
      <body
        // --- CLASES GLOBALES MODIFICADAS ---
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-white`}
      >
        <Navbar /> {/* <-- ¡NUEVA LÍNEA AÑADIDA! */}
        {children}
      </body>
    </html>
  );
}