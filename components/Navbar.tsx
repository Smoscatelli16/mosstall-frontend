// src/components/Navbar.tsx
"use client"; 

import Link from 'next/link';
import Image from 'next/image'; // IMPORTANTE: Usamos Image para cargar los SVG de public
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import MandatoryReviewModal from './MandatoryReviewModal';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname(); 
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const [mandatoryReview, setMandatoryReview] = useState<any | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setMandatoryReview(null);
    setCurrentUserId(null);
    setHasNotifications(false);
    
    if (pathname !== '/login') {
        router.push('/login');
        router.refresh();
    }
  };

  const checkGlobalStatus = async () => {
        const token = localStorage.getItem('token');
        
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const userIdFromToken = payload.userId;
                setCurrentUserId(userIdFromToken);
                
                const resProfile = await fetch(`http://localhost:3001/api/profile/${userIdFromToken}`);
                
                if (resProfile.status === 404) {
                    console.warn("Usuario fantasma detectado. Cerrando sesión...");
                    handleLogout();
                    setIsChecking(false);
                    return; 
                }

                const resDashboard = await fetch('http://localhost:3001/api/dashboard', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (resDashboard.status === 401 || resDashboard.status === 403) {
                    handleLogout();
                    setIsChecking(false);
                    return;
                }

                setIsLoggedIn(true);

                if (resDashboard.ok) {
                    let totalPending = 0;
                    const data = await resDashboard.json();
                    
                    totalPending += (data.pendingQuestions?.length || 0) + (data.answersReceived?.length || 0);
                    
                    if (data.pendingReviews && data.pendingReviews.length > 0) {
                        setMandatoryReview(data.pendingReviews[0]);
                    } else {
                        setMandatoryReview(null);
                    }

                    const resChats = await fetch('http://localhost:3001/api/chats', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (resChats.ok) {
                        const chats = await resChats.json();
                        const unreadMessages = chats.reduce((acc: number, chat: any) => acc + (chat._count?.messages || 0), 0);
                        totalPending += unreadMessages;
                    }
                    setHasNotifications(totalPending > 0);
                }

            } catch (e) {
                console.error("Error crítico de sesión", e);
            }
        } else {
            setIsLoggedIn(false);
            setMandatoryReview(null);
            setCurrentUserId(null);
        }
        setIsChecking(false);
    };

  useEffect(() => {
    checkGlobalStatus();
    setIsMenuOpen(false); 
  }, [pathname]); 

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  return (
    <>
        {mandatoryReview && (
            <MandatoryReviewModal />
        )}

        <nav className="w-full bg-gray-900 shadow-lg border-b border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-8">
            <div className="flex justify-between items-center h-16">
            
            {/* --- ZONA DEL LOGO --- */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                
                {/* 1. Versión MÓVIL (Solo Icono) */}
                <div className="block md:hidden relative h-10 w-10">
                    <Image 
                        src="/logo-icon.svg" 
                        alt="Logo Icon" 
                        fill
                        className="object-contain"
                    />
                </div>

                {/* 2. Versión DESKTOP: Texto + Logo Full a la derecha */}
                <div className="hidden md:flex items-center gap-4">
                    {/* Texto del Nombre */}
                    <span className="text-2xl font-bold text-white tracking-tight">
                        MossTall
                    </span>

                    {/* Separador vertical */}
                    <div className="h-6 w-px bg-gray-700"></div>

                    {/* Imagen SVG desde public */}
                    <div className="relative h-8 w-32">
                        <Image 
                            src="/logo-full.svg" 
                            alt="Logo MossTall" 
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

            </Link>
            {/* ------------------------------------------------------ */}

            <div className="flex items-center gap-6">
                
                {!isChecking && (
                <>
                    {/* OPCIÓN A: USUARIO LOGUEADO */}
                    {isLoggedIn ? (
                    <div className="flex items-center gap-4">
                        
                        <Link 
                            href="/publicar" 
                            className="hidden sm:flex items-center gap-2 bg-liner-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-5 py-2 rounded-full font-bold text-sm shadow-lg shadow-blue-900/40 transition-all hover:scale-105 active:scale-95"
                        >
                            <span className="text-lg">+</span> Publicar
                        </Link>

                        <div className="relative" ref={menuRef}>
                            <button 
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center gap-2 focus:outline-none group"
                            >
                                <div className="relative h-10 w-10 rounded-full bg-gray-800 border-2 border-gray-600 group-hover:border-gray-400 transition-colors flex items-center justify-center overflow-hidden">
                                    <span className="text-xl">👤</span>
                                    {hasNotifications && (
                                        <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-gray-900 animate-pulse"></span>
                                    )}
                                </div>
                            </button>

                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-60 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                    
                                    <Link href="/publicar" className="block sm:hidden px-4 py-3 text-sm text-blue-400 font-bold hover:bg-gray-700 transition-colors border-b border-gray-700/50">
                                        + Publicar Anuncio
                                    </Link>

                                    <Link href="/dashboard" className="block px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 hover:text-white transition-colors border-b border-gray-700/50">
                                        📊 Ir a Mi Panel
                                        {hasNotifications && <span className="ml-2 text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded-full">Nuevos</span>}
                                    </Link>

                                    <div className="py-1">
                                            <Link href={currentUserId ? `/profile/${currentUserId}` : '#'} className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                                                👁️ Ver mi Perfil Público
                                            </Link>
                                            <Link href="/profile/edit" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                                                ✏️ Editar Perfil
                                            </Link>
                                    </div>

                                    <div className="border-t border-gray-700/50 py-1">
                                            <button 
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
                                            >
                                                🚪 Cerrar Sesión
                                            </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    ) : (
                    /* OPCIÓN B: VISITANTE */
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                        Iniciar Sesión
                        </Link>
                        <Link href="/register" className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg shadow-blue-900/20 transition-all">
                        Registrarse
                        </Link>
                    </div>
                    )}
                </>
                )}

            </div>
            
            </div>
        </div>
        </nav>
    </>
  );
}