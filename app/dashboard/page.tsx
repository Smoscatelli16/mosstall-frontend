// src/app/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Componentes extraídos
import FinancialHUD from './components/FinancialHUD';
import OrderList from './components/OrderList';
import InventoryList from './components/InventoryList';
import NotificationList from './components/NotificationList';
import MandatoryReviewModal from '../../components/MandatoryReviewModal';

type DashboardData = {
  metrics: { retained: number; released: number; };
  orders: { purchases: any[]; sales: any[]; };
  notifications: { pendingQuestions: any[]; answersReceived: any[]; pendingReviews: any[]; };
};

export default function DashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [myProducts, setMyProducts] = useState<any[]>([]); 
  const [myNeeds, setMyNeeds] = useState<any[]>([]); 
  const [chats, setChats] = useState<any[]>([]); 
  const [myStores, setMyStores] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'compras' | 'ventas' | 'publicaciones' | 'pedidos' | 'preguntas' | 'mensajes' | 'tiendas'>('compras');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Estados de Modales manuales
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTxId, setReviewTxId] = useState<string | null>(null);
  const [reviewProductTitle, setReviewProductTitle] = useState(''); 
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false); 

  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [posTxId, setPosTxId] = useState<string | null>(null);
  const [posAmount, setPosAmount] = useState('');
  const [posDescription, setPosDescription] = useState('');
  const [posStep, setPosStep] = useState<'INPUT' | 'QR'>('INPUT'); 
  const [posPaymentUrl, setPosPaymentUrl] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(payload.userId);

      const response = await fetch('https://mosstall-desa-production.up.railway.app/api/user/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Fallo del servidor (HTTP ${response.status}).`);
      }
      
      const dashboardData = await response.json();
      setData(dashboardData);

      const chatRes = await fetch('https://mosstall-desa-production.up.railway.app/api/chat/inbox', {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (chatRes.ok) {
        setChats(await chatRes.json());
      }
    } catch (err: any) {
      setError(err.message);
    }
    // NOTA: Se eliminó setLoading(false) de aquí para paralelizar.
  }, [router]);

  const fetchMyProducts = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch('https://mosstall-desa-production.up.railway.app/api/user/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setMyProducts(await response.json());
    } catch (err) { console.error("Error cargando productos", err); }
  }, []);

  const fetchMyNeeds = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch('https://mosstall-desa-production.up.railway.app/api/user/needs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setMyNeeds(await response.json());
    } catch (err) { console.error("Error cargando necesidades", err); }
  }, []);

  const fetchMyStores = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch('https://mosstall-desa-production.up.railway.app/api/user/stores', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setMyStores(await response.json());
    } catch (err) { console.error("Error cargando tiendas", err); }
  }, []);

  // BRIEF #042: Paralelización de Promesas para optimizar Tiempos de Carga
  useEffect(() => {
    const loadAllData = async () => {
        setLoading(true);
        await Promise.all([
            fetchDashboard(),
            fetchMyProducts(),
            fetchMyNeeds(),
            fetchMyStores()
        ]);
        setLoading(false);
    };
    loadAllData();
  }, [fetchDashboard, fetchMyProducts, fetchMyNeeds, fetchMyStores]);

  const handleCardClick = (transactionId: string) => {
    router.push(`/chat/${transactionId}`);
  };

  const handleReleaseFunds = async (transactionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm("¿Confirmas que recibiste el producto en buenas condiciones?\nEl dinero será transferido al vendedor y esta acción no se puede deshacer.")) return;
    setProcessingId(transactionId);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://mosstall-desa-production.up.railway.app/api/transactions/${transactionId}/confirm-delivery`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
          alert("¡Gracias por confirmar! Fondos liberados.");
          await fetchDashboard(); 
          window.dispatchEvent(new Event('forceReviewCheck'));
      } else {
          const d = await res.json();
          alert(`Error: ${d.error}`);
      }
    } catch (e) { alert("Error de conexión al liberar fondos."); } 
    finally { setProcessingId(null); }
  };

  const handleDispute = async (transactionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const reason = prompt("Describe brevemente el problema (mínimo 20 caracteres):");
    if (!reason || reason.trim().length < 20) {
        alert("Debes proveer una descripción válida del problema.");
        return;
    }
    
    setProcessingId(transactionId);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://mosstall-desa-production.up.railway.app/api/transactions/${transactionId}/dispute`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
          alert("Transacción en disputa. Nuestro equipo te contactará pronto.");
          await fetchDashboard(); 
      } else {
          const d = await res.json();
          alert(`Error: ${d.error}`);
      }
    } catch (e) { alert("Error de conexión al abrir disputa."); } 
    finally { setProcessingId(null); }
  };

  const handleCancelOrder = async (transactionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm("¿Seguro que quieres cancelar la operación?")) return;
    setProcessingId(transactionId);
    const token = localStorage.getItem('token');
    try {
      await fetch(`https://mosstall-desa-production.up.railway.app/api/transactions/${transactionId}/cancel`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
      await fetchDashboard(); 
    } catch (e) { alert("Error al cancelar."); } 
    finally { setProcessingId(null); }
  };

  const handleDeleteTransaction = async (transactionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm("¿Eliminar del historial visual?")) return;
    setProcessingId(transactionId);
    const token = localStorage.getItem('token');
    try {
      await fetch(`https://mosstall-desa-production.up.railway.app/api/transactions/${transactionId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      await fetchDashboard(); 
    } catch (e) { alert("Error al eliminar."); } 
    finally { setProcessingId(null); }
  };

  const handleToggleStatus = async (product: any) => {
    setProcessingId(product.id);
    const token = localStorage.getItem('token');
    const newStatus = product.status === 'DISPONIBLE' ? 'PAUSADO' : 'DISPONIBLE';
    if (newStatus === 'DISPONIBLE' && product.stock <= 0 && product.type === 'PRODUCTO') {
        alert("No puedes reactivar un producto sin stock. Primero agrega unidades.");
        setProcessingId(null); return;
    }
    try {
        await fetch(`https://mosstall-desa-production.up.railway.app/api/products/${product.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status: newStatus }) });
        await fetchMyProducts();
    } catch(e) { alert("Error actualizando estado"); } finally { setProcessingId(null); }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("¿Estás seguro de BORRAR esta publicación?")) return;
    setProcessingId(productId);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://mosstall-desa-production.up.railway.app/api/products/${productId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) await fetchMyProducts(); else { const d = await res.json(); alert(`Error: ${d.error}`); }
    } catch(e) { alert("Error"); } finally { setProcessingId(null); }
  };

  const handleDeleteNeed = async (needId: string) => {
    if (!window.confirm("¿Marcar este pedido como completado o cancelado? El anuncio dejará de ser visible.")) return;
    setProcessingId(needId);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://mosstall-desa-production.up.railway.app/api/needs/${needId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) await fetchMyNeeds(); 
      else { const d = await res.json(); alert(`Error: ${d.error}`); }
    } catch(e) { alert("Error al eliminar pedido."); } 
    finally { setProcessingId(null); }
  };

  const handleUpdateStock = async (product: any) => {
    const newStockStr = prompt("Ingresa la nueva cantidad de stock:", product.stock.toString());
    if (newStockStr === null) return; 
    const newStock = parseInt(newStockStr);
    if (isNaN(newStock) || newStock < 0) { alert("Número inválido."); return; }
    setProcessingId(product.id);
    const token = localStorage.getItem('token');
    try {
        await fetch(`https://mosstall-desa-production.up.railway.app/api/products/${product.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ stock: newStock }) });
        await fetchMyProducts();
    } catch(e) { alert("Error"); } finally { setProcessingId(null); }
  };

  const handleMarkAsRead = async (questionId: string) => {
    const token = localStorage.getItem('token');
    fetch(`https://mosstall-desa-production.up.railway.app/api/questions/${questionId}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
    }).catch(err => console.error("Error marking as read", err));
  };

  const openReviewModal = (txId: string, title?: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setReviewTxId(txId); setReviewProductTitle(title || ''); setRating(5); setComment(''); setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
      if (!reviewTxId) return;
      setIsSubmittingReview(true);
      const token = localStorage.getItem('token');
      try {
          const res = await fetch('https://mosstall-desa-production.up.railway.app/api/reviews', {
              method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ transactionId: reviewTxId, rating, comment })
          });
          if (res.ok || res.status === 409) {
              alert(res.status === 409 ? "✅ Ya habías calificado esta compra." : "¡Gracias por tu calificación! ⭐");
              setIsReviewModalOpen(false); setReviewTxId(null); await fetchDashboard();
          } else { alert("Error al enviar reseña."); }
      } catch (error) { alert("Error de conexión."); } finally { setIsSubmittingReview(false); }
  };

  const openPosModal = (tx: any, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setPosTxId(tx.id); setPosAmount(Number(tx.amount || 0).toString()); setPosDescription(`Servicio: ${tx.product?.title}`);
      setPosStep('INPUT'); setPosPaymentUrl(null); setIsPosModalOpen(true);
  };

  const handleGeneratePayment = async () => {
      if (!posTxId || !posAmount) return;
      const token = localStorage.getItem('token');
      try {
          const res = await fetch(`https://mosstall-desa-production.up.railway.app/api/transactions/${posTxId}/checkout-dynamic`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ amount: parseFloat(posAmount), description: posDescription })
          });
          if (res.ok) {
              const d = await res.json();
              setPosPaymentUrl(d.paymentUrl); setPosStep('QR'); fetchDashboard(); 
          } else { const d = await res.json(); alert(d.error); }
      } catch (error) { alert("Error de conexión"); }
  };

  // BRIEF #042: Skeleton Loader (Suspense Pattern UI)
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
        <div className="container mx-auto max-w-5xl space-y-8 animate-pulse">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <div className="h-8 bg-gray-200 rounded-md w-64 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded-md w-48"></div>
            </div>
            <div className="flex gap-2">
               <div className="h-10 bg-gray-200 rounded-full w-24"></div>
               <div className="h-10 bg-gray-200 rounded-full w-24"></div>
            </div>
          </div>
          <div className="h-32 bg-gray-200 rounded-3xl w-full"></div>
          <div className="flex gap-4 border-b border-gray-200 pb-3 overflow-hidden">
            <div className="h-6 bg-gray-200 rounded-md w-24"></div>
            <div className="h-6 bg-gray-200 rounded-md w-28"></div>
            <div className="h-6 bg-gray-200 rounded-md w-24"></div>
            <div className="h-6 bg-gray-200 rounded-md w-32"></div>
          </div>
          <div className="h-64 bg-white border border-gray-100 rounded-3xl w-full"></div>
        </div>
      </main>
    );
  }

  if (error) return <main className="min-h-screen bg-slate-50 p-8 text-center font-sans"><p className="text-[#d50000] font-bold text-xl">{error}</p></main>;
  if (!data) return null;

  const totalQuestions = (data.notifications.pendingQuestions?.length || 0) + (data.notifications.answersReceived?.length || 0);
  const totalUnreadMessages = chats.reduce((acc, chat) => acc + (chat._count?.messages || 0), 0);

  // BRIEF #042: Lógica de Roles (Renderizado Condicional)
  const hasCommercialProfile = myStores.length > 0;

  const orderActions = {
    onRelease: handleReleaseFunds,
    onDispute: handleDispute,
    onReview: openReviewModal,
    onCancel: handleCancelOrder,
    onDelete: handleDeleteTransaction,
    onPos: openPosModal,
    onCardClick: handleCardClick, 
  };

  const inventoryActions = {
    onUpdateStock: handleUpdateStock,
    onToggleStatus: handleToggleStatus,
    onDelete: handleDeleteProduct,
  };

  return (
    <main className="min-h-screen bg-slate-50 text-gray-900 p-4 md:p-8 font-sans">
      <MandatoryReviewModal /> 
      
      <div className="container mx-auto max-w-5xl">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mi Panel de Control</h1>
            <p className="text-gray-500 font-medium mt-1">Gestiona tus operaciones y métricas financieras</p>
          </div>
          <div className="flex gap-2">
              <Link href="/publicar" className="bg-[#1a237e] hover:bg-[#121858] text-white px-5 py-2.5 rounded-full font-bold transition-all shadow-md hover:-translate-y-0.5 text-sm">
                📦 Vender
              </Link>
              <Link href="/se-busca" className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-full font-bold transition-all shadow-md hover:-translate-y-0.5 text-sm">
                🔄 Pedir
              </Link>
          </div>
        </div>

        <FinancialHUD metrics={data.metrics} />

        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveTab('compras')} className={`pb-3 px-6 text-sm font-bold whitespace-nowrap border-b-[3px] transition-colors ${activeTab === 'compras' ? 'text-[#1a237e] border-[#1a237e]' : 'text-gray-400 border-transparent hover:text-gray-700'}`}>
            🛍️ Mis Compras ({data.orders.purchases.length})
          </button>
          
          {/* BRIEF #042: Filtro UI de Roles */}
          {hasCommercialProfile && (
            <>
              <button onClick={() => setActiveTab('ventas')} className={`pb-3 px-6 text-sm font-bold whitespace-nowrap border-b-[3px] transition-colors ${activeTab === 'ventas' ? 'text-[#1a237e] border-[#1a237e]' : 'text-gray-400 border-transparent hover:text-gray-700'}`}>
                💰 Mis Ventas ({data.orders.sales.length})
              </button>
              <button onClick={() => setActiveTab('publicaciones')} className={`pb-3 px-6 text-sm font-bold whitespace-nowrap border-b-[3px] transition-colors ${activeTab === 'publicaciones' ? 'text-[#1a237e] border-[#1a237e]' : 'text-gray-400 border-transparent hover:text-gray-700'}`}>
                📦 Publicaciones ({myProducts.length})
              </button>
              <button onClick={() => setActiveTab('tiendas')} className={`pb-3 px-6 text-sm font-bold whitespace-nowrap border-b-[3px] transition-colors ${activeTab === 'tiendas' ? 'text-[#1a237e] border-[#1a237e]' : 'text-gray-400 border-transparent hover:text-gray-700'}`}>
                🏪 Mis Tiendas ({myStores.length})
              </button>
            </>
          )}

          <button onClick={() => setActiveTab('pedidos')} className={`pb-3 px-6 text-sm font-bold whitespace-nowrap border-b-[3px] transition-colors ${activeTab === 'pedidos' ? 'text-[#1a237e] border-[#1a237e]' : 'text-gray-400 border-transparent hover:text-gray-700'}`}>
            🔄 Pedidos ({myNeeds.length})
          </button>
          <button onClick={() => setActiveTab('preguntas')} className={`pb-3 px-6 text-sm font-bold whitespace-nowrap border-b-[3px] transition-colors relative ${activeTab === 'preguntas' ? 'text-[#1a237e] border-[#1a237e]' : 'text-gray-400 border-transparent hover:text-gray-700'}`}>
            💬 Preguntas {totalQuestions > 0 && <span className="ml-2 bg-[#d50000] text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">{totalQuestions}</span>}
          </button>
          <button onClick={() => setActiveTab('mensajes')} className={`pb-3 px-6 text-sm font-bold whitespace-nowrap border-b-[3px] transition-colors relative ${activeTab === 'mensajes' ? 'text-[#1a237e] border-[#1a237e]' : 'text-gray-400 border-transparent hover:text-gray-700'}`}>
            📩 Mensajes {totalUnreadMessages > 0 && <span className="ml-2 bg-[#d50000] text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">{totalUnreadMessages}</span>}
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
          {activeTab === 'compras' && (
            <div className="cursor-pointer" onClick={(e) => {
                const target = e.target as HTMLElement;
                if(target.closest('button') || target.closest('a')) return;
                const card = target.closest('[data-txid]');
                if (card) {
                    const txId = card.getAttribute('data-txid');
                    if (txId) handleCardClick(txId);
                }
            }}>
                <OrderList orders={data.orders.purchases} type="purchases" processingId={processingId} actions={orderActions} />
            </div>
          )}

          {hasCommercialProfile && activeTab === 'ventas' && (
             <div className="cursor-pointer" onClick={(e) => {
                const target = e.target as HTMLElement;
                if(target.closest('button') || target.closest('a')) return;
                const card = target.closest('[data-txid]');
                if (card) {
                    const txId = card.getAttribute('data-txid');
                    if (txId) handleCardClick(txId);
                }
            }}>
                <OrderList orders={data.orders.sales} type="sales" processingId={processingId} actions={orderActions} />
            </div>
          )}

          {hasCommercialProfile && activeTab === 'publicaciones' && (
            <InventoryList products={myProducts} processingId={processingId} actions={inventoryActions} />
          )}

          {activeTab === 'pedidos' && (
            <div className="p-6">
                {myNeeds.length === 0 ? (
                     <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-4xl mb-4">🔍</p>
                        <p className="text-gray-500 font-medium">No has publicado ningún pedido en el Mercado Inverso.</p>
                     </div>
                ) : (
                    <div className="grid gap-4">
                        {myNeeds.map(need => (
                            <div key={need.id} className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                                            Buscando
                                        </span>
                                        <span className="text-xs text-gray-400 font-bold">{new Date(need.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-lg">{need.title}</h3>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{need.description}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => handleDeleteNeed(need.id)}
                                        disabled={processingId === need.id}
                                        className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
                                    >
                                        {processingId === need.id ? 'Cerrando...' : 'Borrar / Cerrar Pedido'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          )}
          
          {hasCommercialProfile && activeTab === 'tiendas' && (
            <div className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-gray-900">Perfiles Comerciales</h2>
                    <Link href="/publicar" className="text-sm font-bold text-[#1a237e] bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors shadow-sm">
                        + Crear Nuevo Perfil
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myStores.map(store => (
                        <div key={store.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className={`absolute top-0 left-0 w-full h-1.5 ${
                                store.type === 'PRODUCT_STORE' ? 'bg-[#1a237e]' : 
                                store.type === 'SERVICE_PROFESSIONAL' ? 'bg-slate-800' : 'bg-purple-600'
                            }`}></div>
                            
                            <div className="flex justify-between items-start mb-5 pt-2">
                                <div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1.5">
                                        {store.type === 'PRODUCT_STORE' && '🛍️ Tienda de Productos'}
                                        {store.type === 'SERVICE_PROFESSIONAL' && '🛠️ Servicios Profesionales'}
                                        {store.type === 'DIGITAL_CREATOR' && '💻 Creador Digital'}
                                    </span>
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">{store.name}</h3>
                                </div>
                                <Link href={`/tienda/${store.id}`} className="text-[#1a237e] bg-blue-50 hover:bg-[#1a237e] hover:text-white h-10 w-10 flex items-center justify-center rounded-full transition-colors shadow-sm" title="Ver Tienda pública">
                                    👁️
                                </Link>
                            </div>
                            
                            <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-gray-100 flex flex-col gap-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Datos de Cobro Recaudación</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🏦</span>
                                    <p className="font-bold text-sm text-gray-800">
                                        {store.cbu ? `CBU/CVU: ${store.cbu}` : store.cvu ? `CVU: ${store.cvu}` : <span className="text-[#d50000]">⚠️ Sin configurar (Requerido)</span>}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-xs font-bold text-gray-400 border-t border-gray-50 pt-3">
                                <span>Creada el: {new Date(store.createdAt).toLocaleDateString()}</span>
                                <span className="text-green-600 bg-green-50 px-2 py-1 rounded-md">Perfil Activo</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {(activeTab === 'preguntas' || activeTab === 'mensajes') && (
            <NotificationList 
              activeTab={activeTab} 
              pendingQuestions={data.notifications.pendingQuestions} 
              answersReceived={data.notifications.answersReceived} 
              chats={chats} 
              currentUserId={currentUserId} 
              onMarkAsRead={handleMarkAsRead} 
            />
          )}
        </div>
      </div>

      {/* --- MODALES MANUALES --- */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white border border-gray-100 p-8 rounded-[2rem] w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
                <button onClick={() => setIsReviewModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-[#d50000] font-black text-xl">&times;</button>
                <h2 className="text-2xl font-black mb-2 text-center text-gray-900">Calificar Experiencia</h2>
                <div className="flex justify-center gap-2 mb-6 mt-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setRating(star)} className={`text-4xl transition-transform hover:scale-110 focus:outline-none ${rating >= star ? 'text-yellow-400' : 'text-gray-200'}`}>★</button>
                    ))}
                </div>
                <textarea className="w-full bg-slate-50 border border-gray-200 rounded-xl p-4 text-gray-900 font-medium focus:ring-2 focus:ring-[#1a237e] outline-none mb-6 h-28 resize-none shadow-inner" placeholder="Escribe un comentario sobre tu experiencia..." value={comment} onChange={(e) => setComment(e.target.value)} />
                <div className="flex gap-3">
                    <button onClick={() => setIsReviewModalOpen(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">Cancelar</button>
                    <button onClick={handleSubmitReview} disabled={isSubmittingReview} className="flex-1 py-3 rounded-xl bg-[#1a237e] hover:bg-[#121858] text-white font-black shadow-md flex justify-center items-center">
                        {isSubmittingReview ? <span className="animate-spin">⏳</span> : 'Enviar Reseña'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {isPosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white border border-gray-100 p-8 rounded-[2rem] w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
                <button onClick={() => setIsPosModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-[#d50000] font-black text-xl">&times;</button>
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-black text-gray-900 mb-1">POS Digital 💲</h2>
                    <p className="text-sm font-medium text-gray-500">Genera un cobro presencial</p>
                </div>
                {posStep === 'INPUT' ? (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs text-gray-500 mb-2 font-bold uppercase tracking-wider">MONTO A COBRAR ($)</label>
                            <input type="number" className="w-full bg-slate-50 border border-gray-200 rounded-xl p-4 text-[#1a237e] text-2xl font-black focus:ring-2 focus:ring-[#1a237e] outline-none text-center shadow-inner" value={posAmount} onChange={(e) => setPosAmount(e.target.value)} placeholder="0.00" />
                        </div>
                        <button onClick={handleGeneratePayment} className="w-full py-4 rounded-xl bg-[#1a237e] hover:bg-[#121858] text-white font-black shadow-lg mt-2 text-lg transition-transform hover:-translate-y-0.5">Generar QR de Pago ➜</button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center animate-in slide-in-from-right duration-300">
                        <div className="bg-white p-4 rounded-2xl mb-6 shadow-md border border-gray-100">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(posPaymentUrl || '')}`} alt="QR de Pago" className="w-52 h-52"/>
                        </div>
                        <a href={posPaymentUrl || '#'} target="_blank" rel="noopener noreferrer" className="w-full py-4 rounded-xl bg-[#1a237e] hover:bg-[#121858] text-white font-black shadow-lg text-center block mb-2 transition-transform hover:-translate-y-0.5">🔗 Abrir Link de Pago</a>
                    </div>
                )}
            </div>
        </div>
      )}
    </main>
  );
}