// src/components/MandatoryReviewModal.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MandatoryReviewModal() {
  const router = useRouter();
  
  // Estados de Visibilidad y Flujo
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState<'REVIEW' | 'REPORT'>('REVIEW');
  
  // Datos de la transacción pendiente
  const [pendingTx, setPendingTx] = useState<any>(null);
  
  // Estados del Formulario de Reseña
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados del Formulario de Reporte
  const [reportReason, setReportReason] = useState('TECHNICAL_ISSUE');
  const [reportDetails, setReportDetails] = useState('');

  // 1. Verificación Inicial y Oído del Evento Global
  useEffect(() => {
    // Verificación estándar al cargar la página
    if (!sessionStorage.getItem('review_modal_dismissed')) {
        checkPendingReviews();
    }

    // EL OÍDO: Escuchamos el "grito" desde cualquier parte de la app
    const handleForceReview = () => {
        sessionStorage.removeItem('review_modal_dismissed'); 
        checkPendingReviews(); 
    };

    window.addEventListener('forceReviewCheck', handleForceReview);

    // Limpiamos el evento si el componente se desmonta
    return () => window.removeEventListener('forceReviewCheck', handleForceReview);
  }, []);

  const checkPendingReviews = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('https://mosstall-desa-production.up.railway.app/api/user/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.notifications?.pendingReviews && data.notifications.pendingReviews.length > 0) {
            setPendingTx(data.notifications.pendingReviews[0]);
            setShowModal(true); 
        }
      }
    } catch (error) {
      console.error("Error verificando pendientes", error);
    }
  };

  const handleSubmitReview = async () => {
    if (!pendingTx) return;
    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('https://mosstall-desa-production.up.railway.app/api/reviews', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
            transactionId: pendingTx.id,
            rating,
            comment
        })
      });

      if (res.ok || res.status === 409) {
          alert("¡Gracias! Tu calificación ayuda a mejorar la comunidad.");
          closeAndFreeUser();
      } else {
          const d = await res.json();
          alert(`Error: ${d.error || 'Intenta nuevamente.'}`);
      }
    } catch (error) {
      alert("Error de conexión. Si persiste, usa la opción de 'Reportar Problema'.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!pendingTx) return;
    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    try {
        await fetch('https://mosstall-desa-production.up.railway.app/api/reports', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                reportedId: pendingTx.seller?.id || 'SYSTEM',
                reason: reportReason,
                details: `[VÁLVULA DE ESCAPE] TX_ID: ${pendingTx.id}. Motivo: ${reportDetails}`
            })
        });

        alert("Reporte enviado. Hemos liberado tu acceso temporalmente.");
        closeAndFreeUser();

    } catch (error) {
        alert("Reporte registrado localmente. Puedes continuar.");
        closeAndFreeUser();
    } finally {
        setIsSubmitting(false);
    }
  };

  // BRIEF #041: Válvula para desactivar el bloqueo temporalmente
  const closeAndFreeUser = () => {
      setShowModal(false);
      sessionStorage.setItem('review_modal_dismissed', 'true');
      window.location.reload(); 
  };

  if (!showModal || !pendingTx) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

            <div className="p-8">
                {view === 'REVIEW' && (
                    <div className="text-center animate-in slide-in-from-right duration-300">
                        <div className="text-5xl mb-4">🌟</div>
                        <h2 className="text-2xl font-bold text-white mb-2">¡Finalizaste una operación!</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            Para asegurar la calidad de Mission Vende, es <strong>obligatorio</strong> calificar tu experiencia con:
                            <br/>
                            <span className="text-yellow-400 font-bold text-lg mt-1 block">"{pendingTx.product?.title || 'Acuerdo Privado'}"</span>
                        </p>

                        <div className="flex justify-center gap-3 mb-6">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button 
                                    key={star} 
                                    onClick={() => setRating(star)} 
                                    className={`text-4xl transition-transform hover:scale-125 focus:outline-none ${rating >= star ? 'text-yellow-400 drop-shadow-lg' : 'text-gray-700'}`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>

                        <textarea 
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none mb-6 h-24 resize-none placeholder-gray-500 text-sm"
                            placeholder="Escribe una breve reseña (opcional)..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />

                        <button 
                            onClick={handleSubmitReview}
                            disabled={isSubmitting}
                            className="w-full py-3.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-lg shadow-lg shadow-yellow-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                        >
                            {isSubmitting ? 'Guardando...' : 'ENVIAR CALIFICACIÓN'}
                        </button>

                        <div className="mt-6 pt-4 border-t border-gray-800 flex justify-center">
                            <button 
                                onClick={() => setView('REPORT')}
                                className="text-xs text-gray-500 hover:text-gray-300 underline transition-colors"
                            >
                                Tengo un problema técnico / No puedo calificar
                            </button>
                        </div>
                    </div>
                )}

                {view === 'REPORT' && (
                    <div className="animate-in slide-in-from-right duration-300 text-left">
                        <button onClick={() => setView('REVIEW')} className="text-gray-400 hover:text-white mb-4 text-sm">← Volver</button>
                        <h2 className="text-xl font-bold text-red-400 mb-4">Reportar Incidente</h2>
                        <p className="text-gray-400 text-xs mb-4 leading-relaxed">
                            Si ocurrió un error técnico o un inconveniente grave que te impide calificar, reportalo aquí. Liberaremos tu cuenta temporalmente mientras lo revisamos.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 font-bold">MOTIVO DEL REPORTE</label>
                                <select 
                                    className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                >
                                    <option value="TECHNICAL_ISSUE">Falla técnica en la plataforma</option>
                                    <option value="DID_NOT_RECEIVE">Cancelado / No recibí lo acordado</option>
                                    <option value="HARASSMENT">Conducta inapropiada / Estafa</option>
                                    <option value="OTHER">Otro motivo</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 font-bold">DETALLES (OBLIGATORIO)</label>
                                <textarea 
                                    className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white text-sm h-24 resize-none focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                                    placeholder="Describe brevemente el problema..."
                                    value={reportDetails}
                                    onChange={(e) => setReportDetails(e.target.value)}
                                />
                            </div>

                            <button 
                                onClick={handleSubmitReport}
                                disabled={isSubmitting || !reportDetails.trim()} 
                                className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                            >
                                {isSubmitting ? 'Enviando Reporte...' : 'CONFIRMAR Y SALIR'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}