"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Componente interno para manejar los parámetros de búsqueda
// (Necesario envolverlo para evitar errores de hidratación en Next.js App Router)
function SuccessContent() {
  const searchParams = useSearchParams();
  
  // Mercado Pago suele enviar estos parámetros en la URL de retorno
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const merchantOrder = searchParams.get('merchant_order_id');

  return (
    <div className="flex flex-col items-center">
      {/* Icono de Éxito Animado */}
      <div className="mb-6 rounded-full bg-green-900/30 p-6 ring-1 ring-green-500/50">
        <svg 
          className="h-16 w-16 text-green-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="mb-2 text-4xl font-extrabold text-white">¡Pago Exitoso!</h1>
      <p className="mb-8 text-lg text-gray-300">Tu orden ha sido procesada correctamente.</p>

      {/* Tarjeta de Detalles - Estilo "Boucher" */}
      <div className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-xl mb-8">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400 border-b border-gray-700 pb-2">
          Detalle de la Operación
        </h2>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Estado:</span>
            <span className="font-medium text-green-400 uppercase">{status || 'Aprobado'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">ID de Pago (MP):</span>
            <span className="font-mono text-white">{paymentId || 'N/A'}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Orden de Comerciante:</span>
            <span className="font-mono text-white">{merchantOrder || 'N/A'}</span>
          </div>
        </div>

        {/* MENSAJE DE CONFIANZA (ESCROW) - CRÍTICO PARA MOSSTALL */}
        <div className="mt-6 rounded bg-blue-900/20 p-4 border border-blue-800">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <p className="text-sm font-bold text-blue-200">Garantía MossTall Activa</p>
              <p className="text-xs text-blue-300 mt-1">
                Tu dinero está retenido de forma segura. No se liberará al vendedor hasta que confirmes que recibiste el producto en condiciones.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex gap-4">
        <Link 
          href="/" 
          className="rounded-lg bg-gray-700 px-6 py-3 font-medium text-white hover:bg-gray-600 transition-colors"
        >
          Volver al Inicio
        </Link>
        <Link 
          href="/dashboard" // Asumimos que existirá un dashboard de usuario
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-500 shadow-lg shadow-blue-900/50 transition-colors"
        >
          Ver Mis Compras
        </Link>
      </div>
    </div>
  );
}

// Componente Principal de la Página
export default function PaymentSuccessPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4 text-center">
      {/* Suspense es necesario en Next.js cuando usamos useSearchParams 
         para que la página no se rompa al renderizarse en el servidor.
      */}
      <Suspense fallback={<p className="text-white">Verificando pago...</p>}>
        <SuccessContent />
      </Suspense>
    </main>
  );
}