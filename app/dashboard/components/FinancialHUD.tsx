// src/app/dashboard/components/FinancialHUD.tsx
import React from 'react';

type FinancialHUDProps = {
  metrics: {
    retained: number;
    released: number;
  };
};

export default function FinancialHUD({ metrics }: FinancialHUDProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
      <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm relative group hover:shadow-md transition-shadow">
        <h3 className="text-gray-500 text-sm font-black uppercase tracking-wider mb-2 flex items-center gap-2">
          ⏳ Dinero en Camino (Retenido)
          <span className="cursor-help text-white font-bold bg-[#1a237e] rounded-full w-5 h-5 flex items-center justify-center text-[10px]">?</span>
          <div className="absolute top-14 left-8 bg-gray-900 text-xs text-white p-4 rounded-xl shadow-2xl border border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-72 leading-relaxed">
            Este dinero está protegido en el fideicomiso. Se liberará automáticamente a tu cuenta cuando el comprador confirme la recepción del producto o servicio.
          </div>
        </h3>
        <p className="text-4xl font-black text-yellow-500">
          ${Number(metrics.retained).toLocaleString('es-AR')}
        </p>
      </div>
      
      <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-gray-500 text-sm font-black uppercase tracking-wider mb-2">
          ✅ Dinero Liquidado (Histórico)
        </h3>
        <p className="text-4xl font-black text-green-600">
          ${Number(metrics.released).toLocaleString('es-AR')}
        </p>
      </div>
    </div>
  );
}