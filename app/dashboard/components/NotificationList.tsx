// src/app/dashboard/components/NotificationList.tsx
import React from 'react';
import Link from 'next/link';

type NotificationListProps = {
  activeTab: 'preguntas' | 'mensajes';
  pendingQuestions: any[];
  answersReceived: any[];
  chats: any[];
  currentUserId: string | null;
  onMarkAsRead: (id: string) => void;
};

export default function NotificationList({ activeTab, pendingQuestions, answersReceived, chats, currentUserId, onMarkAsRead }: NotificationListProps) {
  
  if (activeTab === 'preguntas') {
    return (
      <div className="p-6 space-y-8">
        <div>
          <h3 className="text-lg font-black text-[#d50000] mb-4 flex items-center gap-2">
            🔴 Te Preguntaron <span className="text-[10px] bg-red-100 px-2.5 py-1 rounded-md text-red-700 uppercase tracking-widest">Pendiente</span>
          </h3>
          {(!pendingQuestions || pendingQuestions.length === 0) ? (
            <p className="text-gray-500 font-medium text-sm">Estás al día.</p>
          ) : (
            <div className="space-y-4">
              {pendingQuestions.map((q) => (
                <div key={q.id} className="flex flex-col md:flex-row gap-4 p-5 rounded-2xl bg-red-50 border border-red-100 items-start">
                  <div className="grow">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-600 font-medium">Sobre tu producto: <strong className="text-black">{q.product.title}</strong></span>
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">• {new Date(q.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-900 font-semibold text-[15px] italic mb-1">"{q.content}"</p>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">De: {q.asker.name || 'Usuario'}</p>
                  </div>
                  <Link href={`/product/${q.product.id}`} className="bg-[#d50000] hover:bg-[#b30000] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md whitespace-nowrap mt-2 md:mt-0 transition-colors">
                    Responder ➜
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
        <hr className="border-gray-100" />
        <div>
          <h3 className="text-lg font-black text-[#1a237e] mb-4 flex items-center gap-2">
            🔵 Te Respondieron <span className="text-[10px] bg-blue-50 px-2.5 py-1 rounded-md text-blue-700 uppercase tracking-widest">Novedades</span>
          </h3>
          {(!answersReceived || answersReceived.length === 0) ? (
            <p className="text-gray-500 font-medium text-sm">No has recibido respuestas nuevas.</p>
          ) : (
            <div className="space-y-4">
              {answersReceived.map((a) => (
                <div key={a.id} className="flex flex-col md:flex-row gap-4 p-5 rounded-2xl bg-blue-50 border border-blue-100 items-start">
                  <div className="grow">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-600 font-medium">En publicación: <strong className="text-black">{a.product.title}</strong></span>
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">• {new Date(a.answeredAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-500 text-[13px] mb-2 italic">Tú preguntaste: "{a.content}"</p>
                    <p className="text-gray-900 font-bold text-[15px] bg-white p-3 rounded-xl border-l-4 border-[#1a237e] shadow-sm">↳ Respuesta: "{a.answer}"</p>
                  </div>
                  <Link href={`/product/${a.product.id}`} onClick={() => onMarkAsRead(a.id)} className="text-[#1a237e] hover:underline text-sm font-bold self-center cursor-pointer mt-2 md:mt-0">
                    Ver publicación ➜
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'mensajes') {
    if (chats.length === 0) {
      return (
        <div className="text-center py-20 bg-slate-50 m-4 rounded-2xl border border-dashed border-gray-200">
          <p className="text-6xl mb-4">📭</p>
          <p className="text-gray-500 font-medium">No tienes conversaciones activas.</p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-gray-100">
        {chats.map((chat) => {
          
          let otherUser = { name: 'Usuario' };
          let roleLabel = '';
          let subjectTitle = '';
          let linkTarget = `/chat/${chat.id}`; // Usamos el ID de la sala por defecto

          // Lógica Híbrida: ¿Es Transacción o Necesidad?
          if (chat.transaction) {
            const isBuyer = chat.transaction.buyer.id === currentUserId;
            otherUser = isBuyer ? chat.transaction.seller : chat.transaction.buyer;
            roleLabel = isBuyer ? 'Vendedor' : 'Comprador';
            subjectTitle = chat.transaction.product?.title || 'Publicación eliminada';
            linkTarget = `/chat/${chat.transaction.id}`; // Soporte legado para rutas antiguas
          } else if (chat.needListing) {
            const isCreator = chat.needListing.userId === currentUserId;
            // Si soy el creador, el otro es quien me envió mensajes. Si soy el oferente, el otro es el creador.
            const offererFromMessages = chat.messages?.find((m: any) => m.senderId !== chat.needListing.userId)?.sender;
            
            otherUser = isCreator 
                ? (offererFromMessages || { name: 'Oferente' }) 
                : chat.needListing.user;
                
            roleLabel = isCreator ? 'Oferente' : 'Buscando';
            subjectTitle = chat.needListing.title;
          }

          const lastMessage = chat.messages?.[0];
          const unreadCount = chat._count?.messages || 0;

          return (
            <Link key={chat.id} href={linkTarget} className="block p-5 hover:bg-slate-50 transition-colors relative">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-full flex items-center justify-center text-xl font-black border shrink-0 relative ${chat.needListing ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-[#1a237e]/10 text-[#1a237e] border-[#1a237e]/20'}`}>
                    {otherUser.name?.charAt(0) || '?'}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#d50000] w-4 h-4 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                      {otherUser.name || 'Usuario'}
                      <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${chat.needListing ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                        {roleLabel}
                      </span>
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 font-medium">
                      <span className="text-gray-400">Sobre:</span> {subjectTitle}
                    </p>
                    <div className={`text-sm mt-1 truncate max-w-md ${unreadCount > 0 ? 'text-black font-bold' : 'text-gray-500 italic'}`}>
                      {lastMessage ? (
                        <>
                          <span className={`${unreadCount > 0 ? 'text-[#1a237e]' : 'text-gray-400 font-normal'}`}>{lastMessage.senderId === currentUserId ? 'Tú: ' : ''}</span>
                          {lastMessage.content}
                        </>
                      ) : (
                        <span className="text-gray-400">Chat iniciado.</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">{new Date(chat.updatedAt).toLocaleDateString()}</span>
                  {unreadCount > 0 && (
                    <span className="inline-block mt-2 bg-[#d50000] text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse shadow-sm">
                      {unreadCount} NUEVOS
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  return null;
}