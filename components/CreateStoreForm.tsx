// src/components/CreateStoreForm.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';

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

    // --- ESTADOS Y REFERENCIAS PARA CÁMARA WEBRTC BIOMÉTRICA ---
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cameraState, setCameraState] = useState<{ isOpen: boolean, target: 'dniFront' | 'dniBack' | 'selfie' | null }>({
        isOpen: false,
        target: null
    });

    // Limpieza de cámara al desmontar
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async (target: 'dniFront' | 'dniBack' | 'selfie') => {
        setCameraState({ isOpen: true, target });
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: target === 'selfie' ? 'user' : 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accediendo a la cámara:", err);
            alert("No se pudo acceder a la cámara. Por favor, verifica los permisos de tu navegador.");
            setCameraState({ isOpen: false, target: null });
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setCameraState({ isOpen: false, target: null });
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current && cameraState.target) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Si es selfie con cámara frontal, despejar el efecto espejo del video en el canvas
                if (cameraState.target === 'selfie') {
                    ctx.translate(canvas.width, 0);
                    ctx.scale(-1, 1);
                }
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `${cameraState.target}_${Date.now()}.jpg`, { type: 'image/jpeg' });
                        
                        if (cameraState.target === 'dniFront') setDniFront(file);
                        else if (cameraState.target === 'dniBack') setDniBack(file);
                        else if (cameraState.target === 'selfie') setSelfie(file);
                        
                        stopCamera();
                    }
                }, 'image/jpeg', 0.9);
            }
        }
    };

    const validateCBU = (cbu: string) => {
        const cleanCBU = cbu.replace(/\D/g, '');
        return cleanCBU.length === 22;
    };

    // Motor de escaneo OCR para evitar fotos basura (costo $0)
    const validateDocumentOCR = async (file: File, cuilStr: string): Promise<boolean> => {
        try {
            const { data: { text } } = await Tesseract.recognize(file, 'spa');
            const upperText = text.toUpperCase();
            
            // Extraer núcleo del DNI del formato CUIL (XY-DNI-Z)
            let coreDNI = cuilStr;
            if (cuilStr.length === 11) {
                coreDNI = cuilStr.substring(2, 10);
            }

            // Patrones clave ineludibles de un DNI argentino
            const keywords = ['REPÚBLICA', 'REPUBLICA', 'ARGENTINA', 'MERCOSUR', 'REGISTRO', 'TRAMITE', 'NACIONAL', 'DNI'];
            
            const hasKeyword = keywords.some(kw => upperText.includes(kw));
            const hasDNI = coreDNI.length >= 7 && upperText.includes(coreDNI);

            // Si encuentra palabras oficiales o el número de DNI, aprueba la foto.
            return hasKeyword || hasDNI;
        } catch (error) {
            console.error("Error en motor OCR:", error);
            return false; 
        }
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
                setStoreMessage("Debes capturar las 3 imágenes (Frente, Dorso y Selfie Biométrica) para verificar tu identidad.");
                return;
            }

            setIsSubmittingStore(true);
            setStoreMessage("Analizando legibilidad del DNI... No cierres esta ventana.");

            // Inspección Forense Pasiva por OCR
            const isValidDni = await validateDocumentOCR(dniFront, cuil);
            if (!isValidDni) {
                setStoreMessage("Error: La imagen subida no parece ser un DNI argentino válido o no es legible. Verifica la iluminación y vuelve a intentar.");
                setIsSubmittingStore(false);
                return;
            }
        }

        setIsSubmittingStore(true);
        setStoreMessage(needsKyc ? "Documento validado. Creando tu perfil comercial..." : "Creando tu perfil comercial...");
        
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('https://mosstall-desa-production.up.railway.app/api/stores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    name: newStoreName,
                    type: newStoreType,
                    cbu: newStoreCBU.replace(/\D/g, ''),
                    dni: needsKyc ? cuil.replace(/\D/g, '') : undefined 
                })
            });

            const data = await res.json();

            if (res.ok) {
                onSuccess(data); 
            } else {
                if (res.status === 403 && data.error === 'KYC_REQUIRED') {
                    setNeedsKyc(true); 
                    setStoreMessage('Requerimiento legal: Validá tu identidad para proteger el ecosistema.');
                } else if (res.status === 403 && data.error.includes('profesional')) {
                    alert(data.error);
                    window.location.href = '/perfil'; 
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
        <>
            <div className="rounded-3xl bg-white p-8 shadow-xl border border-gray-100 text-center flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <span className="text-6xl mb-4">{needsKyc ? '📸' : '🏪'}</span>
                <h2 className="text-2xl font-black text-[#1a237e] mb-2">
                    {needsKyc ? 'Verificación de Identidad (KYC)' : 'Crear Perfil Comercial'}
                </h2>
                <p className="text-gray-500 mb-6 max-w-md font-medium text-sm leading-relaxed">
                    {needsKyc 
                        ? 'Por normativas de prevención de fraude y Fideicomiso, necesitamos validar tu identidad con captura biométrica.'
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
                                {/* DNI Frente - Híbrido (Cámara o Archivo) */}
                                <div className="flex flex-col items-center justify-between border-2 border-dashed border-indigo-200 bg-white rounded-xl p-3 h-full">
                                    <span className="text-xl mb-1">🪪</span>
                                    <span className="text-[10px] font-bold text-indigo-900 text-center">Frente DNI</span>
                                    <span className={`text-[9px] mt-0.5 mb-2 font-bold ${dniFront ? 'text-green-600' : 'text-gray-400'}`}>
                                        {dniFront ? '✅ Capturado' : 'Pendiente'}
                                    </span>
                                    <div className="flex w-full gap-1 mt-auto">
                                        <button type="button" onClick={() => startCamera('dniFront')} className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold py-1.5 rounded-lg transition-colors">
                                            📸 Cámara
                                        </button>
                                        <label className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 text-[10px] font-bold py-1.5 rounded-lg text-center cursor-pointer transition-colors">
                                            📁 Archivo
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => setDniFront(e.target.files?.[0] || null)} />
                                        </label>
                                    </div>
                                </div>

                                {/* DNI Dorso - Híbrido (Cámara o Archivo) */}
                                <div className="flex flex-col items-center justify-between border-2 border-dashed border-indigo-200 bg-white rounded-xl p-3 h-full">
                                    <span className="text-xl mb-1">🪪</span>
                                    <span className="text-[10px] font-bold text-indigo-900 text-center">Dorso DNI</span>
                                    <span className={`text-[9px] mt-0.5 mb-2 font-bold ${dniBack ? 'text-green-600' : 'text-gray-400'}`}>
                                        {dniBack ? '✅ Capturado' : 'Pendiente'}
                                    </span>
                                    <div className="flex w-full gap-1 mt-auto">
                                        <button type="button" onClick={() => startCamera('dniBack')} className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold py-1.5 rounded-lg transition-colors">
                                            📸 Cámara
                                        </button>
                                        <label className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 text-[10px] font-bold py-1.5 rounded-lg text-center cursor-pointer transition-colors">
                                            📁 Archivo
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => setDniBack(e.target.files?.[0] || null)} />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Selfie - Exclusivo WebRTC (Cámara Biométrica) */}
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-300 bg-white rounded-xl p-4">
                                <span className="text-2xl mb-1">🤳</span>
                                <span className="text-xs font-black text-indigo-900 text-center">Selfie (Prueba de vida)</span>
                                <span className={`text-[10px] font-bold mt-1 mb-3 ${selfie ? 'text-green-600' : 'text-red-500'}`}>
                                    {selfie ? '✅ Verificación biométrica lista' : '⚠️ Obligatorio usar cámara web'}
                                </span>
                                <button 
                                    type="button" 
                                    onClick={() => startCamera('selfie')}
                                    className={`w-full py-2.5 rounded-xl text-xs font-bold text-white transition-colors shadow-sm
                                        ${selfie ? 'bg-green-600 hover:bg-green-700' : 'bg-[#1a237e] hover:bg-[#121858]'}
                                    `}
                                >
                                    {selfie ? '📸 Repetir Captura' : '📸 Iniciar Captura Facial'}
                                </button>
                            </div>
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
                        {isSubmittingStore ? 'Validando Documentos...' : (needsKyc ? 'Subir Documentos y Crear Tienda 🔐' : 'Comenzar a Vender 🚀')}
                    </button>
                    
                    {storeMessage && (
                        <div className={`p-3 rounded-lg text-center text-xs font-bold animate-in zoom-in duration-200 ${storeMessage.includes('Error') ? 'bg-red-50 text-[#d50000] border border-red-100' : 'bg-indigo-50 text-[#1a237e] border border-indigo-100'}`}>
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

            {/* --- MODAL DE CÁMARA WEBRTC NATIVA --- */}
            {cameraState.isOpen && (
                <div className="fixed inset-0 z-[9999] flex flex-col bg-black/95 backdrop-blur-sm animate-in fade-in duration-200">
                    {/* Header */}
                    <div className="w-full p-4 flex justify-between items-center text-white z-10 bg-gradient-to-b from-black/80 to-transparent">
                        <span className="font-black text-lg">Mission Vende KYC</span>
                        <button onClick={stopCamera} className="text-white bg-white/20 hover:bg-white/30 rounded-full w-10 h-10 flex items-center justify-center transition-colors">
                            ✕
                        </button>
                    </div>

                    {/* Visor de Cámara y Overlays */}
                    <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className={`w-full h-full object-cover ${cameraState.target === 'selfie' ? 'scale-x-[-1]' : ''}`} 
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* MÁSCARAS BIOMÉTRICAS SVG/CSS */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                            {cameraState.target === 'selfie' ? (
                                /* Óvalo Facial */
                                <div className="relative w-full max-w-sm aspect-[3/4] border-[6px] border-indigo-500 border-dashed rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] flex flex-col items-center justify-center">
                                    <span className="absolute -top-10 text-white font-bold text-sm bg-black/50 px-4 py-1 rounded-full text-center">
                                        Encuadrá tu rostro sin lentes ni accesorios
                                    </span>
                                </div>
                            ) : (
                                /* Recuadro Documento */
                                <div className="relative w-full max-w-md aspect-[85/54] border-4 border-indigo-400 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.8)] flex items-center justify-center">
                                    <span className="absolute -top-10 text-white font-bold text-sm bg-black/50 px-4 py-1 rounded-full text-center">
                                        Ubicá el DNI claro y legible dentro del marco
                                    </span>
                                    <div className="w-16 h-16 border-t-4 border-l-4 border-white absolute top-0 left-0 -mt-1 -ml-1"></div>
                                    <div className="w-16 h-16 border-t-4 border-r-4 border-white absolute top-0 right-0 -mt-1 -mr-1"></div>
                                    <div className="w-16 h-16 border-b-4 border-l-4 border-white absolute bottom-0 left-0 -mb-1 -ml-1"></div>
                                    <div className="w-16 h-16 border-b-4 border-r-4 border-white absolute bottom-0 right-0 -mb-1 -mr-1"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controles Inferiores */}
                    <div className="w-full p-6 pb-10 flex justify-center bg-gradient-to-t from-black to-transparent z-10">
                        <button 
                            onClick={capturePhoto}
                            className="w-20 h-20 bg-white/20 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/40 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        >
                            <div className="w-14 h-14 bg-white rounded-full"></div>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}