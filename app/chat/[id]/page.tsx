// src/app/chat/[id]/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Importamos el Modal Global
import MandatoryReviewModal from '../../../components/MandatoryReviewModal';

// --- TIPOS ---
type User = {
    id: string;
    name: string | null;
    email: string;
};

type Message = {
    id: string;
    content: string;
    createdAt: string;
    sender: { id: string; name: string | null };
};

type ChatRoomData = {
    id: string;
    transaction?: {
        id: string;
        state: string;
        amount: number;
        product: { title: string; type: string; price: number; images: string[] } | null;
        buyer: User;
        seller: User;
    };
    needListing?: {
        id: string;
        title: string;
        description: string;
        userId: string;
        user: User;
    };
};

export default function ChatRoomPage() {
    const params = useParams();
    const router = useRouter();
    
    const transactionId = (params?.id || params?.transactionId) as string;
    
    // --- ESTADOS ---
    const [chatData, setChatData] = useState<ChatRoomData | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [actionLoading, setActionLoading] = useState(false); 
    const [error, setError] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    
    // ESTADOS DE MODALES (Escrow)
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');
    
    // ESTADOS: Oferta Inversa
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [offerAmount, setOfferAmount] = useState('');
    const [offerDescription, setOfferDescription] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleSessionExpired = (showAlert = true) => {
        if (showAlert) {
            alert("🔒 Tu sesión ha expirado.\n\nPor motivos de seguridad, debes iniciar sesión nuevamente.");
        }
        localStorage.removeItem('token');
        router.push('/login');
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setCurrentUserId(payload.userId);
        } catch (e) { router.push('/login'); }
    }, [router]);

    const initChat = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`http://localhost:3001/api/chat/${transactionId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 403 || res.status === 401) { handleSessionExpired(true); return; }
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || "No se pudo acceder."); }

            const room = await res.json();
            if (!room || (!room.transaction && !room.needListing)) throw new Error("Datos incompletos.");

            if (room.transaction) {
                room.transaction.state = room.transaction.state || room.transaction.status;
            }

            setChatData(room);
            await loadMessages(room.id, token);
            
        } catch (err: any) { setError(err.message); } 
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (transactionId) initChat();
        else if (params && Object.keys(params).length > 0) {
             setError(`Error de Ruta: No se encuentra el ID.`); setLoading(false);
        }
    }, [transactionId, router, params]);

    const loadMessages = async (roomId: string, token: string) => {
        try {
            const res = await fetch(`http://localhost:3001/api/chat/room/${roomId}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 403 || res.status === 401) { handleSessionExpired(false); return; }
            if(res.ok) setMessages(await res.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (!chatData) return;
        if (chatData.transaction && ['FUNDS_RELEASED', 'REFUNDED', 'DISPUTED'].includes(chatData.transaction.state)) return;

        const interval = setInterval(() => {
            const token = localStorage.getItem('token');
            if (token) loadMessages(chatData.id, token);
        }, 3000);
        return () => clearInterval(interval);
    }, [chatData]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatData) return;
        setSending(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:3001/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ chatRoomId: chatData.id, content: newMessage })
            });
            if (res.status === 403 || res.status === 401) { handleSessionExpired(true); return; }
            if (res.ok) { setNewMessage(''); await loadMessages(chatData.id, token!); } 
            else { alert("Error al enviar. Es posible que el chat esté cerrado."); }
        } catch (error) { console.error(error); } finally { setSending(false); }
    };

    const handleGenerateOffer = async () => {
        if (!offerAmount || isNaN(Number(offerAmount))) { alert("Monto inválido"); return; }
        setActionLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:3001/api/chat/offer', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatRoomId: chatData?.id,
                    amount: offerAmount,
                    description: offerDescription
                })
            });
            if (res.ok) {
                setShowOfferModal(false);
                alert("✅ Oferta generada y anuncio cerrado. Ahora el comprador puede pagar.");
                initChat(); 
            } else {
                const d = await res.json();
                alert(`Error: ${d.error}`);
            }
        } catch (e) { alert('Error de red'); } 
        finally { setActionLoading(false); }
    };

    const handleSimulatePayment = async () => {
        if (!chatData?.transaction) return;
        if (!window.confirm("🛠️ MODO TEST: ¿Simular que el comprador ya pagó para probar la calificación?")) return;
        
        setActionLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3001/api/transactions/${chatData.transaction.id}/simulate-payment`, {
                method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                alert("✅ Pago simulado con éxito. El comprador ya puede liberar los fondos.");
                initChat(); 
            } else { 
                alert("Error: Asegúrate de agregar la ruta de simulación en el backend."); 
            }
        } catch (error) { alert("Error de conexión"); } 
        finally { setActionLoading(false); }
    };

    // --- LIBERAR DINERO Y DISPARAR EVENTO ---
    const handleConfirmDelivery = async () => {
        if (!chatData?.transaction) return;
        setActionLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3001/api/transactions/${chatData.transaction.id}/confirm-delivery`, {
                method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setShowConfirmModal(false);
                setChatData({ ...chatData, transaction: { ...chatData.transaction, state: 'FUNDS_RELEASED' } });
                
                // EL DISPARADOR GLOBAL (Reemplaza al modal local)
                window.dispatchEvent(new Event('forceReviewCheck'));
            } else { alert("No se pudo liberar el pago."); }
        } catch (error) { alert("Error"); } finally { setActionLoading(false); }
    };

    const handleOpenDispute = async () => {
        if (!chatData?.transaction || disputeReason.trim().length < 20) return;
        setActionLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3001/api/transactions/${chatData.transaction.id}/dispute`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: disputeReason.trim() })
            });
            if (res.ok) {
                setShowDisputeModal(false);
                setChatData({ ...chatData, transaction: { ...chatData.transaction, state: 'DISPUTED' } });
            } else { alert("No se pudo abrir disputa."); }
        } catch (error) { alert("Error"); } finally { setActionLoading(false); }
    };

    if (loading) return <main className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-[#1a237e]">Cargando sala...</main>;
    if (error) return <main className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-[#d50000]">{error}</main>;
    if (!chatData) return null;

    const isTransaction = !!chatData.transaction;
    const isNeed = !!chatData.needListing;

    let otherUser: User | null = null;
    let isBuyerOrCreator = false;
    let displayTitle = '';
    let displayRole = '';
    let isClosed = false;

    if (isTransaction && chatData.transaction) {
        isBuyerOrCreator = chatData.transaction.buyer.id === currentUserId; 
        otherUser = isBuyerOrCreator ? chatData.transaction.seller : chatData.transaction.buyer;
        displayTitle = chatData.transaction.product?.title || 'Acuerdo Privado';
        displayRole = isBuyerOrCreator ? 'Vendedor / Oferente' : 'Comprador / Cliente';
        isClosed = ['FUNDS_RELEASED', 'REFUNDED', 'DISPUTED'].includes(chatData.transaction.state);
    } else if (isNeed && chatData.needListing) {
        isBuyerOrCreator = chatData.needListing.userId === currentUserId; 
        const offererFromMessages = messages.find(m => m.sender.id !== chatData.needListing?.userId)?.sender;
        otherUser = isBuyerOrCreator 
            ? (offererFromMessages as User || { id: 'offerer', name: 'Oferente', email: '' }) 
            : chatData.needListing.user;
            
        displayTitle = chatData.needListing.title;
        displayRole = isBuyerOrCreator ? 'Oferente' : 'Buscando';
        isClosed = false; 
    }

    return (
        <main className="flex flex-col h-screen bg-slate-50 text-gray-900 font-sans relative">
            <MandatoryReviewModal /> {/* <-- EL EFECTO UBER ESTÁ ACTIVO AQUÍ TAMBIÉN */}

            <header className="bg-white border-b border-gray-200 p-4 shadow-sm z-10">
                <div className="container mx-auto max-w-4xl flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-gray-400 hover:text-[#1a237e] text-xl transition-colors font-bold">←</Link>
                        <div className="h-12 w-12 rounded-full bg-[#1a237e]/10 flex items-center justify-center font-black text-[#1a237e] text-xl shrink-0">
                            {otherUser?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                            <h1 className="font-black text-gray-900 text-lg flex items-center gap-2">
                                {otherUser?.name || 'Usuario'}
                                <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-md text-gray-600 uppercase tracking-widest font-black border border-gray-200">{displayRole}</span>
                            </h1>
                            <p className="text-xs text-gray-500 font-medium truncate max-w-[200px] md:max-w-[400px]">{displayTitle}</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end shrink-0">
                        {isTransaction && chatData.transaction ? (
                            <>
                                {chatData.transaction.state === 'PENDING' && <span className="px-3 py-1 rounded-md text-[10px] font-black uppercase bg-yellow-100 text-yellow-700">⏳ ESPERANDO PAGO</span>}
                                {chatData.transaction.state === 'PAID_HELD' && <span className="px-3 py-1 rounded-md text-[10px] font-black uppercase bg-blue-100 text-[#1a237e]">🛡️ PAGO RETENIDO</span>}
                                {chatData.transaction.state === 'FUNDS_RELEASED' && <span className="px-3 py-1 rounded-md text-[10px] font-black uppercase bg-green-100 text-green-700">✅ FINALIZADO</span>}
                            </>
                        ) : (
                            <span className="px-3 py-1 rounded-md text-[10px] font-black uppercase bg-purple-100 text-purple-800">🔄 MERCADO INVERSO</span>
                        )}
                    </div>
                </div>
            </header>

            <div className="bg-white border-b border-gray-200 p-3 shadow-sm">
                <div className="container mx-auto max-w-4xl flex items-center justify-between gap-3 text-sm">
                    {!isTransaction ? (
                        <div className="w-full flex items-center justify-between bg-purple-50 p-3 rounded-xl border border-purple-100">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🤝</span>
                                <p className="text-purple-900 font-medium text-xs sm:text-sm">
                                    <strong>Conexión Directa.</strong> Acuerden por chat.
                                </p>
                            </div>
                            {!isBuyerOrCreator && (
                                <button onClick={() => setShowOfferModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-md transition-transform hover:-translate-y-0.5 shrink-0">
                                    💳 Generar Oferta
                                </button>
                            )}
                        </div>
                    ) : (
                        chatData.transaction?.state === 'FUNDS_RELEASED' ? (
                            <div className="w-full text-green-700 font-bold bg-green-50 p-3 rounded-xl text-center flex justify-between items-center px-4">
                                <span>✅ Operación concluida exitosamente.</span>
                                {isBuyerOrCreator && (
                                    <button onClick={() => window.dispatchEvent(new Event('forceReviewCheck'))} className="text-green-800 text-xs font-black underline hover:text-green-900">
                                        Dejar una Reseña
                                    </button>
                                )}
                            </div>
                        ) : chatData.transaction?.state === 'PENDING' ? (
                            <div className="w-full flex justify-between items-center bg-yellow-50 p-3 rounded-xl border border-yellow-100 px-4">
                                <div>
                                    <span className="font-bold text-yellow-800 block">Acuerdo de pago por ${chatData.transaction.amount}</span>
                                    {isBuyerOrCreator && <span className="text-xs text-yellow-600">Asegura tu pago para avanzar.</span>}
                                </div>
                                <div className="flex gap-2">
                                    {isBuyerOrCreator ? (
                                        <a href={`/checkout/${chatData.transaction.id}`} className="bg-yellow-500 hover:bg-yellow-600 text-white font-black px-4 py-2 rounded-xl shadow-md transition-transform hover:-translate-y-0.5 whitespace-nowrap text-xs flex items-center justify-center">
                                            💳 Ir a Pagar
                                        </a>
                                    ) : (
                                        <button onClick={handleSimulatePayment} disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-black px-4 py-2 rounded-xl shadow-md transition-transform hover:-translate-y-0.5 whitespace-nowrap text-xs flex items-center justify-center">
                                            💰 Dar de Alta Pago (Test)
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center w-full px-2">
                                <span className="text-gray-600 font-bold text-sm">🛡️ Dinero protegido en fideicomiso.</span>
                                {isBuyerOrCreator ? (
                                    <div className="flex gap-2">
                                        <button onClick={() => setShowConfirmModal(true)} className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded-lg font-bold shadow transition-colors">Liberar Dinero</button>
                                        <button onClick={() => setShowDisputeModal(true)} className="text-[#d50000] hover:text-red-800 text-xs font-bold px-2 transition-colors">Problema</button>
                                    </div>
                                ) : (
                                    <span className="bg-blue-50 text-[#1a237e] text-xs font-black px-3 py-1.5 rounded-lg border border-blue-100">ENTREGA EL PRODUCTO</span>
                                )}
                            </div>
                        )
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 scroll-smooth">
                <div className="container mx-auto max-w-4xl flex flex-col gap-4">
                    <div className="text-center py-6 text-gray-400 text-xs font-bold uppercase tracking-widest">Inicio de la conversación</div>
                    {messages.map((msg) => {
                        const isMe = msg.sender.id === currentUserId;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-3 text-[15px] font-medium shadow-sm ${isMe ? 'bg-[#1a237e] text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'}`}>
                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    <span className={`text-[10px] block text-right mt-2 font-bold uppercase ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="bg-white border-t border-gray-200 p-4 pb-6 md:pb-4 shadow-sm">
                {isClosed ? (
                    <div className="container mx-auto max-w-4xl text-center text-gray-400 font-bold py-3 bg-slate-50 rounded-xl border border-dashed border-gray-200">Chat finalizado.</div>
                ) : (
                    <form onSubmit={handleSend} className="container mx-auto max-w-4xl flex gap-3">
                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escribe un mensaje..." className="flex-1 bg-slate-50 border border-gray-200 rounded-xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-[#1a237e]" />
                        <button type="submit" disabled={sending || !newMessage.trim()} className="bg-[#1a237e] text-white font-black rounded-xl px-6 hover:-translate-y-0.5 disabled:opacity-50">Enviar</button>
                    </form>
                )}
            </div>

            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                    <div className="bg-white border border-gray-100 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                        <h3 className="text-2xl font-black text-gray-900 mb-2">✅ Confirmar Recepción</h3>
                        <p className="text-gray-600 text-sm mb-6">
                            ¿Estás seguro de que recibiste el producto o servicio conforme a lo acordado? 
                            Al confirmar, los fondos retenidos se liberarán en la cuenta del vendedor y no habrá vuelta atrás.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={handleConfirmDelivery} disabled={actionLoading} className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl shadow disabled:opacity-50">
                                {actionLoading ? '⏳ Procesando...' : 'Sí, Liberar Dinero'}
                            </button>
                            <button onClick={() => setShowConfirmModal(false)} className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDisputeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                    <div className="bg-white border border-gray-100 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                        <h3 className="text-2xl font-black text-[#d50000] mb-2">⚖️ Iniciar Disputa</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Los fondos se mantendrán retenidos y un administrador de Mission Vende revisará el caso. Explica detalladamente el problema:
                        </p>
                        <textarea 
                            value={disputeReason} 
                            onChange={(e) => setDisputeReason(e.target.value)} 
                            placeholder="Ej: El producto llegó roto / El servicio no se prestó..."
                            className="w-full bg-slate-50 border border-gray-200 rounded-xl p-4 min-h-[120px] outline-none focus:ring-2 focus:ring-[#d50000] mb-6 text-sm"
                        />
                        <div className="flex gap-3">
                            <button onClick={handleOpenDispute} disabled={actionLoading || disputeReason.trim().length < 20} className="flex-1 px-4 py-3 bg-[#d50000] hover:bg-red-700 text-white font-black rounded-xl shadow disabled:opacity-50">
                                {actionLoading ? '⏳' : 'Abrir Disputa'}
                            </button>
                            <button onClick={() => setShowDisputeModal(false)} className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50">
                                Cancelar
                            </button>
                        </div>
                        {disputeReason.length > 0 && disputeReason.length < 20 && (
                            <p className="text-xs text-red-500 mt-3 text-center">Escribe al menos 20 caracteres explicando tu situación.</p>
                        )}
                    </div>
                </div>
            )}

            {showOfferModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                    <div className="bg-white border border-gray-100 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Crear Oferta de Pago</h3>
                        <p className="text-gray-500 text-sm mb-6">El comprador recibirá un botón para pagarte a través de la pasarela segura. Tu anuncio dejará de recibir ofertas.</p>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Precio Total ($)</label>
                        <input type="number" value={offerAmount} onChange={e => setOfferAmount(e.target.value)} placeholder="Ej: 50000" className="w-full bg-slate-50 border border-gray-200 rounded-xl p-4 text-xl font-black text-[#1a237e] outline-none focus:ring-2 focus:ring-[#1a237e] mb-4 text-center"/>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Concepto Breve</label>
                        <input type="text" value={offerDescription} onChange={e => setOfferDescription(e.target.value)} placeholder="Mano de obra y materiales" className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#1a237e] mb-6"/>
                        <div className="flex gap-3">
                            <button onClick={handleGenerateOffer} disabled={actionLoading || !offerAmount} className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow disabled:opacity-50">
                                {actionLoading ? '⏳' : 'Generar Link'}
                            </button>
                            <button onClick={() => setShowOfferModal(false)} className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}