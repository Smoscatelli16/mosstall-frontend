// src/app/profile/edit/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBanking, setSavingBanking] = useState(false);
  const [bankingMessage, setBankingMessage] = useState('');

  // Estados del Formulario Perfil
  const [profession, setProfession] = useState('');
  const [biography, setBiography] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [education, setEducation] = useState('');
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);

  // Estados del Formulario Bancario (Brief #018)
  const [cbu, setCbu] = useState('');
  const [cvu, setCvu] = useState('');
  const [alias, setAlias] = useState('');

  // 1. Cargar datos existentes (Perfil + Banco)
  useEffect(() => {
    const fetchProfileAndBanking = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Ejecutamos ambas llamadas en paralelo para optimizar tiempos
        const [profileRes, bankingRes] = await Promise.all([
            fetch('http://mosstall-desa-production.up.railway.app/api/user/profile', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('http://mosstall-desa-production.up.railway.app/api/user/banking', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (profileRes.ok) {
          const data = await profileRes.json();
          if (data) {
            setProfession(data.profession || '');
            setBiography(data.biography || '');
            setExperienceYears(data.experienceYears ? String(data.experienceYears) : '');
            setEducation(data.education || '');
            setPortfolioImages(data.portfolioImages || []);
            setCertifications(data.certifications || []);
          }
        }

        if (bankingRes.ok) {
          const bankingData = await bankingRes.json();
          if (bankingData) {
              setCbu(bankingData.cbu || '');
              setCvu(bankingData.cvu || '');
              setAlias(bankingData.alias || '');
          }
        }
      } catch (error) {
        console.error("Error cargando datos", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndBanking();
  }, [router]);

  // 2. Manejar Carga de Imágenes
  const handleUpload = (stateSetter: React.Dispatch<React.SetStateAction<string[]>>, folderName: string) => {
    // @ts-ignore
    if (!window.cloudinary) {
        alert("El servicio de carga de imágenes no está disponible aún.");
        return;
    }

    // @ts-ignore
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: 'dpydplv3x', 
        uploadPreset: 'mosstall_uploads',
        sources: ['local', 'url', 'camera'],
        multiple: true,
        folder: folderName,
      },
      (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          const newUrl = result.info.secure_url;
          stateSetter(prev => [...prev, newUrl]);
        }
      }
    );
    widget.open();
  };

  const removeImage = (indexToRemove: number, stateSetter: React.Dispatch<React.SetStateAction<string[]>>) => {
      stateSetter(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  // 3. Guardar Datos del Perfil (Existente)
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missingFields = [];
    if (!profession.trim()) missingFields.push("Profesión");
    if (!biography.trim()) missingFields.push("Biografía");
    if (!experienceYears) missingFields.push("Años de experiencia");
    if (portfolioImages.length === 0) missingFields.push("Fotos de portafolio");
    
    if (missingFields.length > 0) {
        const confirmSave = window.confirm(
            `⚠️ Atención: Los siguientes campos están vacíos:\n\n- ${missingFields.join('\n- ')}\n\nUn perfil completo vende más. ¿Quieres guardar de todas formas?`
        );
        if (!confirmSave) return;
    }

    setSaving(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://mosstall-desa-production.up.railway.app/api/user/profile', {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            profession, biography, experienceYears, education, portfolioImages, certifications
        })
      });

      if (res.ok) {
        alert("¡Perfil actualizado con éxito!");
      } else {
        alert("Error al guardar el perfil.");
      }
    } catch (error) {
      alert("Error de conexión.");
    } finally {
      setSaving(false);
    }
  };

  // 4. Guardar Datos Bancarios (Nuevo Módulo Brief #018)
  const handleBankingSubmit = async () => {
    setBankingMessage('');
    
    if (!cbu && !cvu) {
        setBankingMessage('Error: Debes ingresar al menos un CBU o CVU.');
        return;
    }
    if (cbu && cbu.length !== 22) {
        setBankingMessage('Error: El CBU debe tener exactamente 22 dígitos numéricos.');
        return;
    }
    if (cvu && cvu.length !== 22) {
        setBankingMessage('Error: El CVU debe tener exactamente 22 dígitos numéricos.');
        return;
    }

    setSavingBanking(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://mosstall-desa-production.up.railway.app/api/user/banking', {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cbu, cvu, alias })
      });

      const data = await res.json();

      if (res.ok) {
        setBankingMessage("¡Datos bancarios validados y guardados!");
      } else {
        setBankingMessage(`Error: ${data.error || 'Verifica los datos ingresados'}`);
      }
    } catch (error) {
      setBankingMessage("Error de red al guardar datos bancarios.");
    } finally {
      setSavingBanking(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-[#1a237e] font-bold text-xl animate-pulse">Cargando tu perfil...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 p-4 md:p-8 font-sans">
      <Script 
        src="https://upload-widget.cloudinary.com/global/all.js" 
        onLoad={() => console.log('Cloudinary loaded')}
      />

      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-gray-100 p-6 md:p-12 shadow-sm space-y-12">
        
        {/* =========================================================================
            SECCIÓN A: PERFIL PROFESIONAL (PÚBLICO)
        ========================================================================= */}
        <section>
            <h1 className="text-3xl font-black mb-2 text-gray-900 tracking-tight">Editar Perfil Profesional</h1>
            <p className="text-gray-500 mb-8 font-medium">Completa tu información. Lo que dejes vacío, no se mostrará públicamente.</p>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
                
                {/* IDENTIDAD */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Profesión / Título</label>
                        <input 
                            type="text" value={profession} onChange={(e) => setProfession(e.target.value)}
                            placeholder="Ej: Electricista Matriculado"
                            className="w-full bg-slate-50 border border-gray-200 rounded-xl p-4 text-gray-900 font-medium focus:ring-2 focus:ring-[#1a237e] outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Años de Experiencia</label>
                        <input 
                            type="number" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)}
                            placeholder="Ej: 5"
                            className="w-full bg-slate-50 border border-gray-200 rounded-xl p-4 text-gray-900 font-medium focus:ring-2 focus:ring-[#1a237e] outline-none transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Biografía (Sobre mí)</label>
                    <textarea 
                        value={biography} onChange={(e) => setBiography(e.target.value)}
                        placeholder="Cuéntale a tus clientes sobre tu experiencia..."
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl p-4 text-gray-900 font-medium focus:ring-2 focus:ring-[#1a237e] outline-none h-32 resize-none transition-all"
                    />
                </div>

                {/* EDUCACIÓN Y CREDENCIALES */}
                <div className="pt-8 mt-8 border-t border-gray-100">
                    <h2 className="text-xl font-black text-gray-900 mb-6">Formación y Credenciales</h2>
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Institución / Título (Texto)</label>
                        <input 
                            type="text" value={education} onChange={(e) => setEducation(e.target.value)}
                            placeholder="Ej: Técnico en Refrigeración - UTN"
                            className="w-full bg-slate-50 border border-gray-200 rounded-xl p-4 text-gray-900 font-medium focus:ring-2 focus:ring-[#1a237e] outline-none transition-all"
                        />
                    </div>

                    <label className="block text-xs font-bold text-[#1a237e] mb-3 uppercase tracking-wider">📜 Fotos de Títulos / Matrículas / Certificados</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {certifications.map((img, idx) => (
                            <div key={idx} className="relative group aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                <img src={img} alt="Certificado" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeImage(idx, setCertifications)} className="absolute top-2 right-2 bg-[#d50000] text-white rounded-full w-7 h-7 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity font-bold shadow-md">✕</button>
                            </div>
                        ))}
                        <button type="button" onClick={() => handleUpload(setCertifications, 'mosstall_certifications')} className="flex flex-col items-center justify-center aspect-video bg-slate-50 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#1a237e] hover:bg-[#1a237e]/5 transition-colors text-gray-500 cursor-pointer">
                            <span className="text-2xl mb-1">🎓</span>
                            <span className="text-xs font-bold text-center px-2">Subir Título</span>
                        </button>
                    </div>
                </div>

                {/* PORTAFOLIO */}
                <div className="pt-8 border-t border-gray-100">
                    <h2 className="text-xl font-black text-gray-900 mb-4">Portafolio de Trabajos</h2>
                    <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Fotos de trabajos realizados (Antes/Después)</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {portfolioImages.map((img, idx) => (
                            <div key={idx} className="relative group aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                <img src={img} alt="Trabajo" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeImage(idx, setPortfolioImages)} className="absolute top-2 right-2 bg-[#d50000] text-white rounded-full w-7 h-7 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity font-bold shadow-md">✕</button>
                            </div>
                        ))}
                        <button type="button" onClick={() => handleUpload(setPortfolioImages, 'mosstall_portfolio')} className="flex flex-col items-center justify-center aspect-square bg-slate-50 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-600 hover:bg-green-50 transition-colors text-gray-500 cursor-pointer">
                            <span className="text-3xl mb-1">📷</span>
                            <span className="text-xs font-bold">Subir Foto</span>
                        </button>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <button type="button" onClick={() => router.back()} className="px-6 py-3.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" disabled={saving} className="px-8 py-3.5 rounded-xl bg-[#1a237e] hover:bg-[#121858] text-white font-black shadow-md disabled:opacity-50 transition-transform hover:-translate-y-0.5">
                        {saving ? 'Guardando...' : 'Guardar Perfil Público'}
                    </button>
                </div>
            </form>
        </section>

        {/* =========================================================================
            SECCIÓN B: DATOS DE COBRO (PRIVADO - BRIEF #018)
        ========================================================================= */}
        <section className="pt-10 border-t-2 border-gray-100">
            <h2 className="text-2xl font-black text-[#1a237e] mb-2">Datos de Cobro (Liquidación)</h2>
            <p className="text-gray-500 text-sm mb-8 font-medium">Esta información es privada. Es donde enviaremos el dinero de tus ventas a través de la red bancaria BIND.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">CBU (Cuenta Bancaria)</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={cbu}
                            onChange={(e) => {
                                const sanitized = e.target.value.replace(/\D/g, '');
                                if (sanitized.length <= 22) setCbu(sanitized);
                            }}
                            placeholder="Ingresa los 22 dígitos"
                            className={`w-full bg-slate-50 border ${cbu.length > 0 && cbu.length !== 22 ? 'border-[#d50000] focus:ring-[#d50000]' : 'border-gray-200 focus:ring-[#1a237e]'} rounded-xl p-4 text-gray-900 font-medium focus:ring-2 outline-none pr-16 transition-all`}
                        />
                        <span className={`absolute right-4 top-4 text-xs font-black tracking-widest ${cbu.length === 22 ? 'text-green-600' : 'text-gray-400'}`}>
                            {cbu.length}/22
                        </span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">CVU (Billetera Virtual)</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={cvu}
                            onChange={(e) => {
                                const sanitized = e.target.value.replace(/\D/g, '');
                                if (sanitized.length <= 22) setCvu(sanitized);
                            }}
                            placeholder="Ingresa los 22 dígitos"
                            className={`w-full bg-slate-50 border ${cvu.length > 0 && cvu.length !== 22 ? 'border-[#d50000] focus:ring-[#d50000]' : 'border-gray-200 focus:ring-[#1a237e]'} rounded-xl p-4 text-gray-900 font-medium focus:ring-2 outline-none pr-16 transition-all`}
                        />
                        <span className={`absolute right-4 top-4 text-xs font-black tracking-widest ${cvu.length === 22 ? 'text-green-600' : 'text-gray-400'}`}>
                            {cvu.length}/22
                        </span>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Alias (Opcional)</label>
                <input 
                    type="text" 
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="Ej: mi.nombre.mp"
                    className="w-full md:w-1/2 bg-slate-50 border border-gray-200 rounded-xl p-4 text-gray-900 font-medium focus:ring-2 focus:ring-[#1a237e] outline-none transition-all"
                />
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <button 
                    type="button" 
                    onClick={handleBankingSubmit}
                    disabled={savingBanking}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black shadow-md disabled:opacity-50 transition-transform hover:-translate-y-0.5"
                >
                    {savingBanking ? 'Verificando red bancaria...' : 'Guardar Datos de Cobro'}
                </button>
                {bankingMessage && (
                    <span className={`text-sm font-bold bg-white px-4 py-2 rounded-lg border ${bankingMessage.includes('Error') ? 'text-[#d50000] border-red-100' : 'text-green-700 border-green-100'}`}>
                        {bankingMessage}
                    </span>
                )}
            </div>
        </section>

      </div>
    </div>
  );
}