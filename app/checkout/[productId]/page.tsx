// src/app/checkout/[productId]/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import posthog from 'posthog-js';

type CheckoutData = {
  type: 'PRODUCT' | 'TRANSACTION';
  id: string; 
  title: string;
  price: number;
  image?: string;
  sellerName: string;
  storeId?: string; 
};

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  
  const genericId = params?.productId as string;

  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selección del Riel de Pago
  const [gateway, setGateway] = useState<'MERCADO_PAGO' | 'BIND'>('MERCADO_PAGO');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bindResponse, setBindResponse] = useState<any>(null);

  // Estados de Logística
  const [deliveryType, setDeliveryType] = useState<'PICKUP' | 'SHIPPING'>('PICKUP');
  const [shippingAddress, setShippingAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ latitude: number, longitude: number } | null>(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);

  // Bandera para rastrear completitud y evitar falso abandono
  const hasCompletedCheckout = useRef(false);

  useEffect(() => {
    if (!genericId) return;

    const fetchCheckoutData = async () => {
      const token = localStorage.getItem('token');
      try {
        let currentData: CheckoutData | null = null;
        const prodRes = await fetch(`https://mosstall-desa-production.up.railway.app/api/products/${genericId}`);
        if (prodRes.ok) {
          const product = await prodRes.json();
          currentData = {
            type: 'PRODUCT',
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.images[0],
            sellerName: product.creator?.name || product.store?.name || 'Vendedor',
            storeId: product.storeId 
          };
          setCheckoutData(currentData);
        } else if (token) {
            const txRes = await fetch(`https://mosstall-desa-production.up.railway.app/api/transactions/${genericId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (txRes.ok) {
                const tx = await txRes.json();
                if (tx.state !== 'PENDING') throw new Error("Esta transacción ya no está pendiente de pago.");
                
                currentData = {
                    type: 'TRANSACTION',
                    id: tx.id,
                    title: tx.product?.title || 'Acuerdo de Mercado Inverso',
                    price: Number(tx.targetNetAmount || tx.amount),
                    sellerName: 'Acuerdo Privado',
                    storeId: tx.product?.storeId
                };
                setCheckoutData(currentData);
            }
        }

        if (!currentData) throw new Error('No se pudo cargar la información de pago. Verifica el enlace.');

        // DISPARO POSTHOG: Inicio de Checkout
        posthog.capture('checkout_started', {
            product_id: currentData.id,
            product_type: currentData.type,
            price: currentData.price
        });

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCheckoutData();
  }, [genericId]);

  // DISPARO POSTHOG: Abandono de Checkout (si desmonta y no completó)
  useEffect(() => {
      return () => {
          if (checkoutData && !hasCompletedCheckout.current) {
              posthog.capture('checkout_abandoned', {
                  product_id: checkoutData.id,
                  stage_reached: deliveryType === 'SHIPPING' && shippingCost > 0 ? 'shipping_calculated' : 'initial'
              });
          }
      };
  }, [checkoutData, deliveryType, shippingCost]);

  const handleGetLocation = () => {
      if (!navigator.geolocation) {
          setShippingError('Tu navegador no soporta geolocalización.');
          return;
      }
      setIsCalculatingShipping(true);
      setShippingError(null);
      
      navigator.geolocation.getCurrentPosition(
          (position) => {
              const { latitude, longitude } = position.coords;
              setCoordinates({ latitude, longitude });
              setShippingAddress('Ubicación actual obtenida por GPS');
              calculateShippingCost(latitude, longitude);
          },
          (error) => {
              setShippingError('Por favor permite el acceso a tu ubicación para calcular el costo de envío.');
              setIsCalculatingShipping(false);
          },
          { enableHighAccuracy: true }
      );
  };

  const calculateShippingCost = async (lat: number, lng: number) => {
      try {
          const res = await fetch('https://mosstall-desa-production.up.railway.app/api/shipping/calculate-cost', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  storeId: checkoutData?.storeId,
                  destinationCoords: { latitude: lat, longitude: lng }
              })
          });
          const data = await res.json();
          
          if (!res.ok) throw new Error(data.error || 'Error al cotizar el envío.');
          setShippingCost(data.totalShippingCost);

          // DISPARO POSTHOG: Cálculo de envío exitoso
          posthog.capture('shipping_calculated', {
              distance_km: data.distanceKm,
              shipping_cost: data.totalShippingCost,
              destination_lat: lat,
              destination_lng: lng
          });

      } catch (err: any) {
          setShippingError(err.message);
          setShippingCost(0);
      } finally {
          setIsCalculatingShipping(false);
      }
  };

  const handleGatewayChange = (newGateway: 'MERCADO_PAGO' | 'BIND') => {
      setGateway(newGateway);
      // DISPARO POSTHOG: Selección de método de pago
      posthog.capture('payment_method_selected', { method: newGateway });
  };

  const calculateTotal = (basePrice: number, selectedGateway: string) => {
      const subtotal = basePrice + (deliveryType === 'SHIPPING' ? shippingCost : 0);
      if (selectedGateway === 'MERCADO_PAGO') return subtotal / 0.9051;
      return subtotal / 0.95;
  };

  const handleConfirmOrder = async () => {
      const token = localStorage.getItem('token');
      if (!token) return router.push('/login');

      if (deliveryType === 'SHIPPING' && (!coordinates || shippingCost === 0)) {
          setError('Debes obtener tu ubicación para calcular el envío antes de continuar.');
          return;
      }

      setIsProcessing(true);
      setError(null);

      const requestBody = {
          ...(checkoutData?.type === 'PRODUCT' ? { productId: checkoutData.id } : { transactionId: checkoutData?.id }),
          paymentGateway: gateway,
          deliveryType,
          shippingAddress: deliveryType === 'SHIPPING' ? shippingAddress : undefined,
          shippingCoordinates: deliveryType === 'SHIPPING' ? coordinates : undefined,
          shippingCost: deliveryType === 'SHIPPING' ? shippingCost : 0
      };

      try {
          const res = await fetch('https://mosstall-desa-production.up.railway.app/api/transactions', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify(requestBody)
          });

          const data = await res.json();

          if (!res.ok) throw new Error(data.error || 'Error al iniciar el pago.');

          // Marcamos como completado para evitar el evento abandonado
          hasCompletedCheckout.current = true;
          
          // DISPARO POSTHOG: Checkout completado
          posthog.capture('checkout_completed', {
              product_id: checkoutData?.id,
              total_amount: calculateTotal(checkoutData!.price, gateway),
              payment_gateway: gateway,
              delivery_type: deliveryType
          });

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

  const subtotalProducts = checkoutData.price;
  const currentShippingCost = deliveryType === 'SHIPPING' ? shippingCost : 0;
  const totalToPay = calculateTotal(subtotalProducts, gateway);

  return (
    <main className="min-h-screen bg-[#121212] text-gray-100 py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        
        <div className="flex justify-center mb-10">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white tracking-wide">Pago Seguro</h1>
                <p className="text-gray-400 text-sm mt-1 flex items-center justify-center gap-2">
                    <span>🔒</span> Protegido por el Fideicomiso MossTall
                </p>
            </div>
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm text-center animate-in fade-in">
                {error}
            </div>
        )}

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
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                <div className="lg:col-span-7 space-y-8">
                    
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                        <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-3 mb-5">Forma de Entrega</h2>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div 
                                onClick={() => setDeliveryType('PICKUP')}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center ${deliveryType === 'PICKUP' ? 'border-blue-500 bg-blue-900/10' : 'border-gray-700 bg-gray-900 hover:border-gray-600'}`}
                            >
                                <span className="text-2xl mb-2">🏪</span>
                                <h3 className="font-bold text-white text-sm">Retiro en Local</h3>
                                <p className="text-xs text-gray-400 mt-1">Gratis</p>
                            </div>
                            
                            <div 
                                onClick={() => setDeliveryType('SHIPPING')}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center ${deliveryType === 'SHIPPING' ? 'border-blue-500 bg-blue-900/10' : 'border-gray-700 bg-gray-900 hover:border-gray-600'}`}
                            >
                                <span className="text-2xl mb-2">🛵</span>
                                <h3 className="font-bold text-white text-sm">Envío Neo Mandados</h3>
                                <p className="text-xs text-gray-400 mt-1">Cálculo dinámico</p>
                            </div>
                        </div>

                        {deliveryType === 'SHIPPING' && (
                            <div className="animate-in slide-in-from-top-4 duration-300 bg-gray-900 p-5 rounded-xl border border-gray-700 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Dirección de Entrega</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={shippingAddress}
                                            onChange={(e) => setShippingAddress(e.target.value)}
                                            placeholder="Ej: San Lorenzo 1234, Posadas" 
                                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 transition-colors"
                                        />
                                        <button 
                                            type="button"
                                            onClick={handleGetLocation}
                                            className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg flex items-center justify-center transition-colors shrink-0"
                                            title="Usar mi ubicación actual"
                                        >
                                            📍 GPS
                                        </button>
                                    </div>
                                </div>

                                {shippingError && <p className="text-red-400 text-xs font-bold">{shippingError}</p>}

                                {isCalculatingShipping ? (
                                    <div className="flex items-center gap-3 text-blue-400 text-sm font-bold">
                                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                        Calculando tarifa con Neo Mandados...
                                    </div>
                                ) : (
                                    coordinates && (
                                        <div className="flex justify-between items-center bg-blue-900/20 p-3 rounded-lg border border-blue-900/50">
                                            <span className="text-sm text-blue-200">Costo de Envío Estimado:</span>
                                            <span className="text-lg font-bold text-blue-400">${shippingCost.toLocaleString('es-AR')}</span>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                        <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-3 mb-5">Medio de Pago</h2>
                        
                        <div className="space-y-4">
                            <div 
                                onClick={() => handleGatewayChange('BIND')}
                                className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${gateway === 'BIND' ? 'border-blue-500 bg-blue-900/10' : 'border-gray-700 bg-gray-900 hover:border-gray-600'}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-bold text-white flex items-center gap-2">🏦 Transferencia Bancaria</h3>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${gateway === 'BIND' ? 'border-blue-500' : 'border-gray-600'}`}>
                                        {gateway === 'BIND' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400">Paga desde cualquier banco o billetera. Cero costos de pasarela.</p>
                            </div>

                            <div 
                                onClick={() => handleGatewayChange('MERCADO_PAGO')}
                                className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${gateway === 'MERCADO_PAGO' ? 'border-blue-500 bg-blue-900/10' : 'border-gray-700 bg-gray-900 hover:border-gray-600'}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-bold text-white flex items-center gap-2">💳 Tarjeta / Mercado Pago</h3>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${gateway === 'MERCADO_PAGO' ? 'border-blue-500' : 'border-gray-600'}`}>
                                        {gateway === 'MERCADO_PAGO' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400">Aplica recargos de procesamiento (~4.5%).</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-5">
                    <div className="bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-700 shadow-xl sticky top-8">
                        <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-3 mb-6">Resumen de la Orden</h2>
                        
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

                        <div className="space-y-4 mb-6 text-sm">
                            <div className="flex justify-between text-gray-300">
                                <span>Subtotal (Producto)</span>
                                <span>${subtotalProducts.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            
                            {deliveryType === 'SHIPPING' && (
                                <div className="flex justify-between text-blue-300 font-medium">
                                    <span>Envío Neo Mandados</span>
                                    <span>+ ${shippingCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-gray-400">
                                <span>Cargo de Fideicomiso (5%)</span>
                                <span>Incluido</span>
                            </div>
                            
                            {gateway === 'MERCADO_PAGO' && (
                                <div className="flex justify-between text-red-400 border-t border-gray-700/50 pt-3 mt-1 animate-in slide-in-from-top-2">
                                    <span>Cargos Mercado Pago</span>
                                    <span>+ ${(totalToPay - (subtotalProducts + currentShippingCost) / 0.95).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-700 pt-6 mb-8 flex flex-col items-end">
                            <span className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-1">Total a Pagar</span>
                            <span className="text-4xl font-black text-white transition-all">
                                ${totalToPay.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        <button 
                            onClick={handleConfirmOrder}
                            disabled={isProcessing || (deliveryType === 'SHIPPING' && shippingCost === 0)}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-lg shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:shadow-none transition-all active:scale-[0.98]"
                        >
                            {isProcessing ? 'Procesando...' : 'Confirmar y Pagar'}
                        </button>
                    </div>
                </div>

            </div>
        )}

      </div>
    </main>
  );
}