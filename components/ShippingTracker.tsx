// src/components/ShippingTracker.tsx
"use client";

import React from 'react';

// Enum extraído de Task 54.1 (schema.prisma)
export type ShipmentStatus = 
  | 'PENDING' 
  | 'PREPARING' 
  | 'READY_FOR_PICKUP' 
  | 'IN_TRANSIT' 
  | 'DELIVERED' 
  | 'FAILED';

type ShippingTrackerProps = {
  status: ShipmentStatus;
  trackingNumber?: string | null;
  estimatedDelivery?: Date | string | null;
};

export default function ShippingTracker({ status, trackingNumber, estimatedDelivery }: ShippingTrackerProps) {
  
  // Mapeamos los estados del backend a los pasos visuales (1, 2, 3)
  const getStepLevel = () => {
    switch (status) {
      case 'PENDING':
      case 'PREPARING':
      case 'READY_FOR_PICKUP':
        return 1;
      case 'IN_TRANSIT':
        return 2;
      case 'DELIVERED':
        return 3;
      case 'FAILED':
        return -1; // Estado de error
      default:
        return 0;
    }
  };

  const step = getStepLevel();

  // Formateo de fecha de entrega
  const formatDeliveryDate = () => {
    if (!estimatedDelivery) return 'Calculando...';
    const date = new Date(estimatedDelivery);
    return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  if (status === 'FAILED') {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 text-center">
        <span className="text-3xl mb-2 block">⚠️</span>
        <h3 className="text-red-400 font-bold text-lg">Inconveniente con el Envío</h3>
        <p className="text-red-300/80 text-sm mt-1">Ocurrió un problema durante la logística con Neo Mandados. Soporte se contactará a la brevedad.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 md:p-8 w-full shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-700 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            📦 Seguimiento del Envío
          </h2>
          {trackingNumber && (
            <p className="text-sm text-gray-400 mt-1 font-mono">
              Tracking ID: <span className="text-gray-200">{trackingNumber}</span>
            </p>
          )}
        </div>
        <div className="text-left md:text-right">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Llegada Estimada</p>
          <p className="text-blue-400 font-bold capitalize">{formatDeliveryDate()}</p>
        </div>
      </div>

      {/* Línea de Tiempo Visual */}
      <div className="relative flex justify-between items-center w-full max-w-2xl mx-auto mt-10">
        
        {/* Barra de progreso de fondo */}
        <div className="absolute top-1/2 left-0 w-full h-1.5 bg-gray-700 -translate-y-1/2 rounded-full z-0"></div>
        
        {/* Barra de progreso activa */}
        <div 
          className="absolute top-1/2 left-0 h-1.5 bg-blue-500 -translate-y-1/2 rounded-full z-0 transition-all duration-700 ease-in-out"
          style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
        ></div>

        {/* Paso 1: Preparando */}
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-colors duration-500 ${step >= 1 ? 'bg-blue-600 border-gray-800 shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-gray-700 border-gray-800'}`}>
            <span className="text-sm">🏪</span>
          </div>
          <div className="text-center absolute top-12 w-32 -ml-11">
            <p className={`text-xs font-bold uppercase tracking-wider ${step >= 1 ? 'text-white' : 'text-gray-500'}`}>Preparando</p>
            {status === 'READY_FOR_PICKUP' && <p className="text-[10px] text-blue-400 mt-0.5">Listo para el cadete</p>}
          </div>
        </div>

        {/* Paso 2: En Camino */}
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-colors duration-500 ${step >= 2 ? 'bg-blue-600 border-gray-800 shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-gray-800 border-gray-700'}`}>
            <span className="text-sm">🛵</span>
          </div>
          <div className="text-center absolute top-12 w-32 -ml-11">
            <p className={`text-xs font-bold uppercase tracking-wider ${step >= 2 ? 'text-white' : 'text-gray-500'}`}>En camino</p>
            {status === 'IN_TRANSIT' && <p className="text-[10px] text-blue-400 mt-0.5">Repartidor asignado</p>}
          </div>
        </div>

        {/* Paso 3: Entregado */}
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-colors duration-500 ${step >= 3 ? 'bg-green-500 border-gray-800 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-gray-800 border-gray-700'}`}>
            <span className="text-sm">✅</span>
          </div>
          <div className="text-center absolute top-12 w-32 -ml-11">
            <p className={`text-xs font-bold uppercase tracking-wider ${step >= 3 ? 'text-green-400' : 'text-gray-500'}`}>Entregado</p>
          </div>
        </div>

      </div>

      <div className="mt-20 pt-5 border-t border-gray-700/50 flex items-center justify-center gap-2 opacity-60">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Logística operada por</span>
        <span className="text-xs font-black text-white bg-gray-900 px-2 py-1 rounded">Neo Mandados</span>
      </div>
    </div>
  );
}