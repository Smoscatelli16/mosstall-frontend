// src/app/auth/callback/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Procesando autenticación con Google...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
          if (session.access_token) {
            localStorage.setItem('token', session.access_token);
          }

          setStatus('¡Autenticación exitosa! Redirigiendo a Mission Vende...');

          setTimeout(() => {
            router.push('/');
          }, 1500);
        } else {
          const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.access_token) {
              localStorage.setItem('token', session.access_token);
              setStatus('¡Autenticación exitosa! Redirigiendo...');
              setTimeout(() => {
                router.push('/');
              }, 1000);
            }
          });

          return () => {
            authListener.subscription.unsubscribe();
          };
        }
      } catch (err: any) {
        console.error('Error en callback:', err);
        setStatus('Error al procesar el inicio de sesión.');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 text-gray-900 font-sans p-4">
      <div className="w-full max-w-md rounded-4xl bg-white p-10 shadow-xl border border-gray-100 text-center">
        <div className="flex justify-center mb-6">
          <svg className="animate-spin h-10 w-10 text-[#1a237e]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight mb-2">Procesando inicio de sesión</h1>
        <p className="text-[#1a237e] font-bold text-sm animate-pulse">{status}</p>
      </div>
    </main>
  );
}