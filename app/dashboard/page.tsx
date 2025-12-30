// src/app/dashboard/page.tsx

"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// --- DEFINICIÓN DE TIPOS ---
type ProductInfo = {
  id: string;
  title: string;
  price: number;
  images: string[];
  type: string;
};

type UserInfo = {
  id: string; 
  name: string | null;
  email: string;
};

type Transaction = {
  id: string;
  status: string;
  amount: number;
  createdAt: string;
  product: ProductInfo | null; 
  seller?: UserInfo;
  buyer?: UserInfo;
  review?: { id: string } | null; 
};

type MyProduct = {
  id: string;
  title: string;
  price: number;
  stock: number;
  status: string; 
  type: string;
  images: string[];
  createdAt: string;
};

type PendingQuestion = {
    id: string;
    content: string;
    createdAt: string;
    product: { title: string; id: string; images: string[] };
    asker: { name: string | null };
};

type ReceivedAnswer = {
    id: string;
    content: string;
    answer: string;
    answeredAt: string;
    product: { title: string; id: string; images: string[] };
};

// --- TIPOS NUEVOS PARA EL CHAT ---
type Message = {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    isRead: boolean;
};

type ChatRoom = {
    id: string;
    transactionId: string;
    updatedAt: string;
    transaction: {
        id: string;
        buyer: UserInfo;
        seller: UserInfo;
        product: { title: string; type: string };
    };
    messages: Message[];
    _count?: {
        messages: number; 
    };
};

type DashboardData = {
  purchases: Transaction[];
  sales: Transaction[];
  pendingQuestions: PendingQuestion[]; 
  answersReceived: ReceivedAnswer[]; 
  pendingReviews: Transaction[]; // Agregamos este campo explícitamente
};

