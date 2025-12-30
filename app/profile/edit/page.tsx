// src/app/profile/edit/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados del Formulario
  const [profession, setProfession] = useState('');
  const [biography, setBiography] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [education, setEducation] = useState('');
  
  // Imágenes
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]); // <--- NUEVO: Para títulos

  // 1. Cargar datos existentes
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('http://localhost:3001/api/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          // Si ya existe perfil, rellenamos el form
          if (data) {
            setProfession(data.profession || '');
            setBiography(data.biography || '');
            setExperienceYears(data.experienceYears ? String(data.experienceYears) : '');
            setEducation(data.education || '');
            setPortfolioImages(data.portfolioImages || []);
            setCertifications(data.certifications || []); // <--- Cargar certificaciones
          }
        }
      } catch (error) {
        console.error("Error cargando perfil", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  // 2. Manejar Carga de Imágenes (AHORA ES GENÉRICO)
  // Recibe el setter del estado correspondiente y la carpeta de destino
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
        folder: folderName, // Carpeta dinámica
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

  // Función genérica para borrar imagen de un estado específico
  const removeImage = (indexToRemove: number, stateSetter: React.Dispatch<React.SetStateAction<string[]>>) => {
      stateSetter(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  // 3. Guardar Datos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- VALIDACIÓN SUAVE (PUNTO 4) ---
    const missingFields = [];
    if (!profession.trim()) missingFields.push("Profesión");
    if (!biography.trim()) missingFields.push("Biografía");
    if (!experienceYears) missingFields.push("Años de experiencia");
    if (portfolioImages.length === 0) missingFields.push("Fotos de portafolio");
    
    // Si hay campos faltantes, preguntamos antes de guardar
    if (missingFields.length > 0) {
        const confirmSave = window.confirm(
            `⚠️ Atención: Los siguientes campos están vacíos:\n\n- ${missingFields.join('\n- ')}\n\nUn perfil completo vende más. ¿Quieres guardar de todas formas?`
        );
        if (!confirmSave) return; // Cancelamos el guardado si el usuario dice que no
    }
    // ----------------------------------

    setSaving(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://localhost:3001/api/user/profile', {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            profession,
            biography,
            experienceYears,
            education,
            portfolioImages,
            certifications // <--- Enviamos las certificaciones
        })
      });

      if (res.ok) {
        alert("¡Perfil actualizado con éxito!");
        router.push('/dashboard'); // Volver al panel
      } else {
        alert("Error al guardar el perfil.");
      }
    } catch (error) {
      alert("Error de conexión.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      {/* Script de Cloudinary */}
      <Script 
        src="https://upload-widget.cloudinary.com/global/all.js" 
        onLoad={() => console.log('Cloudinary loaded')}
      />

      <div className="max-w-3xl mx-auto bg-gray-800 rounded-xl border border-gray-700 p-6 md:p-8 shadow-2xl">
        <h1 className="text-3xl font-bold mb-2">Editar Perfil Profesional</h1>
        <p className="text-gray-400 mb-8">Completa tu información. Lo que dejes vacío, no se mostrará públicamente.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* SECCIÓN 1: IDENTIDAD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Profesión / Título</label>
                    <input 
                        type="text" 
                        value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        placeholder="Ej: Electricista Matriculado"
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Años de Experiencia</label>
                    <input 
                        type="number" 
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        placeholder="Ej: 5"
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Biografía (Sobre mí)</label>
                <textarea 
                    value={biography}
                    onChange={(e) => setBiography(e.target.value)}
                    placeholder="Cuéntale a tus clientes sobre tu experiencia, cómo trabajas y qué ofreces..."
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                />
            </div>

            {/* SECCIÓN 2: EDUCACIÓN Y CREDENCIALES (MODIFICADO PUNTO 2) */}
            <div className="pt-6 border-t border-gray-700">
                <h2 className="text-lg font-semibold text-white mb-4">Formación y Credenciales</h2>
                
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Institución / Título (Texto)</label>
                    <input 
                        type="text" 
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        placeholder="Ej: Técnico en Refrigeración - UTN"
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                {/* Subida de Títulos/Certificados */}
                <label className="block text-sm font-medium text-blue-300 mb-3">📜 Fotos de Títulos / Matrículas / Certificados</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {certifications.map((img, idx) => (
                        <div key={idx} className="relative group aspect-video bg-black rounded-lg overflow-hidden border border-blue-900/50">
                            <img src={img} alt="Certificado" className="w-full h-full object-cover opacity-90" />
                            <button 
                                type="button"
                                onClick={() => removeImage(idx, setCertifications)}
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    
                    <button 
                        type="button"
                        onClick={() => handleUpload(setCertifications, 'mosstall_certifications')}
                        className="flex flex-col items-center justify-center aspect-video bg-gray-900 border-2 border-dashed border-blue-800/50 rounded-lg hover:border-blue-500 hover:text-blue-400 transition-colors text-gray-400"
                    >
                        <span className="text-xl mb-1">🎓</span>
                        <span className="text-xs font-medium text-center px-2">Subir Título</span>
                    </button>
                </div>
            </div>

            {/* SECCIÓN 3: PORTAFOLIO */}
            <div className="pt-6 border-t border-gray-700">
                <h2 className="text-lg font-semibold text-white mb-4">Portafolio de Trabajos</h2>
                <label className="block text-sm font-medium text-gray-300 mb-3">Fotos de trabajos realizados (Antes/Después)</label>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {portfolioImages.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square bg-black rounded-lg overflow-hidden border border-gray-600">
                            <img src={img} alt="Trabajo" className="w-full h-full object-cover" />
                            <button 
                                type="button"
                                onClick={() => removeImage(idx, setPortfolioImages)}
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    
                    <button 
                        type="button"
                        onClick={() => handleUpload(setPortfolioImages, 'mosstall_portfolio')}
                        className="flex flex-col items-center justify-center aspect-square bg-gray-900 border-2 border-dashed border-gray-600 rounded-lg hover:border-green-500 hover:text-green-400 transition-colors text-gray-400"
                    >
                        <span className="text-2xl mb-1">📷</span>
                        <span className="text-xs font-medium">Subir Foto</span>
                    </button>
                </div>
            </div>

            <hr className="border-gray-700 my-6"/>

            <div className="flex justify-end gap-4">
                <button 
                    type="button" 
                    onClick={() => router.back()}
                    className="px-6 py-3 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 font-medium"
                >
                    Cancelar
                </button>
                <button 
                    type="submit" 
                    disabled={saving}
                    className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg disabled:opacity-50"
                >
                    {saving ? 'Guardando...' : 'Guardar Perfil'}
                </button>
            </div>

        </form>
      </div>
    </div>
  );
}