// app/se-busca/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface NeedListing {
  id: string;
  title: string;
  description: string;
  estimatedBudget: number | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
  };
}

export default function SeBuscaPage() {
  const router = useRouter();
  const [needs, setNeeds] = useState<NeedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Estados del Modal de Publicación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNeed, setNewNeed] = useState({ title: '', description: '', estimatedBudget: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNeeds = async () => {
    try {
      const res = await fetch('http://mosstall-desa-production.up.railway.app/api/needs');
      if (!res.ok) throw new Error('Error al cargar las necesidades');
      const data = await res.json();
      setNeeds(data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los anuncios. Intenta nuevamente más tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNeeds();
  }, []);

  const handleOffer = async (needId: string) => {
    setActionLoading(needId);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Debes iniciar sesión para ofrecer un producto.');
        router.push('/login?redirect=/se-busca');
        return;
      }

      const res = await fetch(`http://mosstall-desa-production.up.railway.app/api/chat/${needId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Manejo inteligente de sesión expirada
      if (res.status === 401) {
        localStorage.removeItem('token');
        alert('Tu sesión ha expirado o es inválida. Por favor, inicia sesión nuevamente.');
        router.push('/login?redirect=/se-busca');
        return;
      }

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al conectar con el comprador');

      router.push(`/chat/${data.id}`);

    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateNeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Debes iniciar sesión para publicar una necesidad.');
        router.push('/login?redirect=/se-busca');
        return;
      }

      const res = await fetch('http://mosstall-desa-production.up.railway.app/api/needs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newNeed)
      });

      // Manejo inteligente de sesión expirada
      if (res.status === 401) {
        localStorage.removeItem('token');
        alert('Tu sesión ha expirado o es inválida. Por favor, inicia sesión nuevamente.');
        router.push('/login?redirect=/se-busca');
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al publicar.');
      }

      // Reiniciamos formulario, cerramos modal y recargamos la lista
      setNewNeed({ title: '', description: '', estimatedBudget: '' });
      setIsModalOpen(false);
      fetchNeeds(); 

    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 relative">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Cabecera del Tablón */}
        <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <h1 className="text-3xl font-black text-[#1a237e] mb-2">Mercado Inverso</h1>
            <p className="text-slate-600 font-medium text-lg">
              ¿Tienes lo que buscan? Conecta directamente con compradores locales.
            </p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#d50000] hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors whitespace-nowrap shadow-md"
          >
            + Publicar Necesidad
          </button>
        </div>

        {/* Estados de carga y error */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a237e]"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center font-bold">
            {error}
          </div>
        )}

        {/* Grilla de Necesidades */}
        {!loading && !error && needs.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
            <span className="text-4xl mb-4 block">🔍</span>
            <h3 className="text-xl font-bold text-slate-800">No hay pedidos activos</h3>
            <p className="text-slate-500 mt-2">Actualmente nadie está buscando productos específicos.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!loading && needs.map((need) => (
            <div 
              key={need.id} 
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-blue-100 text-blue-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    Buscando
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {new Date(need.createdAt).toLocaleDateString('es-AR')}
                  </span>
                </div>
                
                <h3 className="text-lg font-black text-slate-900 mb-2 leading-tight">
                  {need.title}
                </h3>
                
                <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                  {need.description}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase">Presupuesto</span>
                  <span className="text-lg font-black text-emerald-600">
                    {need.estimatedBudget ? `$${need.estimatedBudget.toLocaleString('es-AR')}` : 'A convenir'}
                  </span>
                </div>

                <button
                  onClick={() => handleOffer(need.id)}
                  disabled={actionLoading === need.id}
                  className="w-full bg-[#1a237e] hover:bg-blue-800 text-white font-black py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {actionLoading === need.id ? (
                    <span className="animate-pulse">Conectando...</span>
                  ) : (
                    <>Tengo esto / Ofrecer</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* MODAL FLOTANTE PARA PUBLICAR NECESIDAD (Con Z-Index alto y scroll interno para móvil) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
            
            <div className="bg-[#1a237e] px-6 py-4 flex justify-between items-center shrink-0">
              <h2 className="text-white font-bold text-xl">Crear Necesidad</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleCreateNeed} className="p-6 overflow-y-auto">
              
              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-1">¿Qué estás buscando?</label>
                <input 
                  type="text" required
                  placeholder="Ej: VW Gol Power 2008-2010"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-slate-900 font-medium placeholder-slate-400"
                  value={newNeed.title}
                  onChange={(e) => setNewNeed({...newNeed, title: e.target.value})}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-1">Detalles específicos</label>
                <textarea 
                  required rows={4}
                  placeholder="Ej: Busco que esté en buen estado, papeles al día, pago de contado."
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 resize-none text-slate-900 font-medium placeholder-slate-400"
                  value={newNeed.description}
                  onChange={(e) => setNewNeed({...newNeed, description: e.target.value})}
                ></textarea>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-1">Presupuesto Estimado (Opcional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-500 font-bold">$</span>
                  <input 
                    type="number"
                    placeholder="0"
                    className="w-full border border-slate-300 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:border-blue-500 text-slate-900 font-medium placeholder-slate-400"
                    value={newNeed.estimatedBudget}
                    onChange={(e) => setNewNeed({...newNeed, estimatedBudget: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-2 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-[#d50000] hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Publicando...' : 'Publicar Ahora'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}