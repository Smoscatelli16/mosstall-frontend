"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Componente interno para manejar el contenido
function FailureContent() {
  const searchParams = useSearchParams();
  
  // Capturamos parámetros de error si MP los envía
  const status = searchParams.get('status'); // ej: 'rejected'
  const paymentType = searchParams.get('payment_type'); // ej: 'credit_card'

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto">
      {/* Icono de Error Visual */}
      <div className="mb-6 rounded-full bg-red-900/30 p-6 ring-1 ring-red-500/50">
        <svg 
          className="h-16 w-16 text-red-500" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <h1 className="mb-2 text-3xl font-extrabold text-white">Hubo un problema con el pago</h1>
      <p className="mb-8 text-center text-gray-300">
        La transacción no pudo completarse. No se ha realizado ningún cargo a tu cuenta.
      </p>

      {/* Caja de Diagnóstico */}
      <div className="w-full rounded-lg border border-red-900/50 bg-red-900/10 p-5 mb-8 text-left">
        <h3 className="text-sm font-bold text-red-400 uppercase tracking-wide mb-2">Posibles Causas:</h3>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          <li>Fondos insuficientes en la tarjeta.</li>
          <li>La tarjeta rechazó la operación por seguridad.</li>
          <li>Problemas de conexión con el banco.</li>
          {status && <li>Código de error reportado: <span className="font-mono text-red-300">{status}</span></li>}
        </ul>
      </div>

      {/* Botones de Acción - Enfocados en Recuperar la Venta */}
      <div className="flex flex-col w-full gap-3 sm:flex-row sm:justify-center">
        <Link 
          href="/" 
          className="w-full sm:w-auto rounded-lg bg-blue-600 px-6 py-3 font-bold text-white text-center hover:bg-blue-500 shadow-lg shadow-blue-900/30 transition-all transform hover:scale-[1.02]"
        >
          🔄 Intentar Nuevamente
        </Link>
        
        <Link 
          href="/support" // Placeholder para futuro soporte
          className="w-full sm:w-auto rounded-lg border border-gray-600 bg-transparent px-6 py-3 font-medium text-gray-300 text-center hover:bg-gray-800 transition-colors"
        >
          Ayuda / Soporte
        </Link>
      </div>
      
      <p className="mt-8 text-xs text-gray-500">
        Si el problema persiste, contacta a tu banco o prueba con otro medio de pago.
      </p>
    </div>
  );
}

// Componente Principal
export default function PaymentFailurePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
      {/* Suspense Wrapper obligatorio para useSearchParams */}
      <Suspense fallback={<p className="text-gray-400">Analizando error...</p>}>
        <FailureContent />
      </Suspense>
    </main>
  );
}