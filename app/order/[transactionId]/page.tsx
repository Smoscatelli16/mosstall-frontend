// src/app/order/[transactionId]/page.tsx
"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type TransactionState = 'PENDING' | 'PAID_HELD' | 'DELIVERY_CONFIRMED' | 'FUNDS_RELEASED' | 'DISPUTED' | 'REFUNDED';

export default function OrderRoomPage() {
    const params = useParams();
    const router = useRouter();
    const transactionId = params.transactionId as string;

    const [chatRoom, setChatRoom] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    
    const chatEndRef = useRef<HTMLDivElement>(null);

    // 1. Inicialización y Fetching de Datos
    useEffect(() => {
        const initRoom = async () => {
            const token = localStorage.getItem('token');
            if (!token) return router.push('/login');

            try {
                // Obtener ID del usuario actual (Asumimos endpoint de perfil, o puedes leerlo del JWT)
                const userRes = await fetch('https://mosstall-desa-production.up.railway.app/api/user/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUserId(userData.id);
                }

                // Obtener Sala de Chat y Transacción
                const chatRes = await fetch(`https://mosstall-desa-production.up.railway.app/api/chat/${transactionId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (chatRes.ok) {
                    const roomData = await chatRes.json();
                    setChatRoom(roomData);
                    fetchMessages(roomData.id, token);
                }
            } catch (error) {
                console.error("Error cargando sala:", error);
            } finally {
                setLoading(false);
            }
        };

        initRoom();
    }, [transactionId, router]);

    // 2. Polling de Mensajes (Solo si la sala está activa)
    const fetchMessages = async (roomId: string, token: string) => {
        try {
            const res = await fetch(`https://mosstall-desa-production.up.railway.app/api/chat/room/${roomId}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const msgs = await res.json();
                setMessages(msgs);
                chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {}
    };

    useEffect(() => {
        if (!chatRoom) return;
        
        // Si está en un estado finalizado, no hacemos polling
        if (['FUNDS_RELEASED', 'DISPUTED', 'REFUNDED'].includes(chatRoom.transaction.state)) return;

        const token = localStorage.getItem('token');
        const intervalId = setInterval(() => {
            if (token) fetchMessages(chatRoom.id, token);
        }, 3000);

        return () => clearInterval(intervalId);
    }, [chatRoom]);

    // 3. Acciones del Chat
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatRoom) return;

        const token = localStorage.getItem('token');
        const content = newMessage;
        setNewMessage(''); // Limpiamos el input rápido para UX

        try {
            const res = await fetch('https://mosstall-desa-production.up.railway.app/api/chat/message', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ chatRoomId: chatRoom.id, content })
            });

            if (res.ok) {
                fetchMessages(chatRoom.id, token!);
            }
        } catch (error) {
            console.error("Error enviando mensaje");
        }
    };

    // 4. Botones de Poder (Resolución Financiera)
    const handleConfirmDelivery = async () => {
        if (!confirm('¿Estás seguro de que recibiste el producto/servicio en las condiciones acordadas? Esta acción liberará los fondos al vendedor y es irreversible.')) return;
        
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`https://mosstall-desa-production.up.railway.app/api/transactions/${transactionId}/confirm-delivery`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert('¡Entrega confirmada! Fondos liberados al vendedor.');
                window.location.reload();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error}`);
            }
        } catch (error) {
            alert('Error al procesar la solicitud.');
        }
    };

    const handleDispute = async () => {
        if (!confirm('¿Tuviste un problema y necesitas retener los fondos? Un administrador de MossTall revisará este chat como evidencia.')) return;
        
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`https://mosstall-desa-production.up.railway.app/api/transactions/${transactionId}/dispute`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert('Transacción pausada. Un administrador se contactará pronto.');
                window.location.reload();
            }
        } catch (error) {
            alert('Error al abrir la disputa.');
        }
    };

    if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Cargando Sala de Operaciones...</div>;
    if (!chatRoom) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Sala no encontrada o sin acceso.</div>;

    const tx = chatRoom.transaction;
    const isBuyer = userId === tx.buyerId;
    const isSeller = userId === tx.sellerId;
    const isClosed = ['FUNDS_RELEASED', 'DISPUTED', 'REFUNDED'].includes(tx.state);

    // Mapeo visual del Tracker
    const getTrackerUI = (state: TransactionState) => {
        switch (state) {
            case 'PAID_HELD': return { color: 'bg-yellow-500', text: 'Tu dinero está seguro en MossTall. Coordiná la entrega con el vendedor.' };
            case 'DISPUTED': return { color: 'bg-red-500', text: 'Transacción pausada. Un administrador está revisando el caso.' };
            case 'FUNDS_RELEASED': return { color: 'bg-green-500', text: 'Transacción finalizada. El dinero fue liberado al vendedor.' };
            case 'REFUNDED': return { color: 'bg-gray-500', text: 'Transacción cancelada y dinero devuelto.' };
            default: return { color: 'bg-blue-500', text: 'Procesando transacción...' };
        }
    };
    const tracker = getTrackerUI(tx.state);

    return (
        <main className="min-h-screen bg-[#121212] text-white p-4 md:p-8 flex flex-col md:flex-row gap-6 max-w-6xl mx-auto">
            
            {/* COLUMNA IZQUIERDA: Info y Tracker */}
            <div className="w-full md:w-1/3 flex flex-col gap-6">
                
                {/* 1. Tracker Visual del Fideicomiso */}
                <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-lg">
                    <div className={`${tracker.color} h-2 w-full animate-pulse`}></div>
                    <div className="p-5">
                        <h2 className="font-bold text-lg mb-2">Estado del Fideicomiso</h2>
                        <p className="text-gray-300 text-sm leading-relaxed">{tracker.text}</p>
                    </div>
                </div>

                {/* Info del Producto */}
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                    <h3 className="font-bold text-gray-400 text-xs uppercase tracking-wider mb-3">Detalle de la Orden</h3>
                    <div className="flex gap-4 items-center">
                        {tx.product?.images?.[0] ? (
                            <img src={tx.product.images[0]} alt="Producto" className="w-16 h-16 object-cover rounded-lg" />
                        ) : (
                            <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">📦</div>
                        )}
                        <div>
                            <p className="font-bold truncate">{tx.product?.title || 'Servicio Profesional'}</p>
                            <p className="text-green-400 font-medium">${Number(tx.targetNetAmount).toLocaleString('es-AR')}</p>
                        </div>
                    </div>
                </div>

                {/* 3. Botones de Poder (Renderizado Condicional) */}
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                    <h3 className="font-bold text-gray-400 text-xs uppercase tracking-wider mb-4">Acciones de Resolución</h3>
                    
                    {isSeller && tx.state === 'PAID_HELD' && (
                        <div className="bg-blue-900/30 border border-blue-800 p-4 rounded-lg text-sm text-blue-200">
                            Esperando que el comprador confirme la recepción para transferirte tus fondos.
                        </div>
                    )}

                    {isBuyer && tx.state === 'PAID_HELD' && (
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleConfirmDelivery}
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-colors"
                            >
                                ✅ Ya recibí el producto
                            </button>
                            <button 
                                onClick={handleDispute}
                                className="w-full bg-transparent border border-red-500 text-red-500 hover:bg-red-500/10 font-bold py-3 px-4 rounded-xl transition-colors"
                            >
                                ⚠️ Tengo un problema
                            </button>
                        </div>
                    )}

                    {isClosed && (
                        <div className="text-center text-gray-500 text-sm italic">
                            Acciones deshabilitadas. La transacción ya se encuentra cerrada.
                        </div>
                    )}
                </div>
            </div>

            {/* COLUMNA DERECHA: Chat Transaccional (Caja Negra) */}
            <div className="w-full md:w-2/3 bg-gray-800 rounded-xl border border-gray-700 shadow-xl flex flex-col h-[70vh] md:h-[85vh]">
                
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-700 bg-gray-900/50 rounded-t-xl flex justify-between items-center">
                    <div>
                        <h2 className="font-bold text-lg">Sala de Coordinación</h2>
                        <p className="text-xs text-gray-400">
                            Hablando con {isBuyer ? tx.seller.name : tx.buyer.name}
                        </p>
                    </div>
                    <span className="text-2xl">💬</span>
                </div>

                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0a]">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
                            <span className="text-4xl">🔒</span>
                            <p className="text-sm text-center max-w-xs">
                                Este chat es privado y sirve como evidencia legal para el Fideicomiso MossTall.
                            </p>
                        </div>
                    ) : (
                        messages.map((msg: any) => {
                            const isMe = msg.senderId === userId;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-700 text-gray-200 rounded-tl-none'}`}>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        <span className={`text-[10px] mt-1 block ${isMe ? 'text-blue-200 text-right' : 'text-gray-400 text-left'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Chat Input Area */}
                <div className="p-4 border-t border-gray-700 bg-gray-900/50 rounded-b-xl">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input 
                            type="text" 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={isClosed}
                            placeholder={isClosed ? "El chat se ha cerrado por seguridad." : "Escribe un mensaje para coordinar..."}
                            className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button 
                            type="submit" 
                            disabled={isClosed || !newMessage.trim()}
                            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-colors"
                        >
                            Enviar
                        </button>
                    </form>
                </div>

            </div>
        </main>
    );
}