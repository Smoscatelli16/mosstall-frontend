// src/app/dashboard/components/OrderList.tsx
import Link from 'next/link';
import React from 'react';

type OrderListProps = {
  orders: any[];
  type: 'purchases' | 'sales';
  processingId: string | null;
  actions: {
    onRelease: (id: string) => void;
    onDispute: (id: string) => void;
    onReview: (id: string, title: string) => void;
    onCancel: (id: string) => void;
    onDelete: (id: string) => void;
    onPos: (tx: any) => void;
    onCardClick?: (id: string) => void;
  };
};

export default function OrderList({ orders, type, processingId, actions }: OrderListProps) {
  
  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'PENDING': return <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-yellow-100 text-yellow-700">⏳ En Proceso</span>;
      case 'PAID_HELD': return <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700">🛡️ Pago Retenido</span>;
      case 'FUNDS_RELEASED': return <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700">✅ Finalizado</span>;
      case 'DISPUTED': return <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-[#d50000] text-white animate-pulse shadow-md">🚨 EN DISPUTA</span>;
      case 'REFUNDED': return <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600">❌ Reembolsado</span>;
      default: return <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600">{state}</span>;
    }
  };

  const canCancel = (state: string) => state === 'PENDING';
  const canDelete = (state: string) => state === 'FUNDS_RELEASED' || state === 'REFUNDED';
  const isActionable = (state: string) => state === 'PAID_HELD' || state === 'DISPUTED';

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-50 m-4 rounded-2xl border border-dashed border-gray-200">
        <p className="text-gray-500 font-medium">No tienes {type === 'purchases' ? 'compras' : 'ventas'} registradas.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {orders.map((tx) => {
        const isPurchase = type === 'purchases';
        const displayAmount = isPurchase ? tx.grossAmount : tx.sellerFinalAmount;
        const otherParty = isPurchase ? tx.seller : tx.buyer;

        return (
          <div 
            key={tx.id} 
            data-txid={tx.id}
            className="flex flex-col md:flex-row gap-5 p-5 rounded-2xl bg-slate-50 border border-gray-100 items-center hover:border-[#1a237e]/30 hover:shadow-sm transition-all group"
          >
            
            {/* Ícono de Transacción (Corregido a /chat/) */}
            <Link href={`/chat/${tx.id}`} className="h-14 w-14 bg-white rounded-xl border border-gray-100 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform shadow-sm">
              {isPurchase ? '🛍️' : '💰'}
            </Link>
            
            <div className="grow w-full">
              {/* Título de Transacción (Corregido a /chat/) */}
              <Link href={`/chat/${tx.id}`} className="font-bold text-gray-900 text-lg hover:text-[#1a237e] transition-colors block mb-1">
                {tx.product?.title || 'Producto Eliminado'}
              </Link>
              <p className="text-sm text-gray-500 font-medium">
                  {isPurchase ? 'Vendedor:' : 'Comprador:'} 
                  {otherParty ? (
                      <Link href={`/profile/${otherParty.id}`} className="text-[#1a237e] hover:underline font-bold ml-1">
                          {otherParty.name || 'Desconocido'}
                      </Link>
                  ) : ' Desconocido'}
              </p>
            </div>
            
            <div className="text-right flex flex-col items-end gap-2 shrink-0">
              <span className={`text-xl font-black ${isPurchase ? 'text-gray-900' : 'text-green-600'}`}>
                {isPurchase ? '' : '+ '} ${Number(displayAmount).toLocaleString('es-AR')}
              </span>
              {getStatusBadge(tx.state)}

              {/* Botón Destacado: Ir a la Sala de Operaciones (Corregido a /chat/) */}
              {isActionable(tx.state) && (
                  <Link href={`/chat/${tx.id}`} className="mt-2 w-full md:w-auto bg-[#1a237e] hover:bg-[#121858] text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md transition-transform hover:-translate-y-0.5 text-center">
                      Ir a Sala de Operaciones ➜
                  </Link>
              )}
              
              {/* Acciones del Comprador */}
              {isPurchase && tx.state === 'PAID_HELD' && (
                  <div className="flex gap-2 mt-1 w-full md:w-auto">
                      <button onClick={() => actions.onRelease(tx.id)} disabled={processingId === tx.id} className="bg-white border-2 border-green-500 hover:bg-green-50 text-green-600 px-4 py-2.5 rounded-xl text-xs font-black shadow-sm transition-colors w-full text-center">
                          ✅ Liberar Rápido
                      </button>
                  </div>
              )}

              {isPurchase && tx.state === 'FUNDS_RELEASED' && !tx.review && (
                  <button onClick={() => actions.onReview(tx.id, tx.product?.title || '')} className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-xl text-xs font-black shadow-sm flex items-center gap-1 transition-transform hover:-translate-y-0.5 mt-1">⭐ Calificar</button>
              )}
              {isPurchase && tx.review && <span className="text-[10px] text-yellow-600 bg-yellow-50 font-black border border-yellow-200 px-2.5 py-1 rounded-md mt-1 uppercase tracking-widest">✅ Calificado</span>}

              {/* Acciones del Vendedor */}
              {!isPurchase && tx.product?.type === 'SERVICIO' && tx.state === 'PENDING' && (
                  <button onClick={() => actions.onPos(tx)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm flex items-center gap-1 transition-transform hover:-translate-y-0.5 mt-1">💲 Link de Cobro</button>
              )}

              {/* Acciones Globales */}
              {canCancel(tx.state) && <button onClick={() => actions.onCancel(tx.id)} disabled={processingId === tx.id} className="text-[11px] text-[#d50000] font-bold hover:underline mt-1 uppercase tracking-wider">Cancelar Operación</button>}
              {canDelete(tx.state) && <button onClick={() => actions.onDelete(tx.id)} disabled={processingId === tx.id} className="text-[11px] text-gray-400 font-bold hover:text-gray-700 mt-1 uppercase tracking-wider">🗑️ Eliminar Historial</button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}