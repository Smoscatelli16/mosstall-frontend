// src/app/checkout/[productId]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

type CheckoutData = {
  type: 'PRODUCT' | 'TRANSACTION';
  id: string; // Puede ser el ID del Producto o de la Transacción
  title: string;
  price: number;
  image?: string;
  sellerName: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  
  // Como tu carpeta se llama [productId], extraemos productId de la URL
  const genericId = params?.productId as string;

  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selección del Riel de Pago
  const [gateway, setGateway] = useState<'MERCADO_PAGO' | 'BIND'>('MERCADO_PAGO');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bindResponse, setBindResponse] = useState<any>(null);

  useEffect(() => {
    // BLOQUEO DE SEGURIDAD: Evitamos que haga fetch si Next.js aún no leyó la URL
    if (!genericId) return;

    const fetchCheckoutData = async () => {
      const token = localStorage.getItem('token');
      try {
        // Intento 1: Buscar como Producto
        const prodRes = await fetch(`http://localhost:3001/api/products/${genericId}`);
        if (prodRes.ok) {
          const product = await prodRes.json();
          setCheckoutData({
            type: 'PRODUCT',
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.images[0],
            sellerName: product.creator?.name || 'Vendedor'
          });
          return;
        }

        // Intento 2: Buscar como Transacción (Para el Mercado Inverso)
        if (token) {
            const txRes = await fetch(`http://localhost:3001/api/transactions/${genericId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (txRes.ok) {
                const tx = await txRes.json();
                if (tx.state !== 'PENDING') throw new Error("Esta transacción ya no está pendiente de pago.");
                
                setCheckoutData({
                    type: 'TRANSACTION',
                    id: tx.id,
                    title: tx.product?.title || 'Acuerdo de Mercado Inverso',
                    price: Number(tx.targetNetAmount || tx.amount),
                    sellerName: 'Acuerdo Privado'
                });
                return;
            }
        }

        throw new Error('No se pudo cargar la información de pago. Verifica el enlace.');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCheckoutData();
  }, [genericId]);

  // Target = Price. MP Divisor: ~0.9051. BIND Divisor: 0.95
  const calculateTotal = (basePrice: number, selectedGateway: string) => {
      if (selectedGateway === 'MERCADO_PAGO') return basePrice / 0.9051;
      return basePrice / 0.95;
  };

  const handleConfirmOrder = async () => {
      const token = localStorage.getItem('token');
      if (!token) return router.push('/login');

      setIsProcessing(true);
      setError(null);

      // Determinamos el body correcto dependiendo de si es compra nueva o pago de Mercado Inverso
      const requestBody = checkoutData?.type === 'PRODUCT' 
        ? { productId: checkoutData.id, paymentGateway: gateway }
        : { transactionId: checkoutData?.id, paymentGateway: gateway };

      try {
          const res = await fetch('http://localhost:3001/api/transactions', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify(requestBody)
          });

          const data = await res.json();

          if (!res.ok) throw new Error(data.error || 'Error al iniciar el pago.');

          if (gateway === 'MERCADO_PAGO' && data.paymentUrl) {
              window.location.href = data.paymentUrl;
          } else if (gateway === 'BIND' && data.bindData) {
              setBindResponse(data.bindData); 
          } else {
              throw new Error("Respuesta inválida del servidor.");
          }

      } catch (err: any) {
          setError(err.message);
          setIsProcessing(false);
      }
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><p className="text-white animate-pulse">Cargando Checkout Seguro...</p></div>;
  if (error && !checkoutData) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><p className="text-red-400 font-bold">{error}</p></div>;
  if (!checkoutData) return null;

  const totalToPay = calculateTotal(checkoutData.price, gateway);

  return (
    <main className="min-h-screen bg-[#121212] text-gray-100 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        
        {/* Cabecera Segura */}
        <div className="flex justify-center mb-10">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white tracking-wide">Pago Seguro</h1>
                <p className="text-gray-400 text-sm mt-1 flex items-center justify-center gap-2">
                    <span>🔒</span> Protegido por el Fideicomiso MossTall
                </p>
            </div>
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm text-center">
                {error}
            </div>
        )}

        {/* Vista BIND: Instrucciones de Transferencia */}
        {bindResponse ? (
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl max-w-xl mx-auto text-center animate-in fade-in zoom-in">
                <span className="text-5xl mb-4 block">🏦</span>
                <h2 className="text-2xl font-bold text-white mb-2">Transfiere con tu banco</h2>
                <p className="text-gray-400 text-sm mb-8">Escanea el código o copia el CVU para transferir exactamente el monto indicado.</p>
                
                <div className="bg-white p-4 rounded-xl inline-block mb-6 shadow-inner">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${bindResponse.cbu}`} alt="QR Code" className="w-48 h-48" />
                </div>

                <div className="bg-gray-900 rounded-xl p-6 text-left border border-gray-700 mb-8 space-y-4">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Monto a transferir</p>
                        <p className="text-2xl font-bold text-green-400">${bindResponse.amountToPay.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">CBU / CVU Fideicomiso</p>
                        <p className="font-mono text-gray-200 text-lg tracking-widest bg-gray-800 p-2 rounded mt-1 select-all">{bindResponse.cbu}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Alias</p>
                        <p className="text-gray-200 font-bold">{bindResponse.alias}</p>
                    </div>
                </div>

                <button 
                    onClick={() => router.push('/dashboard')}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-colors shadow-lg"
                >
                    Ya realicé la transferencia
                </button>
                <p className="text-xs text-gray-500 mt-4">La transacción se aprobará automáticamente al detectar los fondos.</p>
            </div>
        ) : (
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Columna Izquierda: Selección de Pago */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white border-b border-gray-800 pb-3">¿Cómo quieres pagar?</h2>
                    
                    {/* Opción BIND */}
                    <div 
                        onClick={() => setGateway('BIND')}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${gateway === 'BIND' ? 'border-blue-500 bg-blue-900/10' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                🏦 Transferencia Bancaria
                            </h3>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${gateway === 'BIND' ? 'border-blue-500' : 'border-gray-600'}`}>
                                {gateway === 'BIND' && <div className="w-3 h-3 bg-blue-500 rounded-full" />}
                            </div>
                        </div>
                        <p className="text-sm text-gray-400">Paga desde cualquier banco o billetera (Cuenta DNI, BNA+, Ualá). Cero costos adicionales de pasarela.</p>
                    </div>

                    {/* Opción Mercado Pago */}
                    <div 
                        onClick={() => setGateway('MERCADO_PAGO')}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${gateway === 'MERCADO_PAGO' ? 'border-blue-500 bg-blue-900/10' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                💳 Tarjeta / Mercado Pago
                            </h3>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${gateway === 'MERCADO_PAGO' ? 'border-blue-500' : 'border-gray-600'}`}>
                                {gateway === 'MERCADO_PAGO' && <div className="w-3 h-3 bg-blue-500 rounded-full" />}
                            </div>
                        </div>
                        <p className="text-sm text-gray-400">Aplica recargos y comisiones de procesamiento de Mercado Pago (~4.5%).</p>
                    </div>
                </div>

                {/* Columna Derecha: Resumen de Orden */}
                <div>
                    <div className="bg-gray-800 rounded-xl p-6 md:p-8 border border-gray-700 shadow-xl sticky top-8">
                        <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-3 mb-6">Resumen de la Orden</h2>
                        
                        {/* Producto / Acuerdo */}
                        <div className="flex gap-4 mb-6 items-center">
                            <div className="w-16 h-16 bg-gray-900 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                                {checkoutData.image ? (
                                    <img src={checkoutData.image} alt="Producto" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl">🤝</span>
                                )}
                            </div>
                            <div className="flex flex-col justify-center">
                                <h3 className="font-bold text-white text-sm line-clamp-2">{checkoutData.title}</h3>
                                {checkoutData.type === 'PRODUCT' ? (
                                    <p className="text-xs text-gray-400 mt-1">Vendido por {checkoutData.sellerName}</p>
                                ) : (
                                    <span className="mt-1 px-2 py-0.5 bg-purple-900/50 text-purple-300 text-[10px] rounded uppercase font-bold inline-block w-fit">Mercado Inverso</span>
                                )}
                            </div>
                        </div>

                        {/* Desglose Matemático */}
                        <div className="space-y-4 mb-6 text-sm">
                            <div className="flex justify-between text-gray-300">
                                <span>Precio Acordado</span>
                                <span>${checkoutData.price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                                <span>Cargo de Fideicomiso (5%)</span>
                                <span>Incluido</span>
                            </div>
                            
                            {gateway === 'MERCADO_PAGO' && (
                                <div className="flex justify-between text-red-400 border-t border-gray-700/50 pt-2 animate-in slide-in-from-top-2">
                                    <span>Cargos Mercado Pago</span>
                                    <span>+ ${(totalToPay - (checkoutData.price / 0.95)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-700 pt-6 mb-8 flex justify-between items-end">
                            <span className="text-gray-400 font-bold uppercase tracking-wider text-sm">Total a Pagar</span>
                            <span className="text-3xl font-bold text-white transition-all">
                                ${totalToPay.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        <button 
                            onClick={handleConfirmOrder}
                            disabled={isProcessing}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-lg shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all active:scale-[0.98]"
                        >
                            {isProcessing ? 'Procesando Seguridad...' : 'Confirmar y Pagar'}
                        </button>
                    </div>
                </div>

            </div>
        )}

      </div>
    </main>
  );
}