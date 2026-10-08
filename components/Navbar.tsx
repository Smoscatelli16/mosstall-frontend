// src/components/Navbar.tsx
"use client"; 

import Link from 'next/link';
import Image from 'next/image'; 
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
  const [isPublishMenuOpen, setIsPublishMenuOpen] = useState(false); // Estado para el menú de publicación
  const [mandatoryReview, setMandatoryReview] = useState<any | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const publishMenuRef = useRef<HTMLDivElement>(null);

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
                
                const resDashboard = await fetch('https://mosstall-desa-production.up.railway.app/api/dashboard', {
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

                    const resChats = await fetch('https://mosstall-desa-production.up.railway.app/api/chats', {
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
    setIsPublishMenuOpen(false);
  }, [pathname]); 

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (publishMenuRef.current && !publishMenuRef.current.contains(event.target as Node)) {
        setIsPublishMenuOpen(false);
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

        <nav className="w-full bg-white shadow-sm border-b border-gray-100 sticky top-0 z-[999]">
        <div className="container mx-auto px-4 sm:px-8">
            <div className="flex justify-between items-center h-20"> 
            
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="block md:hidden relative h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md">
                    MV
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <span className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <div className="h-8 w-8 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg shadow-md">
                            MV
                        </div>
                        Mission Vende
                    </span>
                </div>
            </Link>

            <div className="flex items-center gap-6">
                
                {!isChecking && (
                <>
                    {/* OPCIÓN A: USUARIO LOGUEADO */}
                    {isLoggedIn ? (
                    <div className="flex items-center gap-4">
                        
                        {/* Menú Desplegable de Publicación */}
                        <div className="relative hidden sm:block" ref={publishMenuRef}>
                            <button 
                                onClick={() => setIsPublishMenuOpen(!isPublishMenuOpen)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-md transition-all hover:scale-105 active:scale-95"
                            >
                                <span className="text-lg">+</span> Publicar
                            </button>

                            {isPublishMenuOpen && (
                                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right z-[1000]">
                                    <Link href="/publicar" className="block px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors border-b border-gray-100">
                                        📦 Vender Producto/Servicio
                                    </Link>
                                    <Link href="/se-busca" className="block px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                                        🔄 Mercado Inverso (Pedir)
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Menú de Usuario */}
                        <div className="relative" ref={menuRef}>
                            <button 
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center gap-2 focus:outline-none group"
                            >
                                <div className="relative h-11 w-11 rounded-full bg-gray-100 border-2 border-transparent group-hover:border-blue-200 transition-colors flex items-center justify-center overflow-hidden">
                                    <span className="text-xl">👤</span>
                                    {hasNotifications && (
                                        <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
                                    )}
                                </div>
                            </button>

                            {isMenuOpen && (
                                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right z-[1000]">
                                    
                                    <Link href="/publicar" className="block sm:hidden px-4 py-3 text-sm text-blue-600 font-bold hover:bg-gray-50 transition-colors border-b border-gray-100">
                                        + Publicar Venta
                                    </Link>
                                    <Link href="/se-busca" className="block sm:hidden px-4 py-3 text-sm text-purple-600 font-bold hover:bg-purple-50 transition-colors border-b border-gray-100">
                                        + Publicar Necesidad
                                    </Link>

                                    <Link href="/dashboard" className="block px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors border-b border-gray-100">
                                        📊 Ir a Mi Panel
                                        {hasNotifications && <span className="ml-2 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full">Nuevos</span>}
                                    </Link>

                                    <div className="py-1">
                                            <Link href={currentUserId ? `/profile/${currentUserId}` : '#'} className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                                👁️ Ver mi Perfil Público
                                            </Link>
                                            <Link href="/profile/edit" className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                                ✏️ Editar Perfil
                                            </Link>
                                    </div>

                                    <div className="border-t border-gray-100 py-1 mt-1">
                                            <button 
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
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
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors px-3 py-2">
                            Iniciar Sesión
                        </Link>
                        <Link href="/register" className="text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full shadow-md transition-all hover:scale-105 active:scale-95">
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