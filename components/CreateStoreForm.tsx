// src/components/CreateStoreForm.tsx
"use client";

import { useState } from 'react';

type StoreType = 'PRODUCT_STORE' | 'SERVICE_PROFESSIONAL' | 'DIGITAL_CREATOR';

type CreateStoreFormProps = {
    onSuccess: (store: any) => void;
    onCancel?: () => void;
    canCancel: boolean;
};

export default function CreateStoreForm({ onSuccess, onCancel, canCancel }: CreateStoreFormProps) {
    // Estados base de la Tienda
    const [newStoreName, setNewStoreName] = useState('');
    const [newStoreType, setNewStoreType] = useState<StoreType>('PRODUCT_STORE');
    const [newStoreCBU, setNewStoreCBU] = useState('');
    
    // Estados del Muro KYC (Task 53.4)
    const [needsKyc, setNeedsKyc] = useState(false); 
    const [cuil, setCuil] = useState('');
    const [dniFront, setDniFront] = useState<File | null>(null);
    const [dniBack, setDniBack] = useState<File | null>(null);
    const [selfie, setSelfie] = useState<File | null>(null);
    
    const [isSubmittingStore, setIsSubmittingStore] = useState(false);
    const [storeMessage, setStoreMessage] = useState('');

    const validateCBU = (cbu: string) => {
        const cleanCBU = cbu.replace(/\D/g, '');
        return cleanCBU.length === 22;
    };

    const handleCreateStore = async (e: React.FormEvent) => {
        e.preventDefault();
        setStoreMessage('');
        
        if(!newStoreName || !newStoreCBU) {
            setStoreMessage("Completa el nombre y el CBU/CVU."); return;
        }
        
        if (!validateCBU(newStoreCBU)) {
            setStoreMessage("Error Crítico: El CBU/CVU debe contener EXACTAMENTE 22 números.");
            return;
        }

        // Validación estricta si el Muro KYC está activo
        if (needsKyc) {
            if (!cuil || cuil.length < 10) {
                setStoreMessage("Debes ingresar un CUIT/CUIL válido.");
                return;
            }
            if (!dniFront || !dniBack || !selfie) {
                setStoreMessage("Debes adjuntar las 3 imágenes (Frente, Dorso y Selfie) para verificar tu identidad.");
                return;
            }
        }

        setIsSubmittingStore(true);
        const token = localStorage.getItem('token');

        try {
            // Nota Técnica: Actualmente se envía como JSON para mantener compatibilidad con tu backend.
            // Cuando habilitemos la subida real a S3/Supabase Storage, cambiaremos esto a FormData.
            const res = await fetch('https://mosstall-desa-production.up.railway.app/api/stores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    name: newStoreName,
                    type: newStoreType,
                    cbu: newStoreCBU.replace(/\D/g, ''),
                    // Si el KYC está activo, enviamos el CUIL en el campo DNI para pasar la validación
                    dni: needsKyc ? cuil.replace(/\D/g, '') : undefined 
                })
            });

            const data = await res.json();

            if (res.ok) {
                onSuccess(data); // Devolvemos la tienda al componente padre
            } else {
                // --- INTERCEPCIÓN DEL MURO KYC ---
                if (res.status === 403 && data.error === 'KYC_REQUIRED') {
                    setNeedsKyc(true); // Disparamos la vista del Wizard KYC
                    setStoreMessage('Requerimiento legal: Validá tu identidad para proteger el ecosistema.');
                } else if (res.status === 403 && data.error.includes('profesional')) {
                    alert(data.error);
                    window.location.href = '/perfil'; // Hard redirect fallback
                } else {
                    setStoreMessage(`Error: ${data.error || 'No se pudo crear el perfil.'}`);
                }
            }
        } catch (error) {
            setStoreMessage("Error de conexión al crear perfil.");
        } finally {
            setIsSubmittingStore(false);
        }
    };

    return (
        <div className="rounded-3xl bg-white p-8 shadow-xl border border-gray-100 text-center flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <span className="text-6xl mb-4">{needsKyc ? '📸' : '🏪'}</span>
            <h2 className="text-2xl font-black text-[#1a237e] mb-2">
                {needsKyc ? 'Verificación de Identidad (KYC)' : 'Crear Perfil Comercial'}
            </h2>
            <p className="text-gray-500 mb-6 max-w-md font-medium text-sm leading-relaxed">
                {needsKyc 
                    ? 'Por normativas de prevención de fraude y Fideicomiso, necesitamos validar tu identidad antes de habilitar tus cobros.'
                    : 'Antes de publicar, necesitamos configurar tu perfil. Este será el "Local" donde se agruparán tus publicaciones y métricas.'}
            </p>

            <form onSubmit={handleCreateStore} className="w-full max-w-sm text-left space-y-5">
                
                {/* --- VISTA 1: DATOS BÁSICOS DE LA TIENDA --- */}
                {!needsKyc && (
                    <div className="space-y-5 animate-in slide-in-from-left duration-300">
                        <div>
                            <label className="mb-1 block text-xs font-bold text-gray-500 uppercase tracking-widest">Nombre de tu Tienda / Perfil</label>
                            <input type="text" value={newStoreName} onChange={e=>setNewStoreName(e.target.value)} required placeholder="Ej: Electrónica Juan / Electricista Matriculado" className="w-full rounded-xl border border-gray-200 bg-slate-50 p-3.5 text-gray-900 font-bold focus:border-[#1a237e] focus:ring-2 outline-none transition-colors"/>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-bold text-gray-500 uppercase tracking-widest">Tipo de Actividad</label>
                            <select value={newStoreType} onChange={e=>setNewStoreType(e.target.value as StoreType)} className="w-full rounded-xl border border-gray-200 bg-slate-50 p-3.5 text-[#1a237e] font-black focus:border-[#1a237e] focus:ring-2 outline-none cursor-pointer">
                                <option value="PRODUCT_STORE">Venta de Productos Físicos</option>
                                <option value="SERVICE_PROFESSIONAL">Servicios Profesionales</option>
                                <option value="DIGITAL_CREATOR">Venta de Infoproductos / Creador</option>
                            </select>
                        </div>
                        <div className="relative">
                            <label className="mb-1 flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
                                <span>CBU / CVU de Cobro</span>
                                <span className={`text-[10px] ${newStoreCBU.replace(/\D/g, '').length === 22 ? 'text-green-600' : 'text-red-500'}`}>
                                    {newStoreCBU.replace(/\D/g, '').length}/22 dígitos
                                </span>
                            </label>
                            <input 
                                type="text" 
                                maxLength={22}
                                value={newStoreCBU} 
                                onChange={e => setNewStoreCBU(e.target.value.replace(/\D/g, ''))}
                                required 
                                placeholder="Ej: 0000003100000000000000" 
                                className={`w-full rounded-xl border-2 bg-slate-50 p-3.5 text-gray-900 font-bold focus:ring-2 outline-none transition-colors
                                    ${newStoreCBU && newStoreCBU.replace(/\D/g, '').length !== 22 ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-[#1a237e] focus:ring-[#1a237e]/20'}
                                `}
                            />
                        </div>
                    </div>
                )}

                {/* --- VISTA 2: WIZARD KYC (DOCUMENTACIÓN) --- */}
                {needsKyc && (
                    <div className="space-y-4 animate-in slide-in-from-right duration-500 bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 shadow-sm">
                        
                        <div>
                            <label className="mb-1 block text-xs font-black text-[#1a237e] uppercase tracking-widest">
                                CUIT / CUIL
                            </label>
                            <input 
                                type="text" 
                                maxLength={11}
                                value={cuil} 
                                onChange={e => setCuil(e.target.value.replace(/\D/g, ''))}
                                required 
                                placeholder="Sin guiones (Ej: 20123456789)" 
                                className="w-full rounded-xl border border-indigo-200 bg-white p-3 text-gray-900 font-bold focus:border-[#1a237e] focus:ring-2 focus:ring-indigo-200 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 bg-white rounded-xl p-3 cursor-pointer hover:bg-indigo-50 transition-colors group">
                                <span className="text-xl mb-1 group-hover:scale-110 transition-transform">🪪</span>
                                <span className="text-[10px] font-bold text-indigo-900 text-center">Frente DNI</span>
                                <span className="text-[9px] text-gray-400 mt-0.5">{dniFront ? '✅ Cargado' : 'Subir foto'}</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => setDniFront(e.target.files?.[0] || null)} />
                            </label>

                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 bg-white rounded-xl p-3 cursor-pointer hover:bg-indigo-50 transition-colors group">
                                <span className="text-xl mb-1 group-hover:scale-110 transition-transform">🪪</span>
                                <span className="text-[10px] font-bold text-indigo-900 text-center">Dorso DNI</span>
                                <span className="text-[9px] text-gray-400 mt-0.5">{dniBack ? '✅ Cargado' : 'Subir foto'}</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => setDniBack(e.target.files?.[0] || null)} />
                            </label>
                        </div>

                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 bg-white rounded-xl p-4 cursor-pointer hover:bg-indigo-50 transition-colors group">
                            <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">🤳</span>
                            <span className="text-xs font-bold text-indigo-900 text-center">Selfie (Prueba de vida)</span>
                            <span className="text-[10px] text-gray-400 mt-0.5">{selfie ? '✅ Archivo seleccionado' : 'Sácate una foto clara'}</span>
                            <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => setSelfie(e.target.files?.[0] || null)} />
                        </label>
                    </div>
                )}

                {/* --- BOTONERA --- */}
                <button 
                    type="submit" 
                    disabled={isSubmittingStore || newStoreCBU.replace(/\D/g, '').length !== 22} 
                    className={`w-full text-white font-black py-4 rounded-xl shadow-lg transition-transform mt-2
                        ${isSubmittingStore || newStoreCBU.replace(/\D/g, '').length !== 22 ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-[#1a237e] hover:bg-[#121858] hover:-translate-y-0.5 active:scale-[0.98]'}
                    `}
                >
                    {isSubmittingStore ? 'Validando...' : (needsKyc ? 'Subir Documentos y Crear Tienda 🔐' : 'Comenzar a Vender 🚀')}
                </button>
                
                {storeMessage && (
                    <div className={`p-3 rounded-lg text-center text-xs font-bold animate-in zoom-in duration-200 ${needsKyc ? 'bg-red-50 text-[#d50000] border border-red-100' : 'bg-gray-50 text-gray-600'}`}>
                        {storeMessage}
                    </div>
                )}
                
                {canCancel && onCancel && !needsKyc && (
                    <button type="button" onClick={onCancel} className="w-full text-center text-gray-400 hover:text-gray-600 text-sm font-bold mt-4 transition-colors">
                        Cancelar y usar perfil existente
                    </button>
                )}
            </form>
        </div>
    );
}