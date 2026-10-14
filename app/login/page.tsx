// src/app/login/page.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('https://mosstall-desa-production.up.railway.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('¡Bienvenido! Ingresando a Mission Vende...');
        
        if (data.token) {
          localStorage.setItem('token', data.token);
        }

        setTimeout(() => {
          window.location.assign('/');
        }, 1500);

      } else {
        setMessage(`Error: ${data.error}`);
        setIsLoading(false); 
      }
    } catch (error) {
      setMessage('Error: No se pudo conectar con el servidor.');
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 text-gray-900 font-sans">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-10 shadow-xl border border-gray-100">
        
        {/* Cabecera / Logo */}
        <div className="flex flex-col items-center justify-center mb-8">
            {/* TASK 5.2: Isologo central */}
            <Image 
                src="/isologo-color.png" 
                alt="Mission Vende" 
                width={140} 
                height={140} 
                className="w-[120px] md:w-[140px] h-auto object-contain mb-5"
                priority
            />
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">¡Hola de nuevo!</h1>
            <p className="text-gray-500 font-medium mt-1">Iniciar Sesión en tu cuenta</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-bold text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-xl border border-gray-200 bg-slate-50 p-4 text-gray-900 placeholder-gray-400 focus:border-[#1a237e] focus:ring-2 focus:ring-[#1a237e]/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-bold text-gray-700">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-xl border border-gray-200 bg-slate-50 p-4 text-gray-900 placeholder-gray-400 focus:border-[#1a237e] focus:ring-2 focus:ring-[#1a237e]/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full rounded-xl px-5 py-4 text-center font-black text-white text-lg transition-all transform mt-2
              ${isLoading 
                ? 'bg-gray-400 cursor-wait' 
                : 'bg-[#1a237e] hover:bg-[#121858] hover:-translate-y-0.5 focus:ring-4 focus:ring-[#1a237e]/30 shadow-lg shadow-[#1a237e]/20'
              }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Ingresando...
              </span>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        {message && (
          <div className={`mt-6 p-4 rounded-xl text-center text-sm font-bold animate-in fade-in zoom-in duration-300
            ${message.includes('Error') ? 'bg-red-50 text-[#d50000] border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}
          `}>
            {message}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500 font-medium">
            ¿No tenés una cuenta en Mission Vende?{' '}
            <Link href="/register" className="font-bold text-[#1a237e] hover:text-[#d50000] transition-colors underline-offset-2 hover:underline">
              Registrate acá
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}