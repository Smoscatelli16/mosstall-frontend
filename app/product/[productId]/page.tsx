// Esta es la página de Detalle de Producto Dinámica
// Se activa con rutas como: /product/abc-123-xyz

"use client";

// Importamos los "hooks" de React y "hooks" de Next.js
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // <-- ¡Este es el hook para leer la URL!
import Link from 'next/link';

// --- (INICIO) Definición de Tipos ---
type ProductCreator = {
  name: string | null;
};

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  createdAt: string;
  creator: ProductCreator;
  status: string;
};

// Definimos el tipo de respuesta esperada al crear una transacción
type TransactionResponse = {
  id: string;
  paymentUrl?: string; // El backend nos debe enviar esto
  error?: string;
};
// --- (FIN) Definición de Tipos ---


// --- (INICIO) Componente de la Página de Detalle ---
export default function ProductDetailPage() {
  
  // --- Estados ---
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de Compra
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false); // Para bloquear el botón durante la petición
  const [isRedirecting, setIsRedirecting] = useState(false); // Para indicar que estamos yendo a MP

  // --- Hooks ---
  const params = useParams();
  const productId = params.productId as string;

  // --- Hook de Efecto para buscar datos ---
  useEffect(() => {
    if (productId) {
      const fetchProduct = async () => {
        try {
          setLoading(true);
          setError(null);
          setPurchaseMessage('');

          const response = await fetch(`http://localhost:3001/api/products/${productId}`);

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'No se pudo encontrar el producto.');
          }

          const data: Product = await response.json();
          setProduct(data);

        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchProduct();
    }
  }, [productId]);


  // --- (MODIFICADO) Manejador para Iniciar la Compra ---
  const handlePurchase = async () => {
    if (isPurchasing || isRedirecting) return; // Evitar doble clic

    setIsPurchasing(true);
    setPurchaseMessage('Procesando solicitud de compra...');

    // 1. Buscar el token
    const token = localStorage.getItem('token');
    if (!token) {
      setPurchaseMessage('Error: Debes iniciar sesión para comprar.');
      setIsPurchasing(false);
      return;
    }

    try {
      // 2. Llamar al backend para crear la transacción
      const response = await fetch('http://localhost:3001/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId: productId })
      });

      const data: TransactionResponse = await response.json();

      if (response.ok && data.paymentUrl) {
        // 3. ¡Éxito! Iniciamos redirección
        setPurchaseMessage(`Orden creada. Redirigiendo a Mercado Pago...`);
        setIsRedirecting(true); // Bloqueamos UI permanentemente hasta que cambie de página
        
        // Actualizamos estado local visualmente (opcional, ya que nos vamos de la página)
        if (product) {
          setProduct({ ...product, status: 'PENDIENTE' });
        }
        
        // 4. REDIRECCIÓN EXTERNA
        window.location.href = data.paymentUrl;
        
      } else {
        // Error controlado desde el backend
        setPurchaseMessage(`Error: ${data.error || 'No se recibió el link de pago.'}`);
        setIsPurchasing(false);
      }

    } catch (err) {
      console.error(err);
      setPurchaseMessage('Error crítico: No se pudo conectar con el servidor.');
      setIsPurchasing(false);
    }
  };


  // --- Renderizado Condicional ---

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p className="text-2xl text-gray-400 animate-pulse">Cargando producto...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white gap-4">
        <p className="text-2xl text-red-500">Error: {error}</p>
        <Link href="/" className="font-medium text-blue-500 hover:underline">
          &larr; Volver al inicio
        </Link>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white gap-4">
        <p className="text-2xl text-yellow-400">Producto no encontrado.</p>
        <Link href="/" className="font-medium text-blue-500 hover:underline">
          &larr; Volver al inicio
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="container mx-auto max-w-4xl">
        
        <Link href="/" className="text-blue-400 hover:underline mb-6 block w-fit">
          &larr; Volver a la vidriera
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Columna de Imagen */}
          <div className="w-full h-96 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700">
             {/* Placeholder visual mejorado */}
             <div className="text-center">
                <div className="text-6xl mb-2">📦</div>
                <span className="text-gray-500 text-sm">Imagen del producto</span>
             </div>
          </div>

          {/* Columna de Detalles */}
          <div className="flex flex-col justify-between rounded-lg bg-gray-800 p-6 shadow-lg border border-gray-700">
            <div>
              <div className="flex justify-between items-start">
                <h1 className="text-3xl font-bold mb-2 text-white">{product.title}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  product.status === 'DISPONIBLE' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                }`}>
                  {product.status}
                </span>
              </div>
              
              <span className="text-sm text-gray-400 mb-6 block border-b border-gray-700 pb-4">
                Vendido por: <span className="font-medium text-gray-200">{product.creator.name || 'Anónimo'}</span>
              </span>
              
              <p className="text-gray-300 text-base leading-relaxed mb-8">
                {product.description}
              </p>
            </div>
            
            <div className="mt-auto">
              <span className="text-4xl font-extrabold text-blue-400 mb-6 block">
                ${product.price.toLocaleString('es-AR')}
              </span>

              {/* Lógica de Botones */}
              {product.status === 'DISPONIBLE' && (
                <button 
                  onClick={handlePurchase}
                  disabled={isPurchasing || isRedirecting}
                  className={`w-full rounded-lg px-5 py-4 text-center text-lg font-bold text-white transition-all transform hover:scale-[1.02]
                    ${isRedirecting 
                      ? 'bg-blue-600 cursor-wait animate-pulse' 
                      : isPurchasing 
                        ? 'bg-gray-600 cursor-wait' 
                        : 'bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/50'
                    }`}
                >
                  {isRedirecting ? 'Redirigiendo a Mercado Pago...' : isPurchasing ? 'Procesando...' : 'Comprar Ahora con Garantía'}
                </button>
              )}

              {product.status === 'PENDIENTE' && (
                <button 
                  disabled 
                  className="w-full rounded-lg bg-yellow-700/50 border border-yellow-600 px-5 py-4 text-center text-lg font-medium text-yellow-200 opacity-70 cursor-not-allowed"
                >
                  ⚠️ Reservado - Compra en Proceso
                </button>
              )}

              {(product.status !== 'DISPONIBLE' && product.status !== 'PENDIENTE') && (
                <button 
                  disabled 
                  className="w-full rounded-lg bg-red-900/50 border border-red-800 px-5 py-4 text-center text-lg font-medium text-red-200 opacity-70 cursor-not-allowed"
                >
                  No Disponible
                </button>
              )}

              {/* Mensaje de Feedback */}
              {purchaseMessage && (
                <div className={`mt-4 p-3 rounded-md text-center text-sm font-medium ${
                   purchaseMessage.includes('Error') ? 'bg-red-900/30 text-red-300' : 'bg-blue-900/30 text-blue-300'
                }`}>
                  {purchaseMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}