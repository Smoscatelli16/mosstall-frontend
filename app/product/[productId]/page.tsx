// Esta es la página de Detalle de Producto Dinámica
// Se activa con rutas como: /product/abc-123-xyz

"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; // <-- Agregamos useRouter
import Link from 'next/link';

// --- (INICIO) Definición de Tipos ---
type ProductCreator = {
  name: string | null;
};

type ListingType = 'PRODUCTO' | 'SERVICIO' | 'INFOPRODUCTO';

// Tipo para las preguntas
type Question = {
  id: string;
  content: string;
  askerId: string; 
  answer?: string | null;
  createdAt: string;
  answeredAt?: string | null;
  asker: { name: string | null };
};

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[]; 
  createdAt: string;
  creator: ProductCreator;
  creatorId: string; 
  status: string;
  type: ListingType;
  condition?: 'NUEVO' | 'USADO' | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  mileage?: number | null;
  stock: number;
  questions: Question[]; 
};

type TransactionResponse = {
  id: string;
  paymentUrl?: string | null; // Puede ser null si es servicio
  error?: string;
  message?: string;
};
// --- (FIN) Definición de Tipos ---

// Helper para obtener ID del usuario desde el token
const getUserIdFromToken = () => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
    } catch (e) {
        return null;
    }
};

