// src/app/publicar/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Definimos la estructura de una Categoría
type Category = {
  id: string;
  name: string;
  slug: string;
  children?: Category[]; 
};

type ListingType = 'PRODUCTO' | 'SERVICIO' | 'INFOPRODUCTO';
type ProductCondition = 'NUEVO' | 'USADO';

export default function PublishPage() {
  const router = useRouter();

  // --- ESTADOS DE DATOS ---
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Formulario Base
  const [type, setType] = useState<ListingType>('PRODUCTO');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  
  // Módulo de Imágenes (Cloudinary)
  const [images, setImages] = useState<string[]>([]); 
  const [isUploading, setIsUploading] = useState(false); 

  // Campos Dinámicos
  const [categoryId, setCategoryId] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [condition, setCondition] = useState<ProductCondition | ''>('');
  
  // Campos de Vehículos
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');

  // Estados de UI
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 1. CARGAR CATEGORÍAS ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/categories');
        if (res.ok) {
          const data = await res.json();
          console.log("📦 Categorías recibidas:", data); // DEBUG: Para ver si llegan los datos
          setCategories(data);
        } else {
            console.error("Error al obtener categorías:", res.status);
        }
      } catch (error) {
        console.error("Error de conexión cargando categorías:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // --- 2. LÓGICA DE SUBIDA DE IMÁGENES (CLOUDINARY) ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        
        formData.append('file', file);
        formData.append('upload_preset', 'mosstall_uploads'); 

        try {
            const res = await fetch('https://api.cloudinary.com/v1_1/dpydplv3x/image/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Falló la subida');
            
            const data = await res.json();
            uploadedUrls.push(data.secure_url); 

        } catch (error) {
            console.error("Error subiendo imagen:", error);
            alert("Error al subir una imagen. Intenta de nuevo.");
        }
    }

    setImages((prev) => [...prev, ...uploadedUrls]);
    setIsUploading(false);
  };

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };


  // --- 3. LÓGICA DEL COMBOBOX (CORREGIDA) ---
  const flatCategories = useMemo(() => {
    let flat: Category[] = [];
    if (!categories) return []; // Protección contra undefined
    
    categories.forEach(parent => {
      // Opción A: Si tiene hijos, agregamos los hijos para que sean seleccionables
      if (parent.children && parent.children.length > 0) {
        // Podríamos agregar también al padre si quisieras permitir seleccionar categorías generales
        // flat.push(parent); 
        flat = [...flat, ...parent.children];
      } else {
        // Opción B: Si no tiene hijos, es una categoría raíz seleccionable
        flat.push(parent);
      }
    });
    return flat;
  }, [categories]);

  const filteredCategories = flatCategories.filter(cat => 
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const isVehicleCategory = useMemo(() => {
    const cat = flatCategories.find(c => c.id === categoryId);
    if (!cat) return false;
    // Buscamos palabras clave en el slug para activar el modo vehículo
    return cat.slug.includes('vehiculo') || cat.slug.includes('autos') || cat.slug.includes('motos') || cat.slug.includes('rodados');
  }, [categoryId, flatCategories]);

  const getTitlePlaceholder = () => {
    if (type === 'SERVICIO') return "Ej: Servicio de Jardinería Profesional";
    if (type === 'INFOPRODUCTO') return "Ej: Guía de Entrenamiento en Casa (PDF)";
    if (isVehicleCategory) return "Ej: Fiat Cronos 1.3 Drive";
    return "Ej: Samsung Galaxy S23 Ultra"; 
  };


  // --- 4. MANEJAR EL ENVÍO ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('Error: Debes iniciar sesión.');
      setIsSubmitting(false);
      return;
    }

    if (!categoryId) {
      setMessage('Error: Selecciona una categoría.');
      setIsSubmitting(false);
      return;
    }

    // Validación de Precio
    const numPrice = parseFloat(price);
    if (type === 'PRODUCTO' && (!price || numPrice <= 0)) {
        setMessage('Error: El precio es obligatorio para productos.');
        setIsSubmitting(false);
        return;
    }

    // Validación de Stock
    const numStock = parseInt(stock);
    if (type === 'PRODUCTO' && (!stock || numStock < 1)) {
        setMessage('Error: El stock debe ser al menos 1.');
        setIsSubmitting(false);
        return;
    }

    const payload = {
      title,
      description,
      price: price === '' ? 0 : numPrice,
      categoryId,
      type,
      stock: type === 'PRODUCTO' ? numStock : 1,
      images: images, 
      condition: (type === 'PRODUCTO' && condition) ? condition : null,
      brand: isVehicleCategory ? brand : null,
      model: isVehicleCategory ? model : null,
      year: isVehicleCategory ? parseInt(year) : null,
      mileage: isVehicleCategory ? parseInt(mileage) : null,
    };

    try {
      const response = await fetch('http://localhost:3001/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`¡Publicación creada! Redirigiendo...`);
        setTimeout(() => router.push(`/product/${data.id}`), 1500);
      } else {
        setMessage(`Error: ${data.error || 'Verifica los datos'}`);
        setIsSubmitting(false);
      }
    } catch (error) {
      setMessage('Error de conexión con el servidor.');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6 pb-20">
      <div className="container mx-auto max-w-3xl">
        
        <Link href="/" className="text-blue-400 hover:underline mb-6 block w-fit">
           &larr; Volver al inicio
        </Link>

        <div className="rounded-xl bg-gray-800 p-8 shadow-2xl border border-gray-700">
          <h1 className="mb-2 text-3xl font-bold text-center">Crear Nueva Publicación</h1>
          <p className="mb-8 text-center text-gray-400">Completa los detalles para vender más rápido.</p>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* TIPO DE PUBLICACIÓN */}
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-300">¿Qué vas a publicar?</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['PRODUCTO', 'SERVICIO', 'INFOPRODUCTO'] as ListingType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                        setType(t);
                        setPrice(''); 
                        setCondition('');
                        setStock('1');
                    }}
                    className={`rounded-lg border px-4 py-3 text-sm font-bold transition-all
                      ${type === t 
                        ? 'border-blue-500 bg-blue-600/20 text-blue-400 ring-1 ring-blue-500' 
                        : 'border-gray-600 bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                      }`}
                  >
                    {t === 'PRODUCTO' && '📦 Producto Físico'}
                    {t === 'SERVICIO' && '🛠️ Servicio'}
                    {t === 'INFOPRODUCTO' && '📂 Infoproducto'}
                  </button>
                ))}
              </div>
            </div>

            {/* SECCIÓN DE FOTOS (CLOUDINARY) */}
            <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Fotos del Producto</label>
                
                {/* Área de Carga */}
                <div className="flex items-center justify-center w-full">
                    <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {isUploading ? (
                                <p className="text-sm text-gray-400 animate-pulse">Subiendo imagen a la nube...</p>
                            ) : (
                                <>
                                    <svg className="w-8 h-8 mb-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                    </svg>
                                    <p className="text-sm text-gray-400"><span className="font-semibold">Haz clic para subir</span></p>
                                    <p className="text-xs text-gray-500">PNG, JPG (Máx. 10MB)</p>
                                </>
                            )}
                        </div>
                        <input 
                            id="dropzone-file" 
                            type="file" 
                            className="hidden" 
                            multiple 
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={isUploading}
                        />
                    </label>
                </div>

                {/* Previsualización de Fotos */}
                {images.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-4">
                        {images.map((url, index) => (
                            <div key={index} className="relative group aspect-square">
                                <img src={url} alt={`Foto ${index}`} className="w-full h-full object-cover rounded-lg border border-gray-600" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Eliminar foto"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* CATEGORÍA - BUG CORREGIDO */}
            <div className="relative">
              <label className="mb-2 block text-sm font-medium text-gray-300">Categoría</label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder={isLoadingCategories ? "Cargando..." : "Escribe para buscar (ej: Celulares, Motos...)"}
                  value={isCategoryDropdownOpen ? categorySearch : selectedCategoryName}
                  // CORRECCIÓN 1: Agregar onClick para reabrir el menú si ya está en foco
                  onClick={() => setIsCategoryDropdownOpen(true)} 
                  onChange={(e) => {
                    setCategorySearch(e.target.value);
                    setIsCategoryDropdownOpen(true);
                    if(selectedCategoryName && e.target.value !== selectedCategoryName) {
                        setCategoryId(''); 
                    }
                  }}
                  onFocus={() => {
                    setCategorySearch(''); 
                    setIsCategoryDropdownOpen(true);
                  }}
                  className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:border-blue-500 focus:ring-blue-500"
                />
                <div className="absolute right-3 top-3.5 pointer-events-none text-gray-400">▼</div>
              </div>
              
              {/* CORRECCIÓN 2: Mejorar z-index para asegurar que flote sobre todo */}
              {isCategoryDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-xl max-h-60 overflow-y-auto">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((cat) => (
                      <div 
                        key={cat.id}
                        onClick={() => {
                          setCategoryId(cat.id);
                          setSelectedCategoryName(cat.name);
                          setCategorySearch(cat.name);
                          setIsCategoryDropdownOpen(false);
                        }}
                        className="px-4 py-3 hover:bg-blue-600 cursor-pointer text-sm border-b border-gray-600/30 last:border-0"
                      >
                        {cat.name}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-400 text-sm">No se encontraron categorías.</div>
                  )}
                </div>
              )}
              {isCategoryDropdownOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsCategoryDropdownOpen(false)}></div>
              )}
            </div>

            {/* DETALLES ESPECÍFICOS */}
            {type === 'PRODUCTO' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">Condición</label>
                        <div className="flex gap-4">
                            {(['NUEVO', 'USADO'] as ProductCondition[]).map((cond) => (
                                <label key={cond} className="flex items-center gap-2 cursor-pointer bg-gray-700/50 px-4 py-3 rounded-lg border border-gray-600 hover:bg-gray-700 w-full justify-center">
                                    <input 
                                        type="radio" 
                                        name="condition" 
                                        value={cond}
                                        checked={condition === cond}
                                        onChange={(e) => setCondition(e.target.value as ProductCondition)}
                                        className="text-blue-500 focus:ring-blue-500"
                                    />
                                    <span className="capitalize">{cond.toLowerCase()}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">Stock Disponible</label>
                        <input
                            type="number"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            min="1"
                            className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Cantidad (mín. 1)"
                        />
                        <p className="text-xs text-gray-500 mt-1">Si llega a 0, la publicación se pausará automáticamente.</p>
                    </div>
                </div>
            )}

            {isVehicleCategory && (
                <div className="bg-blue-900/20 p-5 rounded-lg border border-blue-800/50 animate-fade-in">
                    <h3 className="text-blue-300 font-bold mb-4 text-sm uppercase tracking-wide">Detalles del Vehículo</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Marca</label>
                            <input type="text" placeholder="Ej: Toyota" value={brand} onChange={e => setBrand(e.target.value)} className="w-full rounded bg-gray-700 border-gray-600 p-2 text-white" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Modelo</label>
                            <input type="text" placeholder="Ej: Corolla" value={model} onChange={e => setModel(e.target.value)} className="w-full rounded bg-gray-700 border-gray-600 p-2 text-white" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Año</label>
                            <input type="number" placeholder="Ej: 2020" value={year} onChange={e => setYear(e.target.value)} className="w-full rounded bg-gray-700 border-gray-600 p-2 text-white" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Kilómetros</label>
                            <input type="number" placeholder="Ej: 45000" value={mileage} onChange={e => setMileage(e.target.value)} className="w-full rounded bg-gray-700 border-gray-600 p-2 text-white" />
                        </div>
                    </div>
                </div>
            )}

            {/* INFORMACIÓN BÁSICA */}
            <div className="space-y-4">
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Título</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:border-blue-500 focus:ring-blue-500"
                        placeholder={getTitlePlaceholder()}
                        required
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Precio ($)</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">$</span>
                        <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required={type === 'PRODUCTO'}
                        className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 pl-8 text-white focus:border-blue-500 focus:ring-blue-500"
                        placeholder={type === 'PRODUCTO' ? "0.00" : "0.00 (Opcional)"}
                        min="0"
                        step="0.01"
                        />
                    </div>
                    {type === 'SERVICIO' && <p className="text-xs text-yellow-400 mt-1">Vacío = "A Cotizar"</p>}
                    {type === 'INFOPRODUCTO' && <p className="text-xs text-green-400 mt-1">Vacío = "GRATIS"</p>}
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">Descripción</label>
                    <textarea
                        rows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full rounded-md border border-gray-600 bg-gray-700 p-3 text-white focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Detalles, características, horarios..."
                        required
                    />
                </div>
            </div>

            {/* BOTÓN DE ENVÍO */}
            <button
              type="submit"
              disabled={isSubmitting || isUploading} // Bloquear también si está subiendo fotos
              className={`w-full rounded-lg px-5 py-4 text-center font-bold text-white transition-all transform 
                ${isSubmitting || isUploading
                  ? 'bg-blue-800 cursor-wait' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] shadow-lg shadow-blue-900/40'
                }`}
            >
              {isUploading ? 'Subiendo fotos...' : isSubmitting ? 'Publicando...' : 'Publicar Ahora'}
            </button>
          </form>

          {message && (
            <div className={`mt-6 p-4 rounded text-center text-sm font-bold animate-fade-in
              ${message.includes('Error') ? 'bg-red-900/40 text-red-300 border border-red-800' : 'bg-green-900/40 text-green-300 border border-green-800'}
            `}>
              {message}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}