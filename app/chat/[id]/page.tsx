// src/app/chat/[id]/page.tsx

"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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
    transaction: {
        id: string;
        status: string;
        amount: number;
        product: { title: string; type: string; price: number; images: string[] };
        buyer: User;
        seller: User;
    };
};

export default function ChatRoomPage() {
    const params = useParams();
    const router = useRouter();
    
    // --- DETECCIÓN INTELIGENTE DEL ID ---
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

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- HELPER: MANEJO DE SESIÓN EXPIRADA ---
    const handleSessionExpired = (showAlert = true) => {
        if (showAlert) {
            alert("🔒 Tu sesión ha expirado.\n\nPor motivos de seguridad, debes iniciar sesión nuevamente.");
        }
        localStorage.removeItem('token');
        router.push('/login');
    };

    // 1. OBTENER USUARIO
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setCurrentUserId(payload.userId);
        } catch (e) { router.push('/login'); }
    }, [router]);

    // 2. INICIALIZAR CHAT
    const initChat = async () => {
        console.log("🔍 Intentando iniciar chat con ID:", transactionId);
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`http://localhost:3001/api/chats/${transactionId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 403 || res.status === 401) {
                handleSessionExpired(true);
                return;
            }

            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || "No se pudo acceder al chat.");
            }

            const room = await res.json();
            
            if (!room || !room.transaction) {
                throw new Error("Datos de transacción incompletos.");
            }

            setChatData(room);
            await loadMessages(room.id, token);
            
        } catch (err: any) {
            console.error("Error iniciando chat:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (transactionId) {
            initChat();
        } else {
            if (params && Object.keys(params).length > 0) {
                 setError(`Error de Ruta: No se encuentra el ID.`);
                 setLoading(false);
            }
        }
    }, [transactionId, router, params]);

    // Función auxiliar para cargar mensajes
    const loadMessages = async (roomId: string, token: string) => {
        try {
            const resMessages = await fetch(`http://localhost:3001/api/chats/${roomId}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (resMessages.status === 403 || resMessages.status === 401) {
                handleSessionExpired(false);
                return;
            }

            if(resMessages.ok) setMessages(await resMessages.json());
        } catch (e) { console.error(e); }
    };

    // 3. POLLING (Actualizar mensajes cada 3 seg)
    useEffect(() => {
        if (!chatData) return;
        const interval = setInterval(() => {
            const token = localStorage.getItem('token');
            if (token) loadMessages(chatData.id, token);
        }, 3000);
        return () => clearInterval(interval);
    }, [chatData]);

    // 4. SCROLL AUTOMÁTICO
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // --- ACCIONES ---
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatData) return;
        setSending(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:3001/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ chatRoomId: chatData.id, content: newMessage })
            });

            if (res.status === 403 || res.status === 401) {
                handleSessionExpired(true);
                return;
            }

            if (res.ok) {
                setNewMessage('');
                await loadMessages(chatData.id, token!);
            } else { alert("Error al enviar"); }
        } catch (error) { console.error(error); } finally { setSending(false); }
    };

    // --- ACCIONES DE ESCROW (LIBERACIÓN REAL) ---
    const handleReleasePayment = async () => {
        if (!window.confirm("⚠️ ¿Estás seguro?\n\nAl confirmar que recibiste el producto/servicio, el dinero se liberará al vendedor y la garantía de MossTall finalizará.\n\nEsta acción es irreversible.")) return;
        
        setActionLoading(true);
        const token = localStorage.getItem('token');
        
        try {
            const res = await fetch(`http://localhost:3001/api/transactions/${chatData?.transaction.id}/release`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 403 || res.status === 401) {
                handleSessionExpired(true);
                return;
            }

            if (res.ok) {
                alert("🎉 ¡Transacción Completada!\n\nEl dinero ha sido liberado al vendedor. Gracias por usar MossTall.");
                // Actualizamos el estado local para reflejar el cambio en la UI inmediatamente
                if (chatData && chatData.transaction) {
                    setChatData({
                        ...chatData,
                        transaction: { ...chatData.transaction, status: 'COMPLETADO' }
                    });
                }
                // Opcional: Redirigir al dashboard para calificar
                // router.push('/dashboard'); 
            } else {
                const d = await res.json();
                alert(`Error: ${d.error || 'No se pudo liberar el pago.'}`);
            }

        } catch (error) {
            alert("Error de conexión al procesar la liberación.");
        } finally {
            setActionLoading(false);
        }
    };

    // --- RENDERIZADO ---
    if (loading) return (
        <main className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white gap-4">
            <div className="animate-spin text-4xl">⏳</div>
            <p className="text-gray-400">Cargando chat...</p>
        </main>
    );
    
    if (error) return (
        <main className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-2">Aviso</h1>
            <p className="text-gray-400 text-center max-w-md mb-6">{error}</p>
            <Link href="/dashboard" className="bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-500">Volver al Panel</Link>
        </main>
    );

    if (!chatData || !chatData.transaction) return null;

    const isBuyer = chatData.transaction.buyer.id === currentUserId;
    const otherUser = isBuyer ? chatData.transaction.seller : chatData.transaction.buyer;
    const isService = chatData.transaction.product.type === 'SERVICIO';
    const status = chatData.transaction.status;

    return (
        <main className="flex flex-col h-screen bg-gray-900 text-white">
            <header className="bg-gray-800 border-b border-gray-700 p-4 shadow-md z-10">
                <div className="container mx-auto max-w-3xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="text-gray-400 hover:text-white mr-2 text-xl">←</Link>
                        <div className="h-10 w-10 rounded-full bg-cyan-900 flex items-center justify-center font-bold border border-cyan-700">
                            {otherUser.name?.charAt(0) || '?'}
                        </div>
                        <div>
                            <h1 className="font-bold text-sm md:text-base flex items-center gap-2">
                                {otherUser.name}
                                <span className="text-[10px] bg-gray-700 px-2 py-0.5 rounded text-gray-300 uppercase">{isBuyer ? 'Vendedor' : 'Comprador'}</span>
                            </h1>
                            <p className="text-xs text-gray-400 truncate max-w-[200px]">{chatData.transaction.product.title}</p>
                        </div>
                    </div>
                    <div className={`px-3 py-1 rounded text-xs font-bold border ${status === 'COMPLETADO' ? 'bg-green-900/50 text-green-400 border-green-800' : 'bg-yellow-900/50 text-yellow-400 border-yellow-800'}`}>
                        {status === 'COMPLETADO' ? 'FINALIZADO' : 'EN PROCESO'}
                    </div>
                </div>
            </header>

            {/* --- BARRA DE ACCIÓN ESCROW --- */}
            <div className="bg-gray-800/80 border-b border-gray-700 p-3 backdrop-blur-sm transition-all duration-500">
                <div className="container mx-auto max-w-3xl flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
                    
                    {status === 'COMPLETADO' ? (
                        // ESTADO: COMPLETADO (ÉXITO)
                        <div className="w-full flex justify-between items-center bg-green-900/20 p-2 rounded border border-green-800/50">
                            <span className="text-green-400 font-bold flex items-center gap-2">✅ ¡Transacción Completada!</span>
                            {isBuyer && (
                                <Link href="/dashboard" className="text-xs bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded font-bold shadow animate-pulse">
                                    ⭐ Calificar Vendedor
                                </Link>
                            )}
                        </div>
                    ) : status === 'CANCELADO' ? (
                        // ESTADO: CANCELADO
                        <div className="w-full text-center text-red-400 font-bold p-2 bg-red-900/20 rounded border border-red-800/50">
                            🚫 Transacción Cancelada
                        </div>
                    ) : (
                        // ESTADO: ACTIVO (INICIADO / PAGADO)
                        <>
                            {isBuyer ? (
                                <>
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <span className="text-xl">🛡️</span>
                                        <p>Tu dinero está protegido.</p>
                                    </div>
                                    {/* Habilitamos el botón si está PAGADO (o INICIADO para pruebas) */}
                                    {status === 'PAGADO_EN_RETENCION' || status === 'INICIADO' ? (
                                        <button 
                                            onClick={handleReleasePayment}
                                            disabled={actionLoading}
                                            className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded shadow-lg transition-transform hover:scale-105 disabled:opacity-50 w-full md:w-auto flex items-center gap-2 justify-center"
                                        >
                                            {actionLoading ? <span className="animate-spin">⏳</span> : '✅ Confirmar Recepción'}
                                        </button>
                                    ) : (
                                        <span className="text-yellow-400 font-medium">Esperando confirmación de pago...</span>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <span className="text-xl">💰</span>
                                        <p>Recibirás ${chatData.transaction.amount} al finalizar.</p>
                                    </div>
                                    <span className="text-cyan-400 font-medium bg-cyan-900/20 px-3 py-1 rounded border border-cyan-800/50">
                                        {isService ? 'Realiza el trabajo' : 'Envía el producto'}
                                    </span>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-900 scroll-smooth">
                <div className="container mx-auto max-w-3xl flex flex-col gap-3">
                    <div className="text-center py-6 text-gray-500 text-xs">
                        <p>Inicio de la conversación • {new Date().toLocaleDateString()}</p>
                        <p className="mt-1">Protege tu privacidad.</p>
                    </div>
                    {messages.map((msg) => {
                        const isMe = msg.sender.id === currentUserId;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-none'}`}>
                                    <p>{msg.content}</p>
                                    <span className={`text-[10px] block text-right mt-1 opacity-70 ${isMe ? 'text-blue-200' : 'text-gray-500'}`}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="bg-gray-800 border-t border-gray-700 p-4">
                {status === 'CANCELADO' ? null : (
                    <form onSubmit={handleSend} className="container mx-auto max-w-3xl flex gap-2">
                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escribe un mensaje..." className="flex-1 bg-gray-900 border border-gray-600 rounded-full px-5 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                        <button type="submit" disabled={sending || !newMessage.trim()} className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-3 w-12 h-12 flex items-center justify-center shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">➤</button>
                    </form>
                )}
            </div>
        </main>
    );
}