// src/app/register/page.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  // --- Estados ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);

  // --- Manejador de Envío ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); 
    setIsSuccess(false);
    setIsLoading(true);

    try {
      const response = await fetch('https://mosstall-desa-production.up.railway.app/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage(`¡Bienvenido ${data.name}! Redirigiendo al login...`);
        
        // Limpiar campos
        setEmail('');
        setPassword('');
        setName('');

        setTimeout(() => {
            router.push('/login');
        }, 2000); 

      } else {
        setIsSuccess(false);
        setMessage(`Error: ${data.error}`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setMessage('Error: No se pudo conectar con el servidor.');
      setIsLoading(false);
    }
  };

  // --- Renderizado ---
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 text-gray-900 font-sans">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-10 shadow-xl border border-gray-100">
        
        {/* Cabecera Luminosa */}
        <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Crear tu cuenta</h1>
            <p className="text-gray-500 font-medium">Únete a Mission Vende y opera seguro</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo de Nombre */}
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-bold text-gray-700">Nombre Completo</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-xl border border-gray-200 bg-slate-50 p-4 text-gray-900 placeholder-gray-400 focus:border-[#1a237e] focus:ring-2 focus:ring-[#1a237e]/20 outline-none transition-all disabled:opacity-50"
              placeholder="Juan Pérez"
              required
            />
          </div>

          {/* Campo de Email */}
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-bold text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-xl border border-gray-200 bg-slate-50 p-4 text-gray-900 placeholder-gray-400 focus:border-[#1a237e] focus:ring-2 focus:ring-[#1a237e]/20 outline-none transition-all disabled:opacity-50"
              placeholder="nombre@ejemplo.com"
              required
            />
          </div>

          {/* Campo de Contraseña */}
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-bold text-gray-700">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-xl border border-gray-200 bg-slate-50 p-4 text-gray-900 placeholder-gray-400 focus:border-[#1a237e] focus:ring-2 focus:ring-[#1a237e]/20 outline-none transition-all disabled:opacity-50"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full rounded-xl px-5 py-4 text-center font-black text-white text-lg transition-all transform mt-2
              ${isLoading 
                ? 'bg-gray-400 cursor-wait' 
                : 'bg-[#1a237e] hover:bg-[#121858] hover:-translate-y-0.5 focus:ring-4 focus:ring-[#1a237e]/30 shadow-lg shadow-[#1a237e]/20'
              }`}
          >
            {isLoading ? 'Registrando...' : 'Registrarme'}
          </button>
        </form>

        {/* Mensaje de éxito o error */}
        {message && (
          <div className={`mt-6 p-4 rounded-xl text-center text-sm font-bold animate-in fade-in zoom-in duration-300 ${isSuccess ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-[#d50000] border border-red-100'}`}>
            {message}
          </div>
        )}

        <div className="mt-8 pt-6 text-center">
          <p className="text-sm text-gray-500 font-medium">
            ¿Ya tenés una cuenta?{' '}
            <Link href="/login" className="font-bold text-[#1a237e] hover:text-[#d50000] transition-colors underline-offset-2 hover:underline">
              Iniciá sesión acá
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}