// src/app/product/[productId]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// --- (INICIO) Definición de Tipos ---
type StoreOwner = {
  id: string;
  name: string | null;
  email: string;
};

type StoreInfo = {
  id: string;
  name: string;
  type: string;
  ratingAverage: number;
  totalReviews: number;
  totalSales: number;
  owner: StoreOwner;
  ownerId: string;
};

type ListingType = 'PRODUCTO' | 'SERVICIO' | 'INFOPRODUCTO';

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
  store: StoreInfo;
  storeId: string; 
  status: string;
  type: ListingType;
  condition?: 'NUEVO' | 'USADO' | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  mileage?: number | null;
  stock: number;
  questions: Question[]; 
  category?: { name: string }; 
  suggestedCategory?: string | null; 
};

type TransactionResponse = {
  id: string;
  paymentUrl?: string | null;
  error?: string;
  message?: string;
};
// --- (FIN) Definición de Tipos ---

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
  const router = useRouter();
  
  // --- Estados ---
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Galería
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); 

  // Zoom
  const [isHovering, setIsHovering] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });

  // Compra
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Q&A
  const [newQuestion, setNewQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const params = useParams();
  const productId = params.id as string || params.productId as string;

  // --- Fetch de Datos ---
  useEffect(() => {
    setCurrentUserId(getUserIdFromToken());

    if (productId) {
      const fetchProduct = async () => {
        try {
          setLoading(true);
          setError(null);
          setPurchaseMessage('');

          const response = await fetch(`http://mosstall-desa-production.up.railway.app/api/products/${productId}`);

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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setCursorPos({ x, y });
  };

  // --- Manejadores de Compra y Contacto ---
  const handlePurchase = async () => {
    if (isPurchasing || isRedirecting) return;
    const confirmed = window.confirm(`¿Estás seguro de que quieres iniciar la compra de "${product?.title}"?`);
    if (!confirmed) return; 

    const token = localStorage.getItem('token');
    if (!token) {
      setPurchaseMessage('Error: Debes iniciar sesión para comprar.');
      return;
    }

    setIsRedirecting(true);
    setPurchaseMessage('Redirigiendo al checkout seguro...');
    router.push(`/checkout/${productId}`);
  };

  const handleContact = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Debes iniciar sesión para contratar un servicio.");
        router.push('/login');
        return;
    }
    if (!window.confirm(`¿Confirmar solicitud de servicio?`)) return;

    setIsPurchasing(true);
    setPurchaseMessage('Enviando solicitud de trabajo...');

    try {
        const response = await fetch('http://mosstall-desa-production.up.railway.app/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ productId: productId })
        });
        const data: TransactionResponse = await response.json();

        if (response.ok) {
            setPurchaseMessage('✅ ¡Solicitud enviada con éxito! Redirigiendo a tu panel...');
            setIsRedirecting(true);
            setTimeout(() => { router.push('/dashboard'); }, 1500);
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
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    const token = localStorage.getItem('token');
    if (!token) { alert("Debes iniciar sesión para preguntar."); return; }

    setIsAsking(true);
    try {
        const res = await fetch(`http://mosstall-desa-production.up.railway.app/api/products/${productId}/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ content: newQuestion })
        });
        if (res.ok) { window.location.reload(); } 
        else { const data = await res.json(); alert(data.error || "Error al preguntar"); }
    } catch (err) { console.error(err); alert("Error de conexión"); } 
    finally { setIsAsking(false); }
  };

  const handleReplyQuestion = async (questionId: string) => {
    if (!replyContent.trim()) return;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`http://mosstall-desa-production.up.railway.app/api/questions/${questionId}/answer`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ answer: replyContent })
        });
        if (res.ok) { window.location.reload(); } 
        else { alert("Error al responder"); }
    } catch (err) { console.error(err); alert("Error de conexión"); }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta pregunta?")) return;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`http://mosstall-desa-production.up.railway.app/api/questions/${questionId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) { window.location.reload(); } 
        else { alert("Error al eliminar"); }
    } catch (err) { console.error(err); alert("Error de conexión"); }
  };

  const handleDeleteAnswer = async (questionId: string) => {
    if (!window.confirm("¿Quieres eliminar tu respuesta?")) return;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`http://mosstall-desa-production.up.railway.app/api/questions/${questionId}/answer`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) { window.location.reload(); } 
        else { alert("Error al eliminar respuesta"); }
    } catch (err) { console.error(err); alert("Error de conexión"); }
  };

  // --- Renderizado Condicional ---
  if (loading) return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans">
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
         <p className="text-xl text-[#1a237e] font-bold animate-pulse">Cargando producto...</p>
      </div>
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans">
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-4">
        <p className="text-2xl text-[#d50000] font-bold">{error || 'Producto no encontrado'}</p>
        <Link href="/" className="text-[#1a237e] hover:underline font-medium">Volver al inicio</Link>
      </div>
    </div>
  );

  const showPrice = product.price > 0;
  const isService = product.type === 'SERVICIO';
  let priceDisplay = showPrice ? `$${product.price.toLocaleString('es-AR')}` : isService ? "A Cotizar" : "GRATIS";
  const canBuyDirectly = (product.type === 'PRODUCTO' || product.type === 'INFOPRODUCTO') && product.price > 0;
  const hasSpecs = product.brand || product.model || product.year || (product.mileage !== null && product.mileage !== undefined);
  const hasMultipleImages = product.images && product.images.length > 1;
  const isOwner = currentUserId === product.store?.owner?.id; 

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* --- BREADCRUMB (Categoría) --- */}
        <div className="text-sm text-gray-500 mb-6 flex items-center gap-2 font-medium">
            <Link href="/" className="hover:text-[#1a237e] transition-colors">Inicio</Link>
            <span>/</span>
            <span className="text-[#1a237e] font-bold">
                {product.category?.name || 'Otros'}
            </span>
            {product.suggestedCategory && (
                <span className="text-gray-400 italic ml-1">
                    ({product.suggestedCategory})
                </span>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* --- COLUMNA IZQUIERDA: GALERÍA --- */}
          <div className="space-y-4">
             <div 
                className={`relative w-full aspect-square md:aspect-video lg:aspect-square rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden group cursor-crosshair`}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onMouseMove={handleMouseMove}
                onClick={() => selectedImage && setIsModalOpen(true)}
             >
                {selectedImage ? (
                    <>
                        <img src={selectedImage} alt={product.title} className="w-full h-full object-contain bg-white" />
                        
                        {/* Zoom Flotante */}
                        {isHovering && (
                          <div 
                            className="hidden lg:block absolute left-[105%] top-0 w-[120%] h-full bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden pointer-events-none"
                            style={{
                                backgroundImage: `url(${selectedImage})`,
                                backgroundPosition: `${cursorPos.x}% ${cursorPos.y}%`,
                                backgroundSize: '200%',
                                backgroundColor: 'white'
                            }}
                          />
                        )}

                        {/* Controles Slider */}
                        {hasMultipleImages && (
                            <>
                                <button onClick={handlePrevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-[#1a237e] text-white w-10 h-10 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm shadow-md">❮</button>
                                <button onClick={handleNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-[#1a237e] text-white w-10 h-10 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm shadow-md">❯</button>
                            </>
                        )}
                        
                        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            Clic para ampliar
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 flex-col gap-2 bg-gray-50">
                        <span className="text-5xl opacity-50">📷</span>
                        <span className="font-medium">Sin Imagen</span>
                    </div>
                )}
             </div>

             {/* Miniaturas */}
             {hasMultipleImages && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {product.images.map((img, idx) => (
                        <button 
                            key={idx}
                            onClick={() => setSelectedImage(img)}
                            className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-white ${selectedImage === img ? 'border-[#1a237e] shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                            <img src={img} alt="Miniatura" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
             )}
          </div>

          {/* --- COLUMNA DERECHA: INFO --- */}
          <div className="space-y-6">
             <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                     <span className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-widest ${product.status === 'DISPONIBLE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {product.status}
                     </span>
                     <span className="text-gray-300 text-sm">|</span>
                     <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">{product.type}</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-black text-black mb-4 leading-tight tracking-tight">
                    {product.title}
                </h1>

                <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-5xl font-black text-[#1a237e] tracking-tight">
                        {priceDisplay}
                    </span>
                    {product.type === 'SERVICIO' && <span className="text-gray-500 font-medium">/ estimado</span>}
                </div>

                {/* Seller Info (Store / Owner) */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-gray-100 mb-8 transition-colors hover:border-blue-200">
                    <div className="w-12 h-12 rounded-full bg-[#1a237e] flex items-center justify-center font-bold text-white text-xl shadow-md">
                        {product.store?.owner?.name?.charAt(0) || product.store?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <p className="text-[11px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Publicado por</p>
                        <Link href={`/profile/${product.store?.owner?.id}`} className="text-black font-bold text-lg hover:text-[#1a237e] transition-colors">
                            {product.store?.name || product.store?.owner?.name || 'Tienda Anónima'}
                        </Link>
                    </div>
                </div>

                {/* Especificaciones Técnicas */}
                {hasSpecs && (
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-gray-100 mb-8">
                        {product.brand && <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase font-bold">Marca</span><span className="text-black font-medium">{product.brand}</span></div>}
                        {product.model && <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase font-bold">Modelo</span><span className="text-black font-medium">{product.model}</span></div>}
                        {product.year && <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase font-bold">Año</span><span className="text-black font-medium">{product.year}</span></div>}
                        {typeof product.mileage === 'number' && <div className="flex flex-col"><span className="text-xs text-gray-500 uppercase font-bold">KM</span><span className="text-black font-medium">{product.mileage.toLocaleString('es-AR')}</span></div>}
                    </div>
                )}

                {/* Botones de Acción */}
                {isOwner ? (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center">
                        <p className="text-[#1a237e] font-black text-lg mb-1">Esta es tu publicación</p>
                        <p className="text-sm text-[#1a237e]/70 font-medium">No puedes comprar tu propio producto.</p>
                    </div>
                ) : product.status === 'DISPONIBLE' && (
                    <div className="space-y-3">
                        {canBuyDirectly ? (
                            <button 
                                onClick={handlePurchase} 
                                disabled={isPurchasing || isRedirecting}
                                className="w-full bg-[#1a237e] hover:bg-[#121858] text-white font-black py-4 rounded-2xl text-lg shadow-lg shadow-[#1a237e]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait"
                            >
                                {isRedirecting ? 'Redirigiendo al checkout...' : 'Comprar Ahora'}
                            </button>
                        ) : (
                            <button 
                                onClick={handleContact} 
                                disabled={isPurchasing || isRedirecting}
                                className="w-full bg-[#1a237e] hover:bg-[#121858] text-white font-black py-4 rounded-2xl text-lg shadow-lg shadow-[#1a237e]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait"
                            >
                                {isRedirecting ? 'Enviando...' : 'Contratar Servicio'}
                            </button>
                        )}
                        {purchaseMessage && (
                            <div className={`p-4 rounded-xl text-sm font-bold text-center ${purchaseMessage.includes('Error') ? 'bg-red-50 text-[#d50000] border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                {purchaseMessage}
                            </div>
                        )}
                    </div>
                )}
             </div>
             
             {/* Descripción */}
             <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-black text-black mb-4">Descripción</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-[15px]">
                    {product.description}
                </p>
             </div>
          </div>
        </div>

        {/* --- SECCIÓN DE PREGUNTAS --- */}
        <div className="mt-12 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black text-black mb-8">Preguntas y Respuestas</h2>

            {/* Input Pregunta */}
            {!isOwner && (
                <form onSubmit={handleAskQuestion} className="mb-10 bg-slate-50 p-6 rounded-2xl border border-gray-100">
                    <label className="block text-gray-700 font-bold mb-3">Pregúntale a {product.store?.name || 'al vendedor'}</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input 
                            type="text" 
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            placeholder="Ej: ¿Haces envíos a Posadas?" 
                            className="flex-1 bg-white border border-gray-200 rounded-xl px-5 py-3.5 text-gray-900 font-medium focus:ring-2 focus:ring-[#1a237e] focus:border-transparent outline-none placeholder-gray-400 shadow-sm"
                        />
                        <button 
                            type="submit" 
                            disabled={isAsking || !newQuestion.trim()}
                            className="bg-[#1a237e] hover:bg-[#121858] text-white font-bold px-8 py-3.5 rounded-xl transition-colors disabled:opacity-50 shadow-md"
                        >
                            {isAsking ? 'Enviando...' : 'Preguntar'}
                        </button>
                    </div>
                </form>
            )}

            {/* Lista de Preguntas */}
            <div className="space-y-8">
                {product.questions && product.questions.length > 0 ? (
                    product.questions.map((q) => (
                        <div key={q.id} className="relative pl-6 border-l-4 border-gray-200 hover:border-[#1a237e] transition-colors group pb-2">
                             {/* Borrar Pregunta */}
                             {(isOwner || currentUserId === q.askerId) && (
                                <button onClick={() => handleDeleteQuestion(q.id)} className="absolute top-0 right-0 text-[11px] text-gray-400 hover:text-[#d50000] opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">
                                    Eliminar
                                </button>
                             )}

                             {/* Pregunta */}
                             <div className="mb-3">
                                 <p className="text-black font-semibold text-[17px] mb-1">{q.content}</p>
                                 <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{new Date(q.createdAt).toLocaleDateString()}</span>
                             </div>

                             {/* Respuesta */}
                             {q.answer ? (
                                 <div className="bg-slate-50 p-5 rounded-2xl relative group/answer border border-gray-100">
                                     <div className="flex items-center gap-2 mb-2">
                                         <div className="w-2 h-2 bg-[#1a237e] rounded-full"></div>
                                         <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">Respuesta del Vendedor</span>
                                     </div>
                                     <p className="text-gray-700 font-medium text-[15px]">{q.answer}</p>
                                     {isOwner && (
                                        <button onClick={() => handleDeleteAnswer(q.id)} className="absolute top-3 right-3 text-[10px] text-gray-400 hover:text-[#d50000] opacity-0 group-hover/answer:opacity-100 uppercase font-bold transition-colors">
                                            Borrar
                                        </button>
                                     )}
                                 </div>
                             ) : (
                                 isOwner && (
                                     <div className="mt-3">
                                         {replyingTo === q.id ? (
                                             <div className="flex flex-col sm:flex-row gap-2 animate-in fade-in slide-in-from-left-2">
                                                 <input autoFocus type="text" value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Escribe tu respuesta..." className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-black text-sm font-medium focus:ring-2 focus:ring-[#1a237e] outline-none shadow-sm" />
                                                 <button onClick={() => handleReplyQuestion(q.id)} className="bg-[#1a237e] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#121858] shadow-sm">Responder</button>
                                                 <button onClick={() => setReplyingTo(null)} className="text-gray-500 hover:text-black px-4 py-2.5 text-sm font-bold">Cancelar</button>
                                             </div>
                                         ) : (
                                             <button onClick={() => { setReplyingTo(q.id); setReplyContent(''); }} className="text-[#1a237e] text-sm font-bold hover:underline flex items-center gap-1">
                                                 ↳ Escribir respuesta
                                             </button>
                                         )}
                                     </div>
                                 )
                             )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-gray-200 border-dashed">
                        <p className="text-gray-500 font-medium">Aún no hay preguntas. ¡Sé el primero en consultar!</p>
                    </div>
                )}
            </div>
        </div>

        {/* --- LIGHTBOX (Modal de Imagen Full) --- */}
        {isModalOpen && selectedImage && (
            <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
                <button className="absolute top-6 right-6 text-white text-5xl hover:text-gray-300 z-[1200] leading-none">&times;</button>
                <img src={selectedImage} alt="Zoom" className="max-w-[95vw] max-h-[95vh] object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
            </div>
        )}

      </main>
    </div>
  );
}