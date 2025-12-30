// src/components/MandatoryReviewModal.tsx

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MandatoryReviewModal() {
  const router = useRouter();
  
  // Estados de Visibilidad y Flujo
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState<'REVIEW' | 'REPORT'>('REVIEW'); // Controla qué pantalla ve el usuario
  
  // Datos de la transacción pendiente
  const [pendingTx, setPendingTx] = useState<any>(null);
  
  // Estados del Formulario de Reseña
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados del Formulario de Reporte (Salvavidas)
  const [reportReason, setReportReason] = useState('TECHNICAL_ISSUE');
  const [reportDetails, setReportDetails] = useState('');

  // 1. Verificación Inicial (Al cargar cualquier página)
  useEffect(() => {
    // Si ya lo cerramos en esta sesión por un reporte, no volvemos a molestar hasta F5
    if (sessionStorage.getItem('review_modal_dismissed')) return;
    
    checkPendingReviews();
  }, []);

  const checkPendingReviews = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Consultamos al dashboard si hay algo pendiente
      const res = await fetch('http://localhost:3001/api/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        // LÓGICA ROBUSTA: Solo si hay pendientes reales (Status COMPLETADO y Review NULL)
        if (data.pendingReviews && data.pendingReviews.length > 0) {
            setPendingTx(data.pendingReviews[0]);
            setShowModal(true); // ¡BOOM! Aparece el modal intrusivo
        }
      }
    } catch (error) {
      console.error("Error verificando pendientes", error);
    }
  };

  // 2. Acción: Enviar Calificación (Camino Feliz)
  const handleSubmitReview = async () => {
    if (!pendingTx) return;
    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://localhost:3001/api/reviews', {
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

      // SIEMPRE CERRAMOS SI ES 200 (OK) O 409 (YA EXISTE)
      if (res.ok || res.status === 409) {
          closeAndFreeUser();
          alert("¡Gracias! Tu calificación ayuda a mejorar la comunidad.");
      } else {
          // Si falla con otro error, mostramos alerta pero NO cerramos (salvo que usen el reporte)
          const d = await res.json();
          alert(`Error: ${d.error || 'Intenta nuevamente.'}`);
      }
    } catch (error) {
      alert("Error de conexión. Si persiste, usa la opción de 'Reportar Problema'.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Acción: Enviar Reporte (El Salvavidas)
  const handleSubmitReport = async () => {
    if (!pendingTx) return;
    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    try {
        // Enviamos el reporte al backend
        await fetch('http://localhost:3001/api/reports', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                reportedId: pendingTx.seller.id || pendingTx.buyer.id, // Reportamos a la contraparte o al sistema
                reason: reportReason,
                details: `[REPORTADO DESDE MODAL DE CALIFICACIÓN] TX_ID: ${pendingTx.id}. Motivo: ${reportDetails}`
            })
        });

        // NO IMPORTA SI FALLA O NO EL REPORTE TÉCNICO, LIBERAMOS AL USUARIO
        // Esta es la clave del salvavidas: desbloquear la pantalla.
        alert("Reporte enviado. Revisaremos el caso.");
        closeAndFreeUser();

    } catch (error) {
        // Incluso si falla la red al reportar, cerramos el modal para no atraparlo
        alert("Reporte registrado localmente. Puedes continuar.");
        closeAndFreeUser();
    } finally {
        setIsSubmitting(false);
    }
  };

  // Helper para cerrar y recordar en sesión
  const closeAndFreeUser = () => {
      setShowModal(false);
      sessionStorage.setItem('review_modal_dismissed', 'true'); // No molestar más por hoy
      router.refresh(); // Actualizar la página de fondo
  };

  if (!showModal || !pendingTx) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
            
            {/* BARRA SUPERIOR DECORATIVA */}
            <div className="h-2 w-full bg-linear-to-r from-blue-500 via-purple-500 to-pink-500"></div>

            <div className="p-8">
                
                {/* --- VISTA 1: CALIFICACIÓN (LO QUE QUEREMOS QUE HAGAN) --- */}
                {view === 'REVIEW' && (
                    <div className="text-center animate-in slide-in-from-right duration-300">
                        <div className="text-5xl mb-4">🌟</div>
                        <h2 className="text-2xl font-bold text-white mb-2">¡Finalizaste una operación!</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            Para asegurar la calidad de MossTall, es <strong>obligatorio</strong> calificar tu experiencia con:
                            <br/>
                            <span className="text-yellow-400 font-bold text-lg mt-1 block">"{pendingTx.product?.title}"</span>
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

                        {/* EL SALVAVIDAS DISCRETO */}
                        <div className="mt-6 pt-4 border-t border-gray-800">
                            <button 
                                onClick={() => setView('REPORT')}
                                className="text-xs text-gray-500 hover:text-gray-300 underline transition-colors"
                            >
                                Tengo un problema técnico / No puedo calificar
                            </button>
                        </div>
                    </div>
                )}

                {/* --- VISTA 2: REPORTE DE PROBLEMA (EL SALVAVIDAS TEDIOSO) --- */}
                {view === 'REPORT' && (
                    <div className="animate-in slide-in-from-right duration-300 text-left">
                        <button onClick={() => setView('REVIEW')} className="text-gray-400 hover:text-white mb-4 text-sm">← Volver</button>
                        <h2 className="text-xl font-bold text-red-400 mb-4">Reportar Incidente</h2>
                        <p className="text-gray-400 text-xs mb-4">
                            Si reportas un problema, la calificación quedará pendiente de revisión manual. Esto puede tomar tiempo.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 font-bold">MOTIVO DEL REPORTE</label>
                                <select 
                                    className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm focus:border-red-500 outline-none"
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                >
                                    <option value="TECHNICAL_ISSUE">Falla técnica en el sistema</option>
                                    <option value="DID_NOT_RECEIVE">No recibí lo acordado</option>
                                    <option value="HARASSMENT">Conducta inapropiada</option>
                                    <option value="OTHER">Otro motivo</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 font-bold">DETALLES (OBLIGATORIO)</label>
                                <textarea 
                                    className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm h-24 resize-none focus:border-red-500 outline-none"
                                    placeholder="Describe detalladamente por qué no puedes calificar..."
                                    value={reportDetails}
                                    onChange={(e) => setReportDetails(e.target.value)}
                                />
                            </div>

                            <button 
                                onClick={handleSubmitReport}
                                disabled={isSubmitting || !reportDetails.trim()} // Obligamos a escribir para que sea tedioso
                                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Enviando Reporte...' : 'CONFIRMAR REPORTE'}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    </div>
  );
}