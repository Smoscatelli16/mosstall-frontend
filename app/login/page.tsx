// src/app/login/page.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js'; // TASK 6.1

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // TASK 6.1: Función para login con Google
  const handleGoogleSignIn = async () => {
      try {
          setIsLoading(true);
          const { error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                  redirectTo: `${window.location.origin}/auth/callback`,
              }
          });
          if (error) throw error;
      } catch (error: any) {
          setMessage(`Error con Google: ${error.message}`);
          setIsLoading(false);
      }
  };

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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 text-gray-900 font-sans p-4">
      {/* Corrección Tailwind: rounded-4xl */}
      <div className="w-full max-w-md rounded-4xl bg-white p-10 shadow-xl border border-gray-100">
        
        <div className="flex flex-col items-center justify-center mb-8 text-center">
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

        {/* TASK 6.1: Botón de Google */}
        <button 
            type="button" 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 mb-5"
        >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar con Google
        </button>

        <div className="flex items-center gap-3 mb-5">
            <hr className="w-full border-gray-200" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">O EMAIL</span>
            <hr className="w-full border-gray-200" />
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
            <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-sm font-bold text-gray-700">Contraseña</label>
                {/* TASK 6.3: Enlace de recuperación */}
                <Link href="/reset-password" className="text-xs font-bold text-[#1a237e] hover:underline">
                    ¿Olvidaste tu clave?
                </Link>
            </div>
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