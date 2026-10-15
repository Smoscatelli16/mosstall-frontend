// src/app/reset-password/page.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      setIsSuccess(true);
      setMessage('Te enviamos un correo con las instrucciones para recuperar tu cuenta. Revisá tu bandeja de entrada o spam.');
    } catch (error: any) {
      setIsSuccess(false);
      setMessage(`Error: ${error.message}`);
    } finally {
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
                width={100} 
                height={100} 
                className="w-[80px] h-auto object-contain mb-5"
                priority
            />
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Recuperar Acceso</h1>
            <p className="text-gray-500 font-medium mt-1 text-sm">Ingresá el correo electrónico asociado a tu cuenta.</p>
        </div>
        
        {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in">
            <div>
                <label htmlFor="email" className="mb-2 block text-sm font-bold text-gray-700">Email</label>
                <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-xl border border-gray-200 bg-slate-50 p-4 text-gray-900 placeholder-gray-400 focus:border-[#1a237e] focus:ring-2 focus:ring-[#1a237e]/20 outline-none transition-all disabled:opacity-50"
                placeholder="tu@email.com"
                required
                />
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className={`w-full rounded-xl px-5 py-4 text-center font-black text-white text-lg transition-all transform mt-2
                ${isLoading 
                    ? 'bg-gray-400 cursor-wait' 
                    : 'bg-[#1a237e] hover:bg-[#121858] hover:-translate-y-0.5 shadow-lg'
                }`}
            >
                {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
            </form>
        ) : (
            <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-2xl text-center animate-in zoom-in">
                <span className="text-4xl block mb-3">📬</span>
                <p className="font-bold text-sm">{message}</p>
            </div>
        )}

        {message && !isSuccess && (
          <div className="mt-6 p-4 rounded-xl text-center text-sm font-bold bg-red-50 text-[#d50000] border border-red-100 animate-in fade-in">
            {message}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <Link href="/login" className="text-sm font-bold text-gray-500 hover:text-[#1a237e] transition-colors">
            ← Volver al Login
          </Link>
        </div>
      </div>
    </main>
  );
}