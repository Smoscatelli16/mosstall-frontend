"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PendingContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto text-center">
      {/* Icono de Reloj / Espera */}
      <div className="mb-6 rounded-full bg-yellow-900/30 p-6 ring-1 ring-yellow-500/50 animate-pulse">
        <svg 
          className="h-16 w-16 text-yellow-500" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h1 className="mb-2 text-3xl font-extrabold text-white">Pago en Proceso</h1>
      <p className="mb-8 text-lg text-gray-300">
        Tu pago se está revisando. Esto es común con pagos en efectivo o revisiones de seguridad bancaria.
      </p>

      {/* Tarjeta de Advertencia */}
      <div className="w-full rounded-lg border border-yellow-700 bg-yellow-900/20 p-5 mb-8 text-left">
        <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wide mb-2 flex items-center gap-2">
          ⚠️ Información Importante
        </h3>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-2">
          <li><strong>No intentes pagar de nuevo</strong> todavía, para evitar cargos duplicados.</li>
          <li>Te notificaremos en cuanto se confirme la acreditación.</li>
          <li>El producto permanecerá reservado por un tiempo limitado.</li>
        </ul>
        {paymentId && (
          <div className="mt-4 pt-4 border-t border-yellow-800 text-xs text-gray-400">
            Referencia de pago: <span className="font-mono text-white">{paymentId}</span>
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex gap-4">
        <Link 
          href="/" 
          className="rounded-lg bg-gray-700 px-6 py-3 font-medium text-white hover:bg-gray-600 transition-colors"
        >
          Volver al Inicio
        </Link>
        <Link 
          href="/dashboard" // Placeholder
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-500 transition-colors"
        >
          Ver Mis Compras
        </Link>
      </div>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
      <Suspense fallback={<p className="text-gray-400">Verificando estado...</p>}>
        <PendingContent />
      </Suspense>
    </main>
  );
}