// src/app/dashboard/components/InventoryList.tsx
import React from 'react';

type MyProduct = {
  id: string;
  title: string;
  price: number | string;
  stock: number;
  status: string;
  type: string;
  images: string[];
  createdAt: string;
};

type InventoryListProps = {
  products: MyProduct[];
  processingId: string | null;
  actions: {
    onUpdateStock: (product: MyProduct) => void;
    onToggleStatus: (product: MyProduct) => void;
    onDelete: (id: string) => void;
  };
};

export default function InventoryList({ products, processingId, actions }: InventoryListProps) {
  const getProductStatusBadge = (status: string, stock: number) => {
    if (status === 'DISPONIBLE') return <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700">🟢 Activo</span>;
    if (status === 'PAUSADO') return <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-yellow-100 text-yellow-700">⏸️ Pausado</span>;
    if (status === 'SIN_STOCK' || stock === 0) return <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-700 animate-pulse">⚠️ SIN STOCK</span>;
    return <span className="text-xs text-gray-500">{status}</span>;
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-50 m-4 rounded-2xl border border-dashed border-gray-200">
        <p className="text-6xl mb-4">📦</p>
        <p className="text-gray-500 font-medium">No tienes productos en venta.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {products.map((prod) => (
        <div key={prod.id} className={`flex flex-col md:flex-row gap-4 p-5 rounded-2xl border items-center transition-colors ${prod.status === 'PAUSADO' || prod.stock === 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-gray-100 hover:border-blue-200'}`}>
          <div className="h-14 w-14 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-2xl shrink-0 relative">
            {prod.type === 'PRODUCTO' ? '📦' : '🛠️'}
          </div>
          <div className="grow w-full">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-bold text-gray-900 text-lg">{prod.title}</h3>
              {getProductStatusBadge(prod.status, prod.stock)}
            </div>
            <div className="flex gap-4 text-sm text-gray-500 font-medium">
              <span>Precio: <strong className="text-black">${Number(prod.price).toLocaleString('es-AR')}</strong></span>
              {prod.type === 'PRODUCTO' && (
                <span className={prod.stock === 0 ? "text-[#d50000] font-bold" : ""}>Stock: {prod.stock} u.</span>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-3 md:mt-0 shrink-0">
            {prod.type === 'PRODUCTO' && (
              <button onClick={() => actions.onUpdateStock(prod)} className="px-4 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold border border-gray-200 shadow-sm" disabled={processingId === prod.id}>
                ✏️ Stock
              </button>
            )}
            <button onClick={() => actions.onToggleStatus(prod)} className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm" disabled={processingId === prod.id}>
              {prod.status === 'DISPONIBLE' ? '⏸️ Pausar' : '▶️ Activar'}
            </button>
            <button onClick={() => actions.onDelete(prod.id)} className="px-4 py-2 rounded-xl bg-red-50 text-[#d50000] border border-red-100 hover:bg-red-100 text-xs font-bold transition-colors" disabled={processingId === prod.id}>
              🗑️ Borrar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}