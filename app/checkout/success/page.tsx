// src/app/checkout/success/page.tsx
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// --- PROCESADOR DE ESTADO (Debe ir en Suspense por requerimiento de Next.js) ---
function SuccessProcessor() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    // Mercado Pago nos devuelve nuestro ID de transacción aquí
    const externalReference = searchParams.get('external_reference') || searchParams.get('transaction_id');
    
    const [status, setStatus] = useState<'POLLING' | 'SUCCESS' | 'TIMEOUT' | 'ERROR'>('POLLING');
    const [attempts, setAttempts] = useState(0);

    useEffect(() => {
        if (!externalReference) {
            setStatus('ERROR');
            return;
        }

        const checkTransactionStatus = async () => {
            try {
                const token = localStorage.getItem('token');
                
                // Consultamos a nuestro backend el estado de la orden
                const res = await fetch(`http://mosstall-desa-production.up.railway.app/api/transactions/${externalReference}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (res.ok) {
                    const data = await res.json();
                    // Si el Webhook de MP ya notificó, el estado será PAID_HELD
                    if (data.state === 'PAID_HELD' || data.state === 'FUNDS_RELEASED') {
                        setStatus('SUCCESS');
                        return true; 
                    }
                }
                return false; 
            } catch (error) {
                return false;
            }
        };

        // Polling: Consultar cada 2 segundos, máximo 10 veces
        let currentAttempt = 0;
        const maxAttempts = 10;
        
        const intervalId = setInterval(async () => {
            currentAttempt++;
            setAttempts(currentAttempt);
            
            const isSuccess = await checkTransactionStatus();
            
            if (isSuccess) {
                clearInterval(intervalId);
            } else if (currentAttempt >= maxAttempts) {
                clearInterval(intervalId);
                setStatus('TIMEOUT');
            }
        }, 2000);

        // Disparamos un primer intento inmediato
        checkTransactionStatus().then(success => {
            if(success) clearInterval(intervalId);
        });

        return () => clearInterval(intervalId);
    }, [externalReference]);

    // 1. ESTADO DE CARGA (POLLING)
    if (status === 'POLLING') {
        return (
            <div className="flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-500">
                <div className="w-20 h-20 border-4 border-blue-900 border-t-blue-500 rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Asegurando tu dinero en la bóveda...</h2>
                    <p className="text-gray-400">Esperando confirmación del procesador de pagos.</p>
                    <p className="text-xs text-gray-600 mt-4">Intento {attempts} de 10</p>
                </div>
            </div>
        );
    }

    // 2. ESTADO DE ERROR (Sin ID)
    if (status === 'ERROR') {
        return (
            <div className="flex flex-col items-center justify-center text-center space-y-6">
                <span className="text-6xl">🔗</span>
                <div>
                    <h2 className="text-2xl font-bold text-red-400 mb-2">Enlace inválido</h2>
                    <p className="text-gray-400 mb-6">No pudimos identificar la transacción. Si el pago se debitó, revisa tu panel.</p>
                    <Link href="/dashboard" className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-xl transition-colors">
                        Ir al Panel
                    </Link>
                </div>
            </div>
        );
    }

    // 3. ESTADO DE TIMEOUT (Webhook demorado)
    if (status === 'TIMEOUT') {
        return (
            <div className="flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-6">
                <span className="text-6xl">⏳</span>
                <div>
                    <h2 className="text-2xl font-bold text-yellow-400 mb-2">Pago en proceso</h2>
                    <p className="text-gray-300 leading-relaxed mb-6">
                        Mercado Pago está demorando más de lo normal en confirmar tu operación. 
                        No te preocupes, apenas recibamos la señal, tu dinero quedará asegurado en el fideicomiso y el vendedor será notificado.
                    </p>
                    <Link href={`/order/${externalReference}`} className="block w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl transition-colors shadow-lg">
                        Ir a la Sala de Operaciones
                    </Link>
                </div>
            </div>
        );
    }

    // 4. ESTADO DE ÉXITO (Handoff y Educación)
    return (
        <div className="flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
            
            {/* Celebración Visual */}
            <div className="relative">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.4)] z-10 relative">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
            </div>

            <div>
                <h1 className="text-3xl font-bold text-white mb-2">¡Pago Asegurado!</h1>
                <p className="text-green-400 font-medium tracking-wide">Transacción confirmada por la red.</p>
            </div>

            {/* UX Financiera: Educación del Fideicomiso */}
            <div className="bg-gray-800/80 border border-gray-700 p-6 rounded-2xl shadow-xl text-left">
                <div className="flex items-start gap-4">
                    <span className="text-3xl">🛡️</span>
                    <div>
                        <h3 className="font-bold text-white mb-1">Las Reglas del Juego</h3>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            Tu dinero está <strong>protegido en la bóveda de MossTall</strong>. El vendedor ya ha sido notificado de tu compra, pero 
                            no recibirá ni un solo centavo hasta que tú confirmes explícitamente que tienes el producto en tus manos.
                        </p>
                    </div>
                </div>
            </div>

            {/* CTA a la sala transaccional (Brief #031 y previo al #032) */}
            <div className="w-full pt-4">
                <Link href={`/order/${externalReference}`} className="block w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-[0.98] text-lg">
                    Ir al Chat para coordinar entrega
                </Link>
                <p className="text-xs text-gray-500 mt-4 font-medium uppercase tracking-widest">MossTall Fideicomiso BIND</p>
            </div>
        </div>
    );
}

// --- CONTENEDOR PRINCIPAL ---
export default function CheckoutSuccessPage() {
    return (
        <main className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
            <Suspense fallback={<div className="text-white animate-pulse font-bold">Cargando plataforma...</div>}>
                <SuccessProcessor />
            </Suspense>
        </main>
    );
}