export default function DashboardPage() {
  const router = useRouter();

  // --- ESTADOS DE DATOS ---
  const [data, setData] = useState<DashboardData | null>(null);
  const [myProducts, setMyProducts] = useState<MyProduct[]>([]); 
  const [chats, setChats] = useState<ChatRoom[]>([]); 
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Pestañas de navegación
  const [activeTab, setActiveTab] = useState<'compras' | 'ventas' | 'publicaciones' | 'preguntas' | 'mensajes'>('compras');
  
  // Bloqueo de UI durante acciones
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false); // Estado para evitar doble envío

  // --- ESTADOS MODALES ---
  
  // 1. Calificación (Review)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTxId, setReviewTxId] = useState<string | null>(null);
  const [reviewProductTitle, setReviewProductTitle] = useState(''); // Título para mostrar en modal
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // 2. Cobro Ágil (POS)
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [posTxId, setPosTxId] = useState<string | null>(null);
  const [posAmount, setPosAmount] = useState('');
  const [posDescription, setPosDescription] = useState('');
  const [posStep, setPosStep] = useState<'INPUT' | 'QR'>('INPUT'); 
  const [posPaymentUrl, setPosPaymentUrl] = useState<string | null>(null);


  // --- 1. CARGA DE DATOS COMPLETA ---
  const fetchDashboard = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    try {
      // Decodificar Token
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(payload.userId);

      // A. Cargar Dashboard General
      const response = await fetch('http://localhost:3001/api/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
        throw new Error('Error al cargar datos.');
      }
      const dashboardData = await response.json();
      setData(dashboardData);

      // --- CORRECCIÓN URGENTE: COMENTADO PARA QUE NO SE ABRA SOLA ---
      // Esta es la parte que te estaba bloqueando. Al comentarla, la ventana no aparecerá.
      /*
      if (dashboardData.pendingReviews && dashboardData.pendingReviews.length > 0 && !sessionStorage.getItem('skip_reviews')) {
          // Tomamos la primera pendiente
          const pending = dashboardData.pendingReviews[0];
          setReviewTxId(pending.id);
          setReviewProductTitle(pending.product?.title || 'Producto');
          setRating(5);
          setComment('');
          setIsReviewModalOpen(true);
      }
      */

      // B. Cargar Chats (Inbox)
      const chatRes = await fetch('http://localhost:3001/api/chats', {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (chatRes.ok) {
          setChats(await chatRes.json());
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // --- 2. CARGA DE MIS PRODUCTOS ---
  const fetchMyProducts = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:3001/api/user/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setMyProducts(await response.json());
      }
    } catch (err) {
      console.error("Error cargando productos", err);
    }
  }, []);

  // --- EFECTO UNIFICADO ---
  useEffect(() => {
    fetchDashboard();
    fetchMyProducts();
  }, [fetchDashboard, fetchMyProducts]);


  // --- ACCIONES DE TRANSACCIONES ---
  const handleCancelOrder = async (transactionId: string) => {
    if (!window.confirm("¿Seguro que quieres cancelar? El stock se devolverá.")) return;
    setProcessingId(transactionId);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch(`http://localhost:3001/api/transactions/${transactionId}/cancel`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await fetchDashboard(); 
    } catch (e) { alert("Error al cancelar."); } 
    finally { setProcessingId(null); }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!window.confirm("¿Eliminar del historial?")) return;
    setProcessingId(transactionId);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch(`http://localhost:3001/api/transactions/${transactionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await fetchDashboard(); 
    } catch (e) { alert("Error al eliminar."); } 
    finally { setProcessingId(null); }
  };

  // --- ACCIONES DE GESTIÓN DE PRODUCTOS ---

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("¿Estás seguro de BORRAR esta publicación?\nEsta acción es irreversible.")) return;
    setProcessingId(productId);
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`http://localhost:3001/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchMyProducts(); 
      } else {
        const d = await res.json();
        alert(`No se pudo borrar: ${d.error}`);
      }
    } catch(e) { alert("Error de conexión"); }
    finally { setProcessingId(null); }
  };

  const handleToggleStatus = async (product: MyProduct) => {
    setProcessingId(product.id);
    const token = localStorage.getItem('token');
    
    const newStatus = product.status === 'DISPONIBLE' ? 'PAUSADO' : 'DISPONIBLE';
    
    if (newStatus === 'DISPONIBLE' && product.stock <= 0 && product.type === 'PRODUCTO') {
        alert("No puedes reactivar un producto sin stock. Primero agrega unidades.");
        setProcessingId(null);
        return;
    }

    try {
        await fetch(`http://localhost:3001/api/products/${product.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: newStatus })
        });
        await fetchMyProducts();
    } catch(e) { alert("Error actualizando estado"); }
    finally { setProcessingId(null); }
  };

  const handleUpdateStock = async (product: MyProduct) => {
    const newStockStr = prompt("Ingresa la nueva cantidad de stock:", product.stock.toString());
    if (newStockStr === null) return; 
    
    const newStock = parseInt(newStockStr);
    if (isNaN(newStock) || newStock < 0) {
        alert("Por favor ingresa un número válido (0 o más).");
        return;
    }

    setProcessingId(product.id);
    const token = localStorage.getItem('token');

    try {
        await fetch(`http://localhost:3001/api/products/${product.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ stock: newStock })
        });
        await fetchMyProducts();
    } catch(e) { alert("Error actualizando stock"); }
    finally { setProcessingId(null); }
  };

  const handleMarkAsRead = async (questionId: string) => {
      const token = localStorage.getItem('token');
      fetch(`http://localhost:3001/api/questions/${questionId}/read`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
      }).catch(err => console.error("Error marking as read", err));
  };

  // --- LÓGICA: ENVIAR RESEÑA (MODIFICADA PARA ROBUSTEZ) ---
  const openReviewModal = (txId: string, title?: string) => {
      setReviewTxId(txId);
      if (title) setReviewProductTitle(title);
      setRating(5);
      setComment('');
      setIsReviewModalOpen(true);
  };

  const closeReviewModal = () => {
      setIsReviewModalOpen(false);
      setReviewTxId(null);
      // Opcional: Recordar que el usuario cerró el modal para no spamear
      sessionStorage.setItem('skip_reviews', 'true');
  };

  const handleSubmitReview = async () => {
      if (!reviewTxId) return;
      setIsSubmittingReview(true); // Bloqueamos botón
      const token = localStorage.getItem('token');

      try {
          const res = await fetch('http://localhost:3001/api/reviews', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify({
                  transactionId: reviewTxId,
                  rating,
                  comment
              })
          });

          // Analizamos la respuesta
          const dataJson = await res.json();

          // --- FIX CRÍTICO DEL BUCLE ---
          // Si es 200 (OK) -> Éxito normal.
          // Si es 409 (Conflict) -> El servidor dice "Ya existe". PARA EL FRONTEND ESTO ES ÉXITO.
          if (res.ok || res.status === 409) {
              if (res.status === 409) {
                  alert("✅ Nota: Ya habías calificado esta compra anteriormente.");
              } else {
                  alert("¡Gracias por tu calificación! ⭐");
              }
              // Cerramos sí o sí
              setIsReviewModalOpen(false);
              setReviewTxId(null);
              // Recargamos datos para quitar el pendiente de la lista
              await fetchDashboard();
          } else {
              // Si es otro error (ej: 500), mostramos el mensaje pero permitimos cerrar
              alert(`⚠️ Error: ${dataJson.error || "No se pudo enviar la reseña."}`);
          }
      } catch (error) {
          alert("Error de conexión. Verifica tu internet.");
      } finally {
          setIsSubmittingReview(false); // Desbloqueamos botón por si acaso
      }
  };

  // --- LÓGICA: COBRO ÁGIL (POS) ---
  const openPosModal = (tx: Transaction) => {
      setPosTxId(tx.id);
      setPosAmount(tx.amount.toString()); 
      setPosDescription(`Servicio: ${tx.product?.title}`);
      setPosStep('INPUT');
      setPosPaymentUrl(null);
      setIsPosModalOpen(true);
  };

  const handleGeneratePayment = async () => {
      if (!posTxId || !posAmount) return;
      const token = localStorage.getItem('token');

      try {
          const res = await fetch(`http://localhost:3001/api/transactions/${posTxId}/checkout-dynamic`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                  amount: parseFloat(posAmount),
                  description: posDescription
              })
          });

          if (res.ok) {
              const d = await res.json();
              setPosPaymentUrl(d.paymentUrl);
              setPosStep('QR'); 
              fetchDashboard(); 
          } else {
              const d = await res.json();
              alert(d.error || "Error al generar cobro");
          }
      } catch (error) {
          alert("Error de conexión");
      }
  };


  // --- HELPERS VISUALES ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'INICIADO': return <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-900 text-yellow-300 border border-yellow-700">⏳ Iniciado</span>;
      case 'PENDING_WORK': return <span className="px-2 py-1 rounded text-xs font-bold bg-orange-900 text-orange-300 border border-orange-700 animate-pulse">🛠️ Trabajo Pendiente</span>;
      case 'PAGADO_EN_RETENCION': return <span className="px-2 py-1 rounded text-xs font-bold bg-green-900 text-green-300 border border-green-700">🛡️ Dinero Asegurado</span>;
      case 'COMPLETADO': return <span className="px-2 py-1 rounded text-xs font-bold bg-blue-900 text-blue-300 border border-blue-700">✅ Finalizado</span>;
      case 'CANCELADO': return <span className="px-2 py-1 rounded text-xs font-bold bg-red-900 text-red-300 border border-red-700">❌ Cancelado</span>;
      default: return <span className="px-2 py-1 rounded text-xs font-bold bg-gray-700 text-gray-300">{status}</span>;
    }
  };

  const getProductStatusBadge = (status: string, stock: number) => {
    if (status === 'DISPONIBLE') return <span className="px-2 py-1 rounded text-xs font-bold bg-green-600 text-white">🟢 Activo</span>;
    if (status === 'PAUSADO') return <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-600 text-white">⏸️ Pausado</span>;
    if (status === 'SIN_STOCK' || stock === 0) return <span className="px-2 py-1 rounded text-xs font-bold bg-red-600 text-white animate-pulse">⚠️ SIN STOCK</span>;
    return <span className="text-xs text-gray-400">{status}</span>;
  };

  const canCancel = (status: string) => status !== 'COMPLETADO' && status !== 'CANCELADO';
  const canDelete = (status: string) => status === 'COMPLETADO' || status === 'CANCELADO';


  // --- RENDERIZADO ---
  if (loading) return <main className="min-h-screen bg-gray-900 p-8 flex items-center justify-center text-white"><div className="text-4xl animate-bounce">🚀</div></main>;
  if (error) return <main className="min-h-screen bg-gray-900 p-8 text-white text-center"><p className="text-red-400">{error}</p></main>;
  
  if (!data) return null;

  // CÁLCULOS DE NOTIFICACIONES
  const totalQuestions = (data.pendingQuestions?.length || 0) + (data.answersReceived?.length || 0);
  const totalUnreadMessages = chats.reduce((acc, chat) => acc + (chat._count?.messages || 0), 0);

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8 relative">
      <div className="container mx-auto max-w-5xl">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Mi Panel de Control</h1>
            <p className="text-gray-400 text-sm">Gestiona tus operaciones y tu inventario</p>
          </div>
          <Link href="/publicar" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20">
            + Vender Algo Nuevo
          </Link>
        </div>

        {/* NAVEGACIÓN DE PESTAÑAS */}
        <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
          <button onClick={() => setActiveTab('compras')} className={`pb-3 px-6 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'compras' ? 'text-blue-400 border-blue-400' : 'text-gray-400 border-transparent hover:text-gray-200'}`}>
            🛍️ Mis Compras ({data.purchases.length})
          </button>
          <button onClick={() => setActiveTab('ventas')} className={`pb-3 px-6 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'ventas' ? 'text-green-400 border-green-400' : 'text-gray-400 border-transparent hover:text-gray-200'}`}>
            💰 Mis Ventas ({data.sales.length})
          </button>
          <button onClick={() => setActiveTab('publicaciones')} className={`pb-3 px-6 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'publicaciones' ? 'text-purple-400 border-purple-400' : 'text-gray-400 border-transparent hover:text-gray-200'}`}>
            📦 Mis Publicaciones ({myProducts.length})
          </button>
          <button onClick={() => setActiveTab('preguntas')} className={`pb-3 px-6 text-sm font-medium whitespace-nowrap border-b-2 transition-colors relative ${activeTab === 'preguntas' ? 'text-yellow-400 border-yellow-400' : 'text-gray-400 border-transparent hover:text-gray-200'}`}>
            💬 Preguntas {totalQuestions > 0 && <span className="ml-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">{totalQuestions}</span>}
          </button>
          <button onClick={() => setActiveTab('mensajes')} className={`pb-3 px-6 text-sm font-medium whitespace-nowrap border-b-2 transition-colors relative ${activeTab === 'mensajes' ? 'text-cyan-400 border-cyan-400' : 'text-gray-400 border-transparent hover:text-gray-200'}`}>
            📩 Mis Mensajes {totalUnreadMessages > 0 && <span className="ml-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">{totalUnreadMessages}</span>}
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden min-h-[300px]">
          
          {/* TAB 1: COMPRAS */}
          {activeTab === 'compras' && (
            <div className="p-6 space-y-4">
              {data.purchases.length === 0 && <p className="text-center text-gray-500 py-10">No has comprado nada aún.</p>}
              {data.purchases.map((tx) => (
                <div key={tx.id} className="flex flex-col md:flex-row gap-4 p-4 rounded-lg bg-gray-700/30 border border-gray-700 items-center">
                  <div className="h-12 w-12 bg-gray-800 rounded flex items-center justify-center text-xl shrink-0">📦</div>
                  <div className="grow">
                    <h3 className="font-bold text-white">{tx.product?.title || 'Producto Eliminado'}</h3>
                    {/* ENLACE AL PERFIL DEL VENDEDOR */}
                    <p className="text-sm text-gray-400">
                        Vendedor: 
                        {tx.seller ? (
                            <Link href={`/profile/${tx.seller.id}`} className="text-blue-400 hover:underline ml-1">
                                {tx.seller.name || 'Desconocido'}
                            </Link>
                        ) : ' Desconocido'}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className="font-bold">${tx.amount.toLocaleString('es-AR')}</span>
                    {getStatusBadge(tx.status)}
                    
                    {tx.status === 'COMPLETADO' && !tx.review && (
                        <button onClick={() => openReviewModal(tx.id, tx.product?.title || '')} className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded text-xs font-bold shadow-lg flex items-center gap-1 transition-transform hover:scale-105">⭐ Calificar</button>
                    )}
                    {tx.review && <span className="text-xs text-yellow-500 font-bold border border-yellow-500/50 px-2 py-1 rounded">✅ Calificado</span>}

                    <Link href={`/chat/${tx.id}`} className="text-xs text-cyan-400 hover:underline flex items-center gap-1 mt-1">💬 Chatear con Vendedor</Link>

                    {canCancel(tx.status) && <button onClick={() => handleCancelOrder(tx.id)} disabled={processingId === tx.id} className="text-xs text-red-400 hover:underline mt-1">Cancelar</button>}
                    {canDelete(tx.status) && <button onClick={() => handleDeleteTransaction(tx.id)} disabled={processingId === tx.id} className="text-xs text-gray-400 hover:text-white mt-1">🗑️ Eliminar</button>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: VENTAS */}
          {activeTab === 'ventas' && (
            <div className="p-6 space-y-4">
              {data.sales.length === 0 && <p className="text-center text-gray-500 py-10">No tienes ventas registradas.</p>}
              {data.sales.map((tx) => (
                <div key={tx.id} className="flex flex-col md:flex-row gap-4 p-4 rounded-lg bg-gray-700/30 border border-gray-700 items-center">
                  <div className="h-12 w-12 bg-gray-800 rounded flex items-center justify-center text-xl shrink-0">💰</div>
                  <div className="grow">
                    <h3 className="font-bold text-white">{tx.product?.title || 'Producto Eliminado'}</h3>
                    {/* ENLACE AL PERFIL DEL COMPRADOR */}
                    <p className="text-sm text-gray-400">
                        Comprador: 
                        {tx.buyer ? (
                            <Link href={`/profile/${tx.buyer.id}`} className="text-blue-400 hover:underline ml-1">
                                {tx.buyer.name || 'Anónimo'}
                            </Link>
                        ) : ' Anónimo'}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className="font-bold text-green-400">+ ${tx.amount.toLocaleString('es-AR')}</span>
                    {getStatusBadge(tx.status)}
                    
                    {tx.product?.type === 'SERVICIO' && (tx.status === 'INICIADO' || tx.status === 'PENDING_WORK') && (
                        <button onClick={() => openPosModal(tx)} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs font-bold shadow flex items-center gap-1 transition-transform hover:scale-105">💲 Generar Cobro</button>
                    )}

                    <Link href={`/chat/${tx.id}`} className="text-xs text-cyan-400 hover:underline flex items-center gap-1 mt-1">💬 Chatear con Cliente</Link>

                    {canCancel(tx.status) && <button onClick={() => handleCancelOrder(tx.id)} disabled={processingId === tx.id} className="text-xs text-red-400 hover:underline mt-1">Cancelar</button>}
                    {canDelete(tx.status) && <button onClick={() => handleDeleteTransaction(tx.id)} disabled={processingId === tx.id} className="text-xs text-gray-400 hover:text-white mt-1">🗑️ Eliminar</button>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: PUBLICACIONES */}
          {activeTab === 'publicaciones' && (
            <div className="p-6 space-y-4">
              {myProducts.length === 0 ? (
                <div className="text-center py-10"><p className="text-6xl mb-4">📦</p><p className="text-gray-500">No tienes productos en venta.</p></div>
              ) : (
                myProducts.map((prod) => (
                    <div key={prod.id} className={`flex flex-col md:flex-row gap-4 p-4 rounded-lg border items-center transition-colors ${prod.status === 'PAUSADO' || prod.stock === 0 ? 'bg-red-900/10 border-red-900/30' : 'bg-gray-700/30 border-gray-700'}`}>
                        <div className="h-12 w-12 bg-gray-800 rounded flex items-center justify-center text-xl shrink-0 relative">{prod.type === 'PRODUCTO' ? '📦' : '🛠️'}</div>
                        <div className="grow">
                            <div className="flex items-center gap-2 mb-1"><h3 className="font-bold text-white text-lg">{prod.title}</h3>{getProductStatusBadge(prod.status, prod.stock)}</div>
                            <div className="flex gap-4 text-sm text-gray-400"><span>Precio: <strong>${prod.price}</strong></span>{prod.type === 'PRODUCTO' && (<span className={prod.stock === 0 ? "text-red-400 font-bold" : ""}>Stock: {prod.stock} u.</span>)}</div>
                        </div>
                        <div className="flex gap-2">
                            {prod.type === 'PRODUCTO' && (<button onClick={() => handleUpdateStock(prod)} className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-xs font-medium border border-gray-600" disabled={processingId === prod.id}>✏️ Stock</button>)}
                            <button onClick={() => handleToggleStatus(prod)} className="px-3 py-1.5 rounded text-xs font-medium border bg-gray-700" disabled={processingId === prod.id}>{prod.status === 'DISPONIBLE' ? '⏸️ Pausar' : '▶️ Activar'}</button>
                            <button onClick={() => handleDeleteProduct(prod.id)} className="px-3 py-1.5 rounded bg-red-900/20 text-red-400 border border-red-800 hover:bg-red-900/40 text-xs font-medium" disabled={processingId === prod.id}>🗑️ Borrar</button>
                        </div>
                    </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: PREGUNTAS */}
          {activeTab === 'preguntas' && (
            <div className="p-6 space-y-8">
              <div>
                  <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">🔴 Te Preguntaron <span className="text-xs bg-red-900/30 px-2 py-1 rounded text-red-300">Pendiente de respuesta</span></h3>
                  {(!data.pendingQuestions || data.pendingQuestions.length === 0) ? (<p className="text-gray-500 italic text-sm">Estás al día.</p>) : (
                    <div className="space-y-3">
                        {data.pendingQuestions.map((q) => (
                            <div key={q.id} className="flex flex-col md:flex-row gap-4 p-4 rounded-lg bg-red-900/10 border border-red-900/30 items-start">
                                <div className="grow"><div className="flex items-center gap-2 mb-2"><span className="text-xs text-gray-400">Sobre tu producto: <strong>{q.product.title}</strong></span><span className="text-xs text-gray-500">• {new Date(q.createdAt).toLocaleDateString()}</span></div><p className="text-white font-medium italic">"{q.content}"</p><p className="text-sm text-gray-400 mt-1">De: {q.asker.name || 'Usuario'}</p></div>
                                <Link href={`/product/${q.product.id}`} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm font-bold shadow-lg">Responder ➜</Link>
                            </div>
                        ))}
                    </div>
                  )}
              </div>
              <hr className="border-gray-700" />
              <div>
                  <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">🔵 Te Respondieron <span className="text-xs bg-blue-900/30 px-2 py-1 rounded text-blue-300">Novedades</span></h3>
                  {(!data.answersReceived || data.answersReceived.length === 0) ? (<p className="text-gray-500 italic text-sm">No has recibido respuestas nuevas.</p>) : (
                    <div className="space-y-3">
                        {data.answersReceived.map((a) => (
                            <div key={a.id} className="flex flex-col md:flex-row gap-4 p-4 rounded-lg bg-blue-900/10 border border-blue-900/30 items-start">
                                <div className="grow"><div className="flex items-center gap-2 mb-2"><span className="text-xs text-gray-400">En publicación: <strong>{a.product.title}</strong></span><span className="text-xs text-gray-500">• {new Date(a.answeredAt).toLocaleDateString()}</span></div><p className="text-gray-400 text-sm mb-1 italic">Tú preguntaste: "{a.content}"</p><p className="text-white font-medium bg-gray-800/50 p-2 rounded border-l-2 border-blue-500">↳ Respuesta: "{a.answer}"</p></div>
                                <Link href={`/product/${a.product.id}`} onClick={() => handleMarkAsRead(a.id)} className="text-blue-400 hover:underline text-sm font-medium self-center cursor-pointer">Ver publicación ➜</Link>
                            </div>
                        ))}
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* TAB 5: MENSAJES (NUEVO) */}
          {activeTab === 'mensajes' && (
            <div className="p-0">
                {chats.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-6xl mb-4">📭</p>
                        <p className="text-gray-500">No tienes conversaciones activas.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-700">
                        {chats.map((chat) => {
                            const isBuyer = chat.transaction.buyer.id === currentUserId;
                            const otherUser = isBuyer ? chat.transaction.seller : chat.transaction.buyer;
                            const roleLabel = isBuyer ? 'Vendedor' : 'Comprador';
                            const lastMessage = chat.messages[0];
                            const unreadCount = chat._count?.messages || 0;

                            return (
                                <Link 
                                    key={chat.id} 
                                    href={`/chat/${chat.transaction.id}`}
                                    className="block p-4 hover:bg-gray-700/50 transition-colors relative"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-200 text-xl font-bold border border-cyan-800 shrink-0 relative">
                                                {otherUser.name?.charAt(0) || '?'}
                                                {unreadCount > 0 && (
                                                    <span className="absolute -top-1 -right-1 bg-red-600 w-4 h-4 rounded-full border-2 border-gray-900"></span>
                                                )}
                                            </div>
                                            <div className="overflow-hidden">
                                                <h3 className="font-bold text-white flex items-center gap-2">
                                                    {otherUser.name || 'Usuario'}
                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-gray-700 rounded text-gray-300">{roleLabel}</span>
                                                </h3>
                                                <p className="text-sm text-gray-400 flex items-center gap-1">
                                                    <span className="text-gray-500">Sobre:</span> {chat.transaction.product.title}
                                                </p>
                                                <div className={`text-sm mt-1 truncate max-w-md ${unreadCount > 0 ? 'text-white font-bold' : 'text-gray-300 italic'}`}>
                                                    {lastMessage ? (
                                                        <>
                                                            <span className={`${unreadCount > 0 ? 'text-cyan-400' : 'text-gray-500 font-normal'}`}>{lastMessage.senderId === currentUserId ? 'Tú: ' : ''}</span>
                                                            {lastMessage.content}
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-600">Chat iniciado.</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-xs text-gray-500 block">{new Date(chat.updatedAt).toLocaleDateString()}</span>
                                            {unreadCount > 0 && (
                                                <span className="inline-block mt-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                                    {unreadCount} NUEVOS
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
          )}

        </div>
      </div>

      {/* --- MODAL DE CALIFICACIÓN (COMPRADOR) --- */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-300">
                <button onClick={() => setIsReviewModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
                <h2 className="text-2xl font-bold mb-2 text-center text-white">Calificar Vendedor</h2>
                <p className="text-gray-400 text-sm text-center mb-6">¿Qué tal fue tu experiencia?</p>
                <div className="flex justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setRating(star)} className={`text-4xl transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-gray-600'}`}>★</button>
                    ))}
                </div>
                <p className="text-center font-bold text-yellow-400 mb-4 h-6">{rating === 5 ? "¡Excelente! 😍" : rating === 1 ? "Malo 😞" : "Calificación"}</p>
                <textarea className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none mb-4 h-24 resize-none placeholder-gray-500" placeholder="Escribe un comentario..." value={comment} onChange={(e) => setComment(e.target.value)} />
                <div className="flex gap-3">
                    <button onClick={() => setIsReviewModalOpen(false)} className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700">Cancelar</button>
                    <button 
                        onClick={handleSubmitReview} 
                        disabled={isSubmittingReview}
                        className="flex-1 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-black font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
                    >
                        {isSubmittingReview ? <span className="animate-spin">⏳</span> : 'Enviar Reseña'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL DE COBRO ÁGIL (VENDEDOR - POSNET) --- */}
      {isPosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-300">
                <button onClick={() => setIsPosModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
                
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-1">POS Digital 💲</h2>
                    <p className="text-gray-400 text-sm">Genera un cobro para tu cliente en el momento.</p>
                </div>

                {posStep === 'INPUT' ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1 font-bold">MONTO A COBRAR ($)</label>
                            <input 
                                type="number" 
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white text-xl font-bold focus:ring-2 focus:ring-green-500 outline-none text-center"
                                value={posAmount}
                                onChange={(e) => setPosAmount(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">DETALLE DEL TRABAJO</label>
                            <input 
                                type="text" 
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 outline-none"
                                value={posDescription}
                                onChange={(e) => setPosDescription(e.target.value)}
                                placeholder="Ej: Poda y limpieza..."
                            />
                        </div>
                        <button onClick={handleGeneratePayment} className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold shadow-lg mt-2 text-lg">Generar QR de Pago ➜</button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center animate-in slide-in-from-right duration-300">
                        <div className="bg-white p-4 rounded-xl mb-4 shadow-white/10 shadow-lg">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(posPaymentUrl || '')}`} alt="QR de Pago" className="w-48 h-48"/>
                        </div>
                        <p className="text-white font-bold text-lg mb-1">${parseFloat(posAmount).toLocaleString('es-AR')}</p>
                        <p className="text-gray-400 text-sm mb-6 text-center max-w-[200px] truncate">{posDescription}</p>
                        
                        <a href={posPaymentUrl || '#'} target="_blank" rel="noopener noreferrer" className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg text-center block mb-2">🔗 Abrir Link de Pago</a>
                        <button onClick={() => setIsPosModalOpen(false)} className="text-gray-400 hover:text-white text-sm underline">Cerrar</button>
                    </div>
                )}
            </div>
        </div>
      )}

    </main>
  );
}