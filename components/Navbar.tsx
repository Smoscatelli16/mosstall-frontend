// Este es un componente reutilizable para nuestra barra de navegación
// Se mostrará en la parte de arriba de CADA página.

"use client"; // <-- ¡IMPORTANTE! Habilita interactividad y acceso a localStorage

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname(); // Para saber en qué página estamos (opcional, para estilos)
  
  // Estado para saber si el usuario está logueado
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Estado para evitar el "parpadeo" mientras comprobamos el token
  const [isChecking, setIsChecking] = useState(true);

  // EFECTO: Se ejecuta solo una vez cuando la barra se carga en el navegador
  useEffect(() => {
    // 1. Buscamos el token
    const token = localStorage.getItem('token');
    
    // 2. Si existe, actualizamos el estado a TRUE
    if (token) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
    
    // 3. Terminamos de chequear
    setIsChecking(false);
  }, [pathname]); // Se vuelve a chequear si cambiamos de ruta (por si el usuario se loguea)


  // FUNCIÓN DE CERRAR SESIÓN
  const handleLogout = () => {
    // 1. Borramos el token del navegador
    localStorage.removeItem('token');
    
    // 2. Actualizamos el estado visual
    setIsLoggedIn(false);
    
    // 3. Redirigimos al Login
    router.push('/login');
    router.refresh(); // Refrescamos la página para limpiar cualquier dato en memoria
  };


  return (
    <nav className="w-full bg-gray-800 shadow-lg border-b border-gray-700">
      <div className="container mx-auto px-4 sm:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Lado Izquierdo: Logo/Nombre */}
          <Link href="/" className="text-2xl font-bold text-blue-400 hover:text-blue-300 transition-colors">
            MossTall
          </Link>

          {/* Lado Derecho: Links de Navegación Dinámicos */}
          <div className="flex items-center gap-4">
            
            {/* Si estamos cargando, no mostramos nada para evitar saltos raros */}
            {!isChecking && (
              <>
                {/* OPCIÓN A: USUARIO LOGUEADO */}
                {isLoggedIn ? (
                  <>
                     <Link 
                      href="/dashboard" // Futuro Dashboard
                      className="font-medium text-gray-300 hover:text-white transition-colors"
                    >
                      Mi Panel
                    </Link>

                    <Link 
                      href="/publicar" 
                      className="hidden sm:block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20"
                    >
                      + Publicar
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="font-medium text-red-400 hover:text-red-300 border border-red-900/50 bg-red-900/10 px-3 py-1.5 rounded hover:bg-red-900/30 transition-all"
                    >
                      Salir
                    </button>
                  </>
                ) : (
                  /* OPCIÓN B: VISITANTE (NO LOGUEADO) */
                  <>
                    <Link href="/login" className="font-medium text-gray-300 hover:text-blue-400 transition-colors">
                      Iniciar Sesión
                    </Link>
                    <Link href="/register" className="font-medium text-gray-300 hover:text-blue-400 transition-colors">
                      Registrarse
                    </Link>
                  </>
                )}
              </>
            )}

          </div>
          
        </div>
      </div>
    </nav>
  );
}