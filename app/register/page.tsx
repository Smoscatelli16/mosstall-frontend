// src/app/register/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js'; // TASK 6.1

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Definición global para el callback de Turnstile
declare global {
  interface Window {
    onTurnstileSuccess: (token: string) => void;
  }
}

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false); 

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  
  // UX: Controladores
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // TASK 49.4: Integración Callback Turnstile
  useEffect(() => {
    window.onTurnstileSuccess = (token: string) => {
      setTurnstileToken(token);
    };
  }, []);

  // TASK 6.1: Función para registro con Google
  const handleGoogleSignUp = async () => {
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

  // TASK 49.3: Sanitización de Input Telefónico (Ajustado para el nuevo badge)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    val = val.replace(/\D/g, ''); // Remover todo lo que no sea número
    if (val.startsWith('0')) val = val.substring(1); // Remover 0 inicial
    if (val.startsWith('9')) val = val.substring(1); // Remover 9 inicial para evitar duplicación
    if (val.startsWith('15')) val = val.substring(2); // Remover 15 intermedio/inicial
    setPhone(val);
  };

  // TASK 50.4: Disparar envío de OTP por WhatsApp antes de pasar al Paso 2
  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    if (!name || !email || !password || !phone) {
        setMessage('Todos los campos son obligatorios para operar de forma segura.');
        return;
    }

    if (!turnstileToken) {
        setMessage('Verificando seguridad... por favor aguardá un momento.');
        return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://mosstall-desa-production.up.railway.app/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+54${phone}` }), // CORREGIDO: Se eliminó el 9 fijo
      });

      const data = await response.json();

      if (response.ok) {
        setStep(2);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error enviando OTP:', error);
      setMessage('Error: No se pudo conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  // TASK 50.4: Verificar OTP primero, y luego registrar
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); 
    setIsSuccess(false);
    
    if (!termsAccepted) {
        setMessage('Debes aceptar los Términos de Fideicomiso para operar.');
        return;
    }

    if (otp.length !== 6) {
        setMessage('El código de verificación debe tener 6 dígitos.');
        return;
    }

    setIsLoading(true);

    try {
      // 1. Verificamos el OTP generado por nuestro propio motor
      const verifyResponse = await fetch('https://mosstall-desa-production.up.railway.app/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+54${phone}`, code: otp }), // CORREGIDO: Se eliminó el 9 fijo
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        setIsSuccess(false);
        setMessage(`Error: ${verifyData.error}`);
        setIsLoading(false);
        return; // Detenemos el flujo si el código es inválido
      }

      // 2. Si el OTP es válido, procedemos a registrar el usuario
      const registerResponse = await fetch('https://mosstall-desa-production.up.railway.app/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, phone: `+54${phone}`, otp, termsAccepted, turnstileToken }), // CORREGIDO: Se eliminó el 9 fijo
      });

      const registerData = await registerResponse.json();

      if (registerResponse.ok) {
        setIsSuccess(true);
        setMessage(`¡Identidad verificada, ${registerData.name}! Redirigiendo al login...`);
        
        setEmail(''); setPassword(''); setName(''); setPhone(''); setOtp(''); setTermsAccepted(false);

        setTimeout(() => {
            router.push('/login');
        }, 2500); 
      } else {
        setIsSuccess(false);
        setMessage(`Error: ${registerData.error}`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setMessage('Error: No se pudo conectar con el servidor.');
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 text-gray-900 font-sans p-4 py-12">
      {/* Script Cloudflare Turnstile */}
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />

      <div className="w-full max-w-md rounded-4xl bg-white p-8 md:p-10 shadow-xl border border-gray-100 relative">
        
        {/* BOTÓN VOLVER EN LA PARTE SUPERIOR */}
        {step === 2 && (
          <button 
            type="button" 
            onClick={() => setStep(1)} 
            className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center text-sm font-bold text-gray-400 hover:text-[#1a237e] transition-colors"
          >
            ← Volver
          </button>
        )}
        
        <div className="flex flex-col items-center justify-center text-center mb-8">
            <Image 
                src="/isologo-color.png" 
                alt="Mission Vende" 
                width={120} 
                height={120} 
                className={`w-[100px] md:w-[120px] h-auto object-contain mb-6 ${step === 2 ? 'mt-4' : ''}`}
                priority
            />
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
                {step === 1 ? 'Crear tu cuenta' : 'Verificación KYC'}
            </h1>
            <p className="text-gray-500 font-medium leading-tight">
                {step === 1 ? 'Únete a Mission Vende y opera seguro' : 'Ingresá el código de 6 dígitos que te enviamos.'}
            </p>
        </div>
        
        {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4 animate-in fade-in zoom-in duration-300">
              
              {/* TASK 6.1: Botón de Google */}
              <button 
                  type="button" 
                  onClick={handleGoogleSignUp}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
              >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continuar con Google
              </button>

              <div className="flex items-center gap-3 my-4">
                  <hr className="w-full border-gray-200" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">O REGISTRO MANUAL</span>
                  <hr className="w-full border-gray-200" />
              </div>

              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-bold text-gray-700">Nombre y Apellido</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} className="w-full rounded-xl border border-gray-200 bg-slate-50 p-3.5 text-gray-900 placeholder-gray-400 focus:border-[#1a237e] focus:ring-2 outline-none transition-all" placeholder="Juan Pérez" required />
              </div>

              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-bold text-gray-700">Teléfono Celular (WhatsApp/SMS)</label>
                <div className="flex items-stretch shadow-sm rounded-xl">
                  {/* Badge unificado, sin saltos de línea */}
                  <span className="inline-flex items-center justify-center px-4 rounded-l-xl border border-r-0 border-gray-200 bg-gray-100 text-gray-600 font-black text-sm select-none shrink-0 whitespace-nowrap">
                      🇦🇷 +54
                  </span>
                  <input type="tel" id="phone" value={phone} onChange={handlePhoneChange} disabled={isLoading} className="w-full rounded-r-xl border border-gray-200 bg-slate-50 p-3.5 text-gray-900 placeholder-gray-400 focus:border-[#1a237e] focus:ring-2 outline-none transition-all" placeholder="Cód. Área + Nro sin 15 (Ej: 3764123456)" required />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-bold text-gray-700">Email</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className="w-full rounded-xl border border-gray-200 bg-slate-50 p-3.5 text-gray-900 placeholder-gray-400 focus:border-[#1a237e] focus:ring-2 outline-none transition-all" placeholder="nombre@ejemplo.com" required />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-bold text-gray-700">Contraseña</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} id="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} className="w-full rounded-xl border border-gray-200 bg-slate-50 p-3.5 text-gray-900 placeholder-gray-400 focus:border-[#1a237e] focus:ring-2 outline-none transition-all pr-12" placeholder="••••••••" required />
                  {password.length > 0 && (
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" title={showPassword ? "Ocultar" : "Mostrar"}>
                      {showPassword ? '👁️' : '🔒'}
                    </button>
                  )}
                </div>
              </div>

              {/* Widget Cloudflare Turnstile Invisible/Fricción Cero */}
              <div className="cf-turnstile flex justify-center mt-2" data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} data-callback="onTurnstileSuccess"></div>

              <button type="submit" disabled={isLoading || !turnstileToken} className="w-full rounded-xl px-5 py-4 text-center font-black text-white text-lg transition-all transform mt-2 bg-[#1a237e] hover:bg-[#121858] hover:-translate-y-0.5 shadow-lg disabled:bg-gray-400 disabled:hover:translate-y-0 disabled:shadow-none">
                {isLoading ? 'Aguardá un momento...' : 'Siguiente: Verificar Identidad ➜'}
              </button>
            </form>
        )}

        {step === 2 && (
            <form onSubmit={handleFinalSubmit} className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center relative">
                    <p className="text-sm font-bold text-[#1a237e]">Te enviamos un código de seguridad por WhatsApp al número:</p>
                    <p className="text-lg font-black text-gray-900 mt-1">🇦🇷 +54 {phone}</p>
                    
                    <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-gray-500 hover:text-[#1a237e] underline underline-offset-2 mt-3 block w-full transition-colors">
                        ¿Número incorrecto? Modificar datos
                    </button>
                </div>

                <div>
                    <label className="block text-center text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest">Código OTP (6 dígitos)</label>
                    <input type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} disabled={isLoading} className="w-full rounded-xl border-2 border-gray-200 bg-slate-50 p-4 text-gray-900 text-3xl text-center font-black tracking-[0.5em] focus:border-[#1a237e] focus:ring-4 focus:ring-[#1a237e]/20 outline-none transition-all" placeholder="000000" required />
                </div>

                <div className="flex items-start gap-3 mt-4">
                    <input 
                        type="checkbox" 
                        id="terms" 
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-1 h-5 w-5 rounded border-gray-300 text-[#1a237e] focus:ring-[#1a237e] transition-colors cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600 font-medium leading-tight cursor-pointer">
                        Acepto los <Link href="/terminos" className="text-[#1a237e] font-bold hover:underline" target="_blank">Términos, Condiciones y Políticas de Fideicomiso</Link> de Mission Vende. Autorizo la gestión de fondos en transacciones del Mercado Inverso.
                    </label>
                </div>

                <button type="submit" disabled={isLoading || otp.length !== 6 || !termsAccepted} className={`w-full rounded-xl px-5 py-4 text-center font-black text-white text-lg transition-all transform mt-2 ${isLoading || otp.length !== 6 || !termsAccepted ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#1a237e] hover:bg-[#121858] hover:-translate-y-0.5 shadow-lg'}`}>
                    {isLoading ? 'Verificando y Creando...' : 'Confirmar Registro ✅'}
                </button>
            </form>
        )}

        {message && (
          <div className={`mt-6 p-4 rounded-xl text-center text-sm font-bold animate-in fade-in zoom-in duration-300 ${isSuccess ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-[#d50000] border border-red-100'}`}>
            {message}
          </div>
        )}

        {step === 1 && (
            <div className="mt-8 pt-6 text-center border-t border-gray-50">
            <p className="text-sm text-gray-500 font-medium">
                ¿Ya tenés una cuenta?{' '}
                <Link href="/login" className="font-bold text-[#1a237e] hover:text-[#d50000] transition-colors underline-offset-2 hover:underline">
                Iniciá sesión acá
                </Link>
            </p>
            </div>
        )}
      </div>
    </main>
  );
}