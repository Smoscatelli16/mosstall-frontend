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
    const [newStoreName, setNewStoreName] = useState('');
    const [newStoreType, setNewStoreType] = useState<StoreType>('PRODUCT_STORE');
    const [newStoreCBU, setNewStoreCBU] = useState('');
    const [newStoreDNI, setNewStoreDNI] = useState('');
    
    const [needsDni, setNeedsDni] = useState(false); // Gatillo del Muro KYC
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

        if (needsDni && (!newStoreDNI || newStoreDNI.length < 7)) {
            setStoreMessage("Debes ingresar un DNI válido para verificar tu identidad comercial.");
            return;
        }

        setIsSubmittingStore(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('https://mosstall-desa-production.up.railway.app/api/stores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    name: newStoreName,
                    type: newStoreType,
                    cbu: newStoreCBU.replace(/\D/g, ''),
                    dni: needsDni ? newStoreDNI.replace(/\D/g, '') : undefined // Solo lo enviamos si se activó el Muro
                })
            });

            const data = await res.json();

            if (res.ok) {
                onSuccess(data); // Devolvemos la tienda al componente padre
            } else {
                // --- INTERCEPCIÓN DEL MURO KYC ---
                if (res.status === 403 && data.error === 'KYC_REQUIRED') {
                    setNeedsDni(true); // Desplegamos el campo DNI en la UI
                    setStoreMessage(data.message);
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
        <div className="rounded-3xl bg-white p-8 shadow-lg border border-purple-100 text-center flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <span className="text-6xl mb-4">🏪</span>
            <h2 className="text-2xl font-black text-[#1a237e] mb-2">Crear Perfil Comercial</h2>
            <p className="text-gray-600 mb-6 max-w-md font-medium">
                Antes de publicar, necesitamos configurar tu perfil. Este será el "Local" donde se agruparán tus publicaciones y métricas.
            </p>

            <form onSubmit={handleCreateStore} className="w-full max-w-sm text-left space-y-5">
                <div>
                    <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Nombre de tu Tienda / Perfil</label>
                    <input type="text" value={newStoreName} onChange={e=>setNewStoreName(e.target.value)} required placeholder="Ej: Electrónica Juan / Electricista Matriculado" className="w-full rounded-xl border border-gray-200 bg-slate-50 p-3.5 text-gray-900 font-medium focus:border-[#1a237e] focus:ring-2 outline-none"/>
                </div>
                <div>
                    <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Tipo de Actividad</label>
                    <select value={newStoreType} onChange={e=>setNewStoreType(e.target.value as StoreType)} className="w-full rounded-xl border border-gray-200 bg-slate-50 p-3.5 text-[#1a237e] font-black focus:border-[#1a237e] focus:ring-2 outline-none">
                        <option value="PRODUCT_STORE">Venta de Productos Físicos</option>
                        <option value="SERVICE_PROFESSIONAL">Servicios Profesionales</option>
                        <option value="DIGITAL_CREATOR">Venta de Infoproductos / Creador</option>
                    </select>
                </div>
                
                <div className="relative">
                    <label className="mb-1 flex items-center justify-between text-xs font-bold text-gray-500 uppercase">
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

                {/* --- DESPLIEGUE DEL MURO KYC CONDICIONAL --- */}
                {needsDni && (
                    <div className="relative p-4 bg-red-50 border border-red-200 rounded-xl animate-in slide-in-from-top-2 duration-300">
                        <label className="mb-1 block text-xs font-black text-[#d50000] uppercase">
                            DNI del Titular (Requerido por seguridad)
                        </label>
                        <input 
                            type="text" 
                            maxLength={8}
                            value={newStoreDNI} 
                            onChange={e => setNewStoreDNI(e.target.value.replace(/\D/g, ''))}
                            required 
                            placeholder="Sin puntos (Ej: 12345678)" 
                            className="w-full rounded-xl border-2 border-red-300 bg-white p-3.5 text-gray-900 font-bold focus:border-[#d50000] focus:ring-2 focus:ring-red-200 outline-none"
                        />
                        <p className="text-[10px] text-red-600 mt-2 font-bold leading-tight">
                            ⚠️ Por normativas de Fideicomiso, necesitamos tu DNI para habilitar los cobros. Solo te lo pediremos esta vez.
                        </p>
                    </div>
                )}
                {/* ------------------------------------------- */}

                <button 
                    type="submit" 
                    disabled={isSubmittingStore || newStoreCBU.replace(/\D/g, '').length !== 22} 
                    className={`w-full text-white font-black py-4 rounded-xl shadow-lg transition-transform mt-2
                        ${isSubmittingStore || newStoreCBU.replace(/\D/g, '').length !== 22 ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-[#1a237e] hover:bg-[#121858] hover:-translate-y-0.5'}
                    `}
                >
                    {isSubmittingStore ? 'Validando...' : (needsDni ? 'Verificar y Crear Tienda 🔐' : 'Comenzar a Vender 🚀')}
                </button>
                {storeMessage && <p className={`text-center text-sm font-bold mt-2 animate-pulse ${needsDni ? 'text-[#d50000]' : 'text-gray-600'}`}>{storeMessage}</p>}
                
                {canCancel && onCancel && (
                    <button type="button" onClick={onCancel} className="w-full text-center text-gray-400 hover:text-gray-600 text-sm font-bold mt-4">
                        Cancelar y usar perfil existente
                    </button>
                )}
            </form>
        </div>
    );
}