// src/app/register/page.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  // --- Estados del Flujo ---
  const [step, setStep] = useState<1 | 2>(1); // Flujo KYC de 2 pasos
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false); 

  // --- Estados del Paso 1 (Datos Personales) ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dni, setDni] = useState('');
  const [phone, setPhone] = useState('');

  // --- Estados del Paso 2 (OTP) ---
  const [otp, setOtp] = useState('');

  // --- Manejador del Paso 1 a 2 ---
  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    // Validaciones básicas de completitud
    if (!name || !email || !password || !dni || !phone) {
        setMessage('Todos los campos son obligatorios para operar de forma segura.');
        return;
    }
    
    // Avanzar al paso de verificación
    setStep(2);
  };

  // --- Manejador Final (Registro + Validación OTP) ---
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); 
    setIsSuccess(false);
    
    if (otp.length !== 6) {
        setMessage('El código de verificación debe tener 6 dígitos.');
        return;
    }

    setIsLoading(true);

    try {
      // NOTA: Acá tu backend en Railway deberá validar el OTP antes de guardar en PostgreSQL
      const response = await fetch('https://mosstall-desa-production.up.railway.app/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name, password, dni, phone, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage(`¡Identidad verificada, ${data.name}! Redirigiendo al login...`);
        
        // Limpiar campos
        setEmail(''); setPassword(''); setName(''); setDni(''); setPhone(''); setOtp('');

        setTimeout(() => {
            router.push('/login');
        }, 2500); 
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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 text-gray-900 font-sans p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 md:p-10 shadow-xl border border-gray-100">
        
        {/* Cabecera Luminosa */}
        <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
                {step === 1 ? 'Crear tu cuenta' : 'Verificación KYC'}
            </h1>
            <p className="text-gray-500 font-medium">
                {step === 1 ? 'Únete a Mission Vende y opera seguro' : 'Ingresá el código de 6 dígitos que te enviamos.'}
            </p>
        </div>
        
        {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4 animate-in fade-in zoom-in duration-300">
              
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-bold text-gray-700">Nombre Completo (Tal como figura en DNI)</label>
                <input
                  type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading}
                  className="w-full rounded-xl border border-gray-200 bg-slate-50 p-3.5 text-gray-900 placeholder-gray-400 focus:border-[#1a237e] focus:ring-2 outline-none"
                  placeholder="Juan Pérez" required
                />
              </div>

              <div>
                <label htmlFor="dni" className="mb-1 block text-sm font-bold text-gray-700">DNI (Sin puntos)</label>
                <input
                  type="number" id="dni" value={dni} onChange={(e) => setDni(e.target.value)} disabled={isLoading}
                  className="w-full rounded-xl border border-gray-200 bg-slate-50 p-3.5 text-gray-900 placeholder-gray-400 focus:border-[#1a237e] focus:ring-2 outline-none"
                  placeholder="12345678" required
                />
              </div>

              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-bold text-gray-700">Teléfono Celular (Para validación SMS/WhatsApp)</label>
                <input
                  type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isLoading}
                  className="w-full rounded-xl border border-gray-200 bg-slate-50 p-3.5 text-gray-900 placeholder-gray-400 focus:border-[#1a237e] focus:ring-2 outline-none"
                  placeholder="+54 9 11 1234-5678" required
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-bold text-gray-700">Email</label>
                <input
                  type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading}
                  className="w-full rounded-xl border border-gray-200 bg-slate-50 p-3.5 text-gray-900 placeholder-gray-400 focus:border-[#1a237e] focus:ring-2 outline-none"
                  placeholder="nombre@ejemplo.com" required
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-bold text-gray-700">Contraseña</label>
                <input
                  type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
                  className="w-full rounded-xl border border-gray-200 bg-slate-50 p-3.5 text-gray-900 placeholder-gray-400 focus:border-[#1a237e] focus:ring-2 outline-none"
                  placeholder="••••••••" required
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl px-5 py-4 text-center font-black text-white text-lg transition-all transform mt-2 bg-[#1a237e] hover:bg-[#121858] hover:-translate-y-0.5 shadow-lg"
              >
                Siguiente: Verificar Identidad ➜
              </button>
            </form>
        )}

        {step === 2 && (
            <form onSubmit={handleFinalSubmit} className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                    <p className="text-sm font-bold text-[#1a237e]">Te enviamos un código de seguridad por WhatsApp/SMS al número:</p>
                    <p className="text-lg font-black text-gray-900 mt-1">{phone}</p>
                    <button type="button" onClick={() => setStep(1)} className="text-xs text-gray-500 hover:text-[#d50000] underline mt-2">¿Número incorrecto? Volver atrás</button>
                </div>

                <div>
                    <label className="block text-center text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest">Código OTP (6 dígitos)</label>
                    <input
                        type="text" 
                        maxLength={6}
                        value={otp} 
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Fuerza solo números
                        disabled={isLoading}
                        className="w-full rounded-xl border-2 border-gray-200 bg-slate-50 p-4 text-gray-900 text-3xl text-center font-black tracking-[0.5em] focus:border-[#1a237e] focus:ring-4 focus:ring-[#1a237e]/20 outline-none transition-all"
                        placeholder="000000"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className={`w-full rounded-xl px-5 py-4 text-center font-black text-white text-lg transition-all transform mt-2
                    ${isLoading || otp.length !== 6 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-[#1a237e] hover:bg-[#121858] hover:-translate-y-0.5 shadow-lg'
                    }`}
                >
                    {isLoading ? 'Verificando y Creando...' : 'Confirmar Registro ✅'}
                </button>
            </form>
        )}

        {/* Mensaje de error centralizado */}
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