export default function ProductDetailPage() {
  const router = useRouter(); // <-- Hook de navegación
  
  // --- Estados ---
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Estado para la galería
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); 

  // --- Estados para el Zoom (Lupa) ---
  const [isHovering, setIsHovering] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });

  // Estados de Compra
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // --- NUEVO: Estados de Preguntas (Q&A) ---
  const [newQuestion, setNewQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // --- Hooks ---
  const params = useParams();
  const productId = params.id as string || params.productId as string; // Ajuste para capturar ID correctamente

  // --- Fetch de Datos ---
  useEffect(() => {
    setCurrentUserId(getUserIdFromToken());

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
          
          if (data.images && data.images.length > 0) {
            setSelectedImage(data.images[0]);
          }

        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchProduct();
    }
  }, [productId]);


  // --- FUNCIONES DE NAVEGACIÓN DE IMÁGENES ---
  
  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation(); 
    if (!product || !product.images.length || !selectedImage) return;

    const currentIndex = product.images.indexOf(selectedImage);
    const nextIndex = (currentIndex + 1) % product.images.length;
    setSelectedImage(product.images[nextIndex]);
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!product || !product.images.length || !selectedImage) return;

    const currentIndex = product.images.indexOf(selectedImage);
    const prevIndex = (currentIndex - 1 + product.images.length) % product.images.length;
    setSelectedImage(product.images[prevIndex]);
  };

  // --- Lógica del Zoom ---
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setCursorPos({ x, y });
  };


  // --- Manejador de Compra (Productos) ---
  const handlePurchase = async () => {
    if (isPurchasing || isRedirecting) return;

    const confirmed = window.confirm(`¿Estás seguro de que quieres iniciar la compra de "${product?.title}"?\n\nSerás redirigido a Mercado Pago para completar el pago de forma segura.`);
    if (!confirmed) return; 

    setIsPurchasing(true);
    setPurchaseMessage('Procesando solicitud...');

    const token = localStorage.getItem('token');
    if (!token) {
      setPurchaseMessage('Error: Debes iniciar sesión para comprar.');
      setIsPurchasing(false);
      return;
    }

    try {
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
        setPurchaseMessage(`Orden creada. Redirigiendo a Mercado Pago...`);
        setIsRedirecting(true);
        if (product) setProduct({ ...product, status: 'PENDIENTE' });
        window.location.href = data.paymentUrl;
      } else {
        setPurchaseMessage(`Error: ${data.error || 'No se recibió el link de pago.'}`);
        setIsPurchasing(false);
      }

    } catch (err) {
      console.error(err);
      setPurchaseMessage('Error crítico: No se pudo conectar con el servidor.');
      setIsPurchasing(false);
    }
  };

  // --- Manejador de Contratación (Servicios) - ACTUALIZADO ---
  const handleContact = async () => {
    // 1. Validar Sesión
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Debes iniciar sesión para contratar un servicio.");
        router.push('/login');
        return;
    }

    // 2. Confirmación
    if (!window.confirm(`¿Confirmar solicitud de servicio?\n\nEl pago se coordinará con el profesional al finalizar el trabajo (pago contra entrega o QR).`)) return;

    setIsPurchasing(true);
    setPurchaseMessage('Enviando solicitud de trabajo...');

    try {
        // 3. Llamada al Backend
        const response = await fetch('http://localhost:3001/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId: productId })
        });

        const data: TransactionResponse = await response.json();

        if (response.ok) {
            // 4. Éxito: Servicio Contratado
            setPurchaseMessage('✅ ¡Solicitud enviada con éxito! Redirigiendo a tu panel...');
            setIsRedirecting(true);
            
            // Redirigir al Dashboard después de 1.5 seg
            setTimeout(() => {
                router.push('/dashboard');
            }, 1500);

        } else {
            setPurchaseMessage(`Error: ${data.error || 'Error al contratar.'}`);
            setIsPurchasing(false);
        }

    } catch (err) {
        console.error(err);
        setPurchaseMessage('Error de conexión.');
        setIsPurchasing(false);
    }
  };

  // --- FUNCIONES Q&A ---

  // 1. Enviar Pregunta
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Debes iniciar sesión para preguntar.");
        return;
    }

    setIsAsking(true);
    try {
        const res = await fetch('http://localhost:3001/api/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ productId, content: newQuestion })
        });
        
        if (res.ok) {
            window.location.reload(); 
        } else {
            const data = await res.json();
            alert(data.error || "Error al preguntar");
        }
    } catch (err) {
        console.error(err);
        alert("Error de conexión");
    } finally {
        setIsAsking(false);
    }
  };

  // 2. Responder Pregunta
  const handleReplyQuestion = async (questionId: string) => {
    if (!replyContent.trim()) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`http://localhost:3001/api/questions/${questionId}/answer`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ answer: replyContent })
        });

        if (res.ok) {
            window.location.reload();
        } else {
            alert("Error al responder");
        }
    } catch (err) {
        console.error(err);
        alert("Error de conexión");
    }
  };

  // 3. Eliminar Pregunta (Solo Asker o Owner)
  const handleDeleteQuestion = async (questionId: string) => {
    const confirm = window.confirm("¿Seguro que quieres eliminar esta pregunta? Esta acción no se puede deshacer.");
    if (!confirm) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`http://localhost:3001/api/questions/${questionId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            window.location.reload();
        } else {
            alert("Error al eliminar");
        }
    } catch (err) {
        console.error(err);
        alert("Error de conexión");
    }
  };

  // 4. Eliminar Respuesta (Solo Owner)
  const handleDeleteAnswer = async (questionId: string) => {
    const confirm = window.confirm("¿Quieres eliminar tu respuesta? La pregunta quedará abierta.");
    if (!confirm) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`http://localhost:3001/api/questions/${questionId}/answer`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            window.location.reload();
        } else {
            alert("Error al eliminar respuesta");
        }
    } catch (err) {
        console.error(err);
        alert("Error de conexión");
    }
  };


  // --- Renderizado Condicional ---

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-gray-900 text-white"><p className="text-2xl text-gray-400 animate-pulse">Cargando...</p></main>;
  if (error) return <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white gap-4"><p className="text-2xl text-red-500">Error: {error}</p><Link href="/" className="font-medium text-blue-500 hover:underline">&larr; Volver al inicio</Link></main>;
  if (!product) return <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white gap-4"><p className="text-2xl text-yellow-400">Producto no encontrado.</p><Link href="/" className="font-medium text-blue-500 hover:underline">&larr; Volver al inicio</Link></main>;

  const showPrice = product.price > 0;
  const isService = product.type === 'SERVICIO';
  let priceDisplay = showPrice ? `$${product.price.toLocaleString('es-AR')}` : isService ? "A Cotizar" : "GRATIS";
  const canBuyDirectly = (product.type === 'PRODUCTO' || product.type === 'INFOPRODUCTO') && product.price > 0;
  const hasSpecs = product.brand || product.model || product.year || (product.mileage !== null && product.mileage !== undefined);
  const hasMultipleImages = product.images && product.images.length > 1;
  const isOwner = currentUserId === product.creatorId; 

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="container mx-auto max-w-4xl">
        
        <Link href="/" className="text-blue-400 hover:underline mb-6 block w-fit">
          &larr; Volver a la vidriera
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative"> 
          
          {/* --- COLUMNA DE IMAGEN (GALERÍA) --- */}
          <div className="flex flex-col gap-4 relative z-20"> 
              
             {/* Imagen Principal Interactiva con Zoom Lateral */}
             <div 
                className={`w-full h-96 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700 relative group cursor-crosshair`}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onMouseMove={handleMouseMove}
                onClick={() => selectedImage && setIsModalOpen(true)}
             >
                
                {selectedImage ? (
                    <>
                        <img 
                            src={selectedImage} 
                            alt={product.title} 
                            className="w-full h-full object-contain bg-black"
                        />

                        {/* Panel de Zoom */}
                        {isHovering && (
                          <div 
                            className="hidden md:block absolute left-[105%] top-0 w-[120%] h-full bg-gray-900 border border-gray-600 rounded-lg shadow-2xl z-50 overflow-hidden"
                            style={{
                                backgroundImage: `url(${selectedImage})`,
                                backgroundPosition: `${cursorPos.x}% ${cursorPos.y}%`,
                                backgroundSize: '250%', 
                                pointerEvents: 'none' 
                            }}
                          >
                             <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">
                                Zoom 2.5x
                             </div>
                          </div>
                        )}
                        
                        {/* Flechas */}
                        {hasMultipleImages && (
                            <>
                                <button onClick={handlePrevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10">❮</button>
                                <button onClick={handleNextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10">❯</button>
                            </>
                        )}
                    </>
                ) : (
                    <div className="text-center">
                        <div className="text-6xl mb-2">{product.type === 'SERVICIO' ? '🛠️' : product.type === 'INFOPRODUCTO' ? '📂' : '📦'}</div>
                        <span className="text-gray-500 text-sm">Imagen de la publicación</span>
                    </div>
                )}
             </div>

             {/* Miniaturas */}
             {hasMultipleImages && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {product.images.map((img, idx) => (
                        <button 
                            key={idx}
                            onClick={() => setSelectedImage(img)}
                            className={`w-20 h-20 rounded-md overflow-hidden border-2 transition-all shrink-0 ${selectedImage === img ? 'border-blue-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                            <img src={img} alt={`Vista ${idx}`} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
             )}
          </div>

          {/* --- COLUMNA DE DETALLES --- */}
          <div className="flex flex-col justify-between rounded-lg bg-gray-800 p-6 shadow-lg border border-gray-700 relative z-10">
            <div>
              <div className="flex flex-wrap gap-2 items-center mb-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${product.status === 'DISPONIBLE' ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-yellow-900/30 text-yellow-400 border-yellow-800'}`}>
                  {product.status}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-gray-600 text-gray-400 uppercase tracking-wider">
                    {product.type}
                </span>
                {product.condition && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white bg-blue-900 border border-blue-700">
                        {product.condition}
                    </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-white mb-2 leading-tight">{product.title}</h1>
              
              {/* --- ENLACE AL PERFIL DEL VENDEDOR (MODIFICACIÓN) --- */}
              <span className="text-sm text-gray-400 mb-6 block border-b border-gray-700 pb-4">
                Vendido por: 
                <Link 
                    href={`/profile/${product.creatorId}`} 
                    className="font-medium text-white hover:text-blue-400 hover:underline ml-1 transition-colors"
                >
                    {product.creator.name || 'Anónimo'}
                </Link>
              </span>

              {hasSpecs && (
                <div className="bg-gray-700/30 rounded-lg p-4 mb-6 border border-gray-700">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Ficha Técnica</h3>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                        {product.brand && <><span className="text-gray-500">Marca:</span><span className="text-white font-medium text-right">{product.brand}</span></>}
                        {product.model && <><span className="text-gray-500">Modelo:</span><span className="text-white font-medium text-right">{product.model}</span></>}
                        {product.year && <><span className="text-gray-500">Año:</span><span className="text-white font-medium text-right">{product.year}</span></>}
                        {product.mileage !== null && <><span className="text-gray-500">Kilómetros:</span><span className="text-white font-medium text-right">{product.mileage} km</span></>}
                    </div>
                </div>
              )}
              
              <p className="text-gray-300 text-base leading-relaxed mb-8 whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
            
            <div className="mt-auto">
              <span className={`text-4xl font-extrabold mb-6 block ${showPrice ? 'text-blue-400' : 'text-green-400'}`}>
                {priceDisplay}
              </span>

              {/* Botonera */}
              {product.status === 'DISPONIBLE' && (
                <>
                    {canBuyDirectly ? (
                        <button onClick={handlePurchase} disabled={isPurchasing || isRedirecting} className={`w-full rounded-lg px-5 py-4 text-center text-lg font-bold text-white transition-all transform hover:scale-[1.02] ${isRedirecting ? 'bg-blue-600 cursor-wait animate-pulse' : isPurchasing ? 'bg-gray-600 cursor-wait' : 'bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/50'}`}>
                          {isRedirecting ? 'Redirigiendo...' : isPurchasing ? 'Procesando...' : 'Comprar'}
                        </button>
                    ) : (
                        <button onClick={handleContact} disabled={isPurchasing || isRedirecting} className={`w-full rounded-lg px-5 py-4 text-center text-lg font-bold text-white transition-all transform hover:scale-[1.02] ${isRedirecting ? 'bg-green-600 cursor-wait animate-pulse' : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/50'}`}>
                          {isRedirecting ? 'Enviando solicitud...' : 'Contratar Servicio'}
                        </button>
                    )}
                </>
              )}
              {product.status === 'PENDIENTE' && <button disabled className="w-full rounded-lg bg-yellow-700/50 border border-yellow-600 px-5 py-4 text-center text-lg font-medium text-yellow-200 opacity-70 cursor-not-allowed">⚠️ Reservado - En Proceso</button>}
              {(product.status !== 'DISPONIBLE' && product.status !== 'PENDIENTE') && <button disabled className="w-full rounded-lg bg-red-900/50 border border-red-800 px-5 py-4 text-center text-lg font-medium text-red-200 opacity-70 cursor-not-allowed">No Disponible</button>}
              
              {purchaseMessage && <div className={`mt-4 p-3 rounded-md text-center text-sm font-medium ${purchaseMessage.includes('Error') ? 'bg-red-900/30 text-red-300' : 'bg-blue-900/30 text-blue-300'}`}>{purchaseMessage}</div>}
            </div>
          </div>
        </div>

        {/* --- SECCIÓN DE PREGUNTAS Y RESPUESTAS --- */}
        <div className="mt-12 border-t border-gray-800 pt-8">
            <h2 className="text-2xl font-bold mb-6 text-white">Preguntas y respuestas</h2>

            {/* Formulario de Pregunta */}
            {!isOwner && (
                <form onSubmit={handleAskQuestion} className="mb-10">
                    <h3 className="text-lg font-semibold mb-2 text-gray-300">Preguntale al vendedor</h3>
                    <div className="flex gap-4">
                        <input 
                            type="text" 
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            placeholder="Escribe tu pregunta..." 
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button 
                            type="submit" 
                            disabled={isAsking || !newQuestion.trim()}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isAsking ? 'Enviando...' : 'Preguntar'}
                        </button>
                    </div>
                </form>
            )}

            {/* Listado de Preguntas */}
            <div className="space-y-6">
                {product.questions && product.questions.length > 0 ? (
                    product.questions.map((q) => (
                        <div key={q.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 relative group/question">
                            
                            {(isOwner || currentUserId === q.askerId) && (
                                <button onClick={() => handleDeleteQuestion(q.id)} className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-xs uppercase font-bold tracking-wider opacity-0 group-hover/question:opacity-100 transition-opacity">Eliminar</button>
                            )}

                            <div className="flex items-start gap-3 mb-2">
                                <span className="text-gray-500 mt-1">💬</span>
                                <div>
                                    <p className="text-white font-medium">{q.content}</p>
                                    <span className="text-xs text-gray-500">{new Date(q.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {q.answer ? (
                                <div className="flex items-start gap-3 ml-8 mt-3 pl-4 border-l-2 border-gray-600 group/answer relative">
                                    <span className="text-gray-400 mt-1">↳</span>
                                    <div>
                                        <p className="text-gray-300">{q.answer}</p>
                                        <span className="text-xs text-gray-500">{q.answeredAt ? new Date(q.answeredAt).toLocaleDateString() : ''}</span>
                                    </div>
                                    {isOwner && (
                                        <button onClick={() => handleDeleteAnswer(q.id)} className="absolute top-0 right-0 text-gray-600 hover:text-red-400 text-[10px] uppercase font-bold opacity-0 group-hover/answer:opacity-100 transition-opacity">Eliminar respuesta</button>
                                    )}
                                </div>
                            ) : (
                                isOwner && (
                                    <div className="ml-8 mt-3 pl-4 border-l-2 border-yellow-600/50">
                                        {replyingTo === q.id ? (
                                            <div className="flex gap-2">
                                                <input autoFocus type="text" value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Escribe tu respuesta..." className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white" />
                                                <button onClick={() => handleReplyQuestion(q.id)} className="bg-blue-600 px-4 py-2 rounded text-sm font-bold hover:bg-blue-500">Enviar</button>
                                                <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-white px-2 text-sm">Cancelar</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => { setReplyingTo(q.id); setReplyContent(''); }} className="text-blue-400 text-sm hover:underline font-medium">Responder</button>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 italic">Nadie ha preguntado todavía. ¡Sé el primero!</p>
                )}
            </div>
        </div>

        {/* --- LIGHTBOX --- */}
        {isModalOpen && selectedImage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
                <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 text-white text-4xl hover:text-gray-300 z-50">&times;</button>
                <img src={selectedImage} alt="Zoom" className="max-w-full max-h-screen object-contain p-4" onClick={(e) => e.stopPropagation()} />
                {hasMultipleImages && (
                    <>
                        <button onClick={handlePrevImage} className="absolute left-5 top-1/2 -translate-y-1/2 text-white text-6xl hover:text-gray-300 p-4">❮</button>
                        <button onClick={handleNextImage} className="absolute right-5 top-1/2 -translate-y-1/2 text-white text-6xl hover:text-gray-300 p-4">❯</button>
                    </>
                )}
                {hasMultipleImages && (
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded-full text-sm">{product.images.indexOf(selectedImage) + 1} / {product.images.length}</div>
                )}
            </div>
        )}

      </div>
    </main>
  );
}