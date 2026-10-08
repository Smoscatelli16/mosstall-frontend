// src/app/admin/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// --- TIPOS DEL EXPEDIENTE FORENSE ---
type TransactionHistory = {
  id: string;
  oldState: string | null;
  newState: string;
  actorId: string;
  createdAt: string;
};

type DisputeCase = {
  id: string;
  state: string;
  grossAmount: number | string;
  sellerFinalAmount: number | string;
  createdAt: string;
  updatedAt: string;
  buyer: { name: string | null; email: string };
  seller: { name: string | null; email: string };
  product: { title: string; images: string[] } | null;
  history: TransactionHistory[];
};

export default function AdminDashboardPage() {
  const router = useRouter();

  // --- ESTADOS DE DATOS ---
  const [disputes, setDisputes] = useState<DisputeCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- ESTADOS DEL MODAL DE DICTAMEN ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [resolutionAction, setResolutionAction] = useState<'REFUNDED' | 'FUNDS_RELEASED' | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // --- 1. AUDITORÍA: CARGA DE CASOS ---
  const fetchDisputes = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('http://mosstall-desa-production.up.railway.app/api/transactions/disputes?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/dashboard');
          return;
        }
        throw new Error('Error al cargar el tribunal de disputas.');
      }

      const { data } = await response.json();
      setDisputes(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  // --- 2. APERTURA DE MODAL DE SEGURIDAD ---
  const handleOpenDictate = (id: string, action: 'REFUNDED' | 'FUNDS_RELEASED') => {
    setSelectedDisputeId(id);
    setResolutionAction(action);
    setConfirmText('');
    setIsModalOpen(true);
  };

  const closeAndResetModal = () => {
    setIsModalOpen(false);
    setSelectedDisputeId(null);
    setResolutionAction(null);
    setConfirmText('');
  };

  // --- 3. EJECUCIÓN FINANCIERA DEL FALLO ---
  const executeResolution = async () => {
    if (!selectedDisputeId || !resolutionAction) return;
    if (confirmText !== 'CONFIRMAR') return;

    setActionLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://mosstall-desa-production.up.railway.app/api/transactions/${selectedDisputeId}/resolve-dispute`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resolution: resolutionAction })
      });

      if (response.status === 502) {
        const errorData = await response.json();
        alert(`🚨 FALLO BANCARIO (502):\n\nLa red bancaria (BIND/Mercado Pago) rechazó la transferencia. El dinero sigue protegido en MossTall.\n\nDetalle técnico: ${errorData.details || errorData.error}\n\nIntente nuevamente en unos minutos.`);
        setActionLoading(false);
        closeAndResetModal();
        return;
      }

      if (!response.ok) {
        const d = await response.json();
        throw new Error(d.error || 'Fallo desconocido al resolver.');
      }

      alert('✅ Veredicto ejecutado con éxito. Dinero transferido.');
      setDisputes((prev) => prev.filter((d) => d.id !== selectedDisputeId));
      closeAndResetModal();

    } catch (err: any) {
      alert(`❌ Error del sistema:\n${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  if (loading) return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-4">
        <span className="animate-spin text-5xl text-red-600">⚖️</span>
        <p className="text-gray-400 font-bold tracking-widest">CARGANDO TRIBUNAL...</p>
      </div>
    </main>
  );

  if (error) return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
      <p className="text-red-400 bg-red-900/20 p-4 rounded border border-red-900">{error}</p>
    </main>
  );

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <span className="text-red-500">⚖️</span> Tribunal de Disputas
            </h1>
            <p className="text-gray-400 text-sm mt-1">Panel de resolución de conflictos y auditoría forense.</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-red-900/50 text-red-400 font-bold px-4 py-2 rounded border border-red-800">
              {disputes.length} Casos Abiertos
            </span>
            <Link href="/dashboard" className="text-gray-400 hover:text-white underline text-sm">Volver al Dashboard</Link>
          </div>
        </div>

        {disputes.length === 0 ? (
          <div className="text-center py-20 bg-gray-800 rounded-xl border border-gray-700">
            <p className="text-6xl mb-4">🕊️</p>
            <p className="text-gray-400 font-bold text-xl">Sin conflictos.</p>
            <p className="text-gray-500">No hay transacciones en disputa en este momento.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {disputes.map((tx) => (
              <div key={tx.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
                
                <div className="bg-gray-900 px-6 py-4 border-b border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div className="flex items-center gap-3">
                    <span className="bg-red-600 text-white text-xs font-black px-2 py-1 rounded animate-pulse">EN DISPUTA</span>
                    <span className="font-mono text-gray-400 text-xs">ID: {tx.id}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Monto Retenido</p>
                    <p className="text-2xl font-bold text-yellow-500">${Number(tx.grossAmount).toLocaleString('es-AR')}</p>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-6">
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Comprador (Demandante)</h4>
                      <p className="font-bold text-white text-lg">{tx.buyer.name || 'Usuario'}</p>
                      <p className="text-sm text-gray-400">{tx.buyer.email}</p>
                    </div>
                    
                    <div className="flex justify-center text-gray-600">
                      <span className="rotate-90 lg:rotate-0">⚔️</span>
                    </div>

                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Vendedor (Demandado)</h4>
                      <p className="font-bold text-white text-lg">{tx.seller.name || 'Usuario'}</p>
                      <p className="text-sm text-gray-400">{tx.seller.email}</p>
                    </div>
                  </div>

                  <div className="lg:col-span-1 space-y-4">
                    <h3 className="font-bold text-white border-b border-gray-700 pb-2">Objeto de Disputa</h3>
                    <div className="bg-gray-700/30 p-4 rounded flex items-start gap-4">
                      <div className="text-3xl">📦</div>
                      <div>
                        <p className="font-bold text-gray-200">{tx.product?.title || 'Producto Eliminado'}</p>
                        <p className="text-xs text-gray-400 mt-1">Fecha: {new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Link href={`/chat/${tx.id}`} target="_blank" className="block text-center bg-gray-700 hover:bg-gray-600 text-white text-sm py-3 rounded font-medium transition-colors">
                      🔍 Inspeccionar Chat (Evidencia)
                    </Link>
                  </div>

                  <div className="lg:col-span-1">
                    <h3 className="font-bold text-white border-b border-gray-700 pb-2 mb-4">Registro Forense (Log)</h3>
                    <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {tx.history.map((log) => (
                        <div key={log.id} className="relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-[-16px] before:w-[2px] before:bg-gray-700 last:before:hidden">
                          <div className={`absolute left-[3px] top-1.5 w-2.5 h-2.5 rounded-full ${log.newState === 'DISPUTED' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-gray-500'}`}></div>
                          <p className="text-xs text-gray-400 font-mono mb-1">{formatDateTime(log.createdAt)}</p>
                          <div className="bg-gray-900/50 p-2 rounded border border-gray-700/50 text-sm">
                            Estado: <span className="text-gray-300 font-bold">{log.oldState || 'INICIO'} ➔ {log.newState}</span><br/>
                            Actor: <span className="text-blue-400 text-xs">{log.actorId}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 p-4 border-t border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleOpenDictate(tx.id, 'REFUNDED')}
                    className="flex flex-col items-center justify-center p-4 rounded border-2 border-red-900 bg-red-900/20 text-red-500 hover:bg-red-900/40 hover:text-red-400 transition-colors group"
                  >
                    <span className="font-black text-lg uppercase tracking-wide">Fallo Comprador</span>
                    <span className="text-xs font-medium text-red-700 group-hover:text-red-400 mt-1">Ejecutar Reembolso en M. Pago</span>
                  </button>
                  <button 
                    onClick={() => handleOpenDictate(tx.id, 'FUNDS_RELEASED')}
                    className="flex flex-col items-center justify-center p-4 rounded border-2 border-green-900 bg-green-900/20 text-green-500 hover:bg-green-900/40 hover:text-green-400 transition-colors group"
                  >
                    <span className="font-black text-lg uppercase tracking-wide">Fallo Vendedor</span>
                    <span className="text-xs font-medium text-green-700 group-hover:text-green-400 mt-1">Liberar Fondos vía BIND</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="bg-gray-900 border border-red-600 p-8 rounded-xl w-full max-w-lg shadow-[0_0_50px_rgba(220,38,38,0.15)] relative">
            <div className="text-center mb-6">
              <span className="text-6xl">⚠️</span>
              <h2 className="text-2xl font-black text-white mt-4 uppercase">Autorización Crítica</h2>
              <p className={`mt-2 font-bold p-2 rounded ${resolutionAction === 'REFUNDED' ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'}`}>
                {resolutionAction === 'REFUNDED' 
                  ? 'ACCIÓN: REEMBOLSAR DINERO AL COMPRADOR' 
                  : 'ACCIÓN: TRANSFERIR FONDOS AL VENDEDOR'}
              </p>
            </div>
            
            <div className="bg-gray-800 p-4 rounded text-sm text-gray-300 mb-6 leading-relaxed">
              Esta acción comunicará a los servidores del banco para ejecutar un movimiento de fondos irrevocable. <strong className="text-red-400">No hay vuelta atrás.</strong> Asegúrese de haber revisado la evidencia forense correctamente.
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-500 mb-2">ESCRIBA "CONFIRMAR" PARA HABILITAR EL BOTÓN</label>
              <input 
                type="text" 
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="CONFIRMAR"
                className="w-full bg-black border-2 border-gray-700 focus:border-red-500 rounded p-4 text-white text-center font-black tracking-widest outline-none transition-colors"
                disabled={actionLoading}
              />
            </div>

            <div className="flex gap-4">
              <button 
                onClick={closeAndResetModal}
                disabled={actionLoading}
                className="flex-1 py-4 rounded font-bold text-gray-400 bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
              >
                CANCELAR
              </button>
              <button 
                onClick={executeResolution}
                disabled={confirmText !== 'CONFIRMAR' || actionLoading}
                className={`flex-1 py-4 rounded font-black text-white transition-all shadow-lg flex justify-center items-center gap-2 ${
                  confirmText === 'CONFIRMAR' && !actionLoading 
                    ? resolutionAction === 'REFUNDED' ? 'bg-red-600 hover:bg-red-500 hover:shadow-red-500/25' : 'bg-green-600 hover:bg-green-500 hover:shadow-green-500/25'
                    : 'bg-gray-700 cursor-not-allowed opacity-50'
                }`}
              >
                {actionLoading ? <span className="animate-spin text-xl">⏳</span> : 'EJECUTAR DICTAMEN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}