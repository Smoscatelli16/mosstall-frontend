// src/app/publicar/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Category = {
  id: string;
  name: string;
  slug: string;
  children?: Category[]; 
};

type ListingType = 'PRODUCTO' | 'SERVICIO' | 'INFOPRODUCTO';
type ProductCondition = 'NUEVO' | 'USADO';
type StoreType = 'PRODUCT_STORE' | 'SERVICE_PROFESSIONAL' | 'DIGITAL_CREATOR';

type Store = {
  id: string;
  name: string;
  type: StoreType;
};

export default function PublishPage() {
  const router = useRouter();
  
  // --- ESTADOS DE SEGURIDAD Y PERFIL (ONBOARDING) ---
  const [hasCheckedStores, setHasCheckedStores] = useState(false);
  const [myStores, setMyStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  
  // Estado para controlar si mostramos el mini-formulario de crear tienda
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreType, setNewStoreType] = useState<StoreType>('PRODUCT_STORE');
  const [newStoreCBU, setNewStoreCBU] = useState('');
  const [isSubmittingStore, setIsSubmittingStore] = useState(false);

  // --- ESTADOS DE DATOS (PUBLICACIÓN) ---
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Formulario Base
  const [type, setType] = useState<ListingType>('PRODUCTO');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  
  // Módulo de Imágenes
  const [images, setImages] = useState<string[]>([]); 
  const [isUploading, setIsUploading] = useState(false); 

  // Campos Dinámicos
  const [categoryId, setCategoryId] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [condition, setCondition] = useState<ProductCondition | ''>('');
  
  const [suggestedCategory, setSuggestedCategory] = useState('');
  const [showSuggestionInput, setShowSuggestionInput] = useState(false);

  // Campos de Vehículos
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');

  // Estados de UI
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoryLoadError, setCategoryLoadError] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [message, setMessage] = useState('');
  const [storeMessage, setStoreMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 0. VALIDAR TIENDAS (EL NUEVO ONBOARDING) ---
  useEffect(() => {
    const fetchUserStores = async () => {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }
      
      try {
        const res = await fetch('https://mosstall-desa-production.up.railway.app/api/user/stores', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data: Store[] = await res.json();
          setMyStores(data);
          
          if (data.length > 0) {
              setSelectedStoreId(data[0].id);
              autoSetListingType(data[0].type);
          } else {
              setIsCreatingStore(true); 
          }
        } else {
            setIsCreatingStore(true);
        }
      } catch (error) {
        console.error("Error cargando tiendas", error);
        setIsCreatingStore(true);
      } finally {
        setHasCheckedStores(true);
      }
    };
    
    fetchUserStores();
  }, [router]);

  const autoSetListingType = (sT: StoreType) => {
      if (sT === 'PRODUCT_STORE') setType('PRODUCTO');
      if (sT === 'SERVICE_PROFESSIONAL') setType('SERVICIO');
      if (sT === 'DIGITAL_CREATOR') setType('INFOPRODUCTO');
  };

  const handleStoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (val === 'NEW') {
          setIsCreatingStore(true);
      } else {
          setIsCreatingStore(false);
          setSelectedStoreId(val);
          const store = myStores.find(s => s.id === val);
          if (store) autoSetListingType(store.type);
      }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
      e.preventDefault();
      setStoreMessage('');
      if(!newStoreName || !newStoreCBU) {
          setStoreMessage("Completa el nombre y el CBU/CVU."); return;
      }
      if(newStoreCBU.length < 22) {
          setStoreMessage("El CBU/CVU debe tener 22 números."); return;
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
                  cbu: newStoreCBU
              })
          });

          if (res.ok) {
              const newStore = await res.json();
              setMyStores([...myStores, newStore]);
              setSelectedStoreId(newStore.id);
              autoSetListingType(newStore.type);
              setIsCreatingStore(false);
              setStoreMessage('');
          } else {
              const d = await res.json();
              if (res.status === 403 && d.error.includes('profesional')) {
                  alert(d.error);
                  router.push('/perfil'); 
              } else {
                  setStoreMessage(`Error: ${d.error || 'No se pudo crear el perfil.'}`);
              }
          }
      } catch (error) {
          setStoreMessage("Error de conexión al crear perfil.");
      } finally {
          setIsSubmittingStore(false);
      }
  };

  // --- 1. CARGAR CATEGORÍAS ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('https://mosstall-desa-production.up.railway.app/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        } else {
           setCategoryLoadError(true);
        }
      } catch (error) {
        setCategoryLoadError(true);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // --- 2. LÓGICA DE SUBIDA DE IMÁGENES ---
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
            alert("Error al subir una imagen. Intenta de nuevo.");
        }
    }

    setImages((prev) => [...prev, ...uploadedUrls]);
    setIsUploading(false);
  };

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  // --- TEXTOS DINÁMICOS SEGÚN TIPO ---
  const getMediaLabel = () => {
      if (type === 'SERVICIO') return 'Imágenes del Servicio';
      if (type === 'INFOPRODUCTO') return 'Portada del Infoproducto';
      return 'Fotos del Producto';
  };

  const getTitlePlaceholder = () => {
    if (type === 'SERVICIO') return "Ej: Servicio de Jardinería Profesional";
    if (type === 'INFOPRODUCTO') return "Ej: Guía de Entrenamiento en Casa (PDF)";
    if (isVehicleCategory) return "Ej: Fiat Cronos 1.3 Drive";
    return "Ej: Samsung Galaxy S23 Ultra"; 
  };

  // --- 3. LÓGICA DE CATEGORÍAS ---
  const typeFilteredRoots = useMemo(() => {
      if (!categories) return [];
      
      return categories.filter(root => {
          const name = root.name.toLowerCase();
          const isVarios = name.includes('varios') || name.includes('otros /');

          if (type === 'SERVICIO') {
              return name.includes('servicio') || isVarios;
          } 
          else if (type === 'INFOPRODUCTO') {
              return name.includes('infoproducto') || name.includes('digital') || isVarios;
          } 
          else { 
              return !name.includes('servicio') && !name.includes('infoproducto') && !name.includes('digital');
          }
      });
  }, [categories, type]);

  const groupedCategories = useMemo(() => {
      const search = categorySearch.toLowerCase();
      
      if (!search) return typeFilteredRoots;

      return typeFilteredRoots.map(root => {
          if (root.name.toLowerCase().includes(search)) return root; 
          
          const matchingChildren = root.children?.filter(child => 
              child.name.toLowerCase().includes(search)
          );

          if (matchingChildren && matchingChildren.length > 0) {
              return { ...root, children: matchingChildren }; 
          }

          return null; 
      }).filter(Boolean) as Category[]; 

  }, [typeFilteredRoots, categorySearch]);

  const isVehicleCategory = useMemo(() => {
    if (!categoryId) return false;
    const flat = categories.flatMap(c => c.children ? [c, ...c.children] : [c]);
    const cat = flat.find(c => c.id === categoryId);
    if (!cat) return false;
    return cat.slug.includes('vehiculo') || cat.slug.includes('autos') || cat.slug.includes('motos') || cat.slug.includes('rodados');
  }, [categoryId, categories]);

  useEffect(() => {
      if (selectedCategoryName.toLowerCase().includes('otros')) {
          setShowSuggestionInput(true);
      } else {
          setShowSuggestionInput(false);
          setSuggestedCategory(''); 
      }
  }, [selectedCategoryName]);

  const selectGenericOther = () => {
      const searchTerms = ['otros', 'varios', 'otras'];
      const allSubCategories = categories.flatMap(c => c.children || []);
      let target: Category | undefined;

      for (const term of searchTerms) {
          target = allSubCategories.find(c => c.name.toLowerCase().includes(term));
          if (target) break; 
      }

      if (!target) {
          const genericRoot = categories.find(c => c.name.toLowerCase().includes('varios') || c.name.toLowerCase().includes('otros'));
          if (genericRoot && genericRoot.children && genericRoot.children.length > 0) {
              target = genericRoot.children[0]; 
          }
      }

      // Fallback extremo si la BD no tiene "otros/varios"
      if (!target && categories.length > 0) {
          target = categories[categories.length - 1];
      }

      if (target) {
          setCategoryId(target.id);
          setSelectedCategoryName('Otros (Especificar)');
          setCategorySearch('Otros (Especificar)'); 
          setIsCategoryDropdownOpen(false);
          setShowSuggestionInput(true);
      } else {
          alert("Error de conexión: No se pudo cargar el listado maestro de categorías.");
      }
  };

  // --- 4. MANEJAR EL ENVÍO DE LA PUBLICACIÓN ---
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

    if (!selectedStoreId) {
        setMessage('Error: Debes seleccionar un Perfil Comercial/Tienda.');
        setIsSubmitting(false);
        return;
    }

    if (!categoryId) {
      setMessage('Error: Selecciona una categoría válida.');
      setIsSubmitting(false);
      return;
    }

    if (showSuggestionInput && !suggestedCategory.trim()) {
        setMessage('Error: Por favor especifica la categoría.');
        setIsSubmitting(false);
        return;
    }

    const numPrice = parseFloat(price);
    if (type === 'PRODUCTO' && (!price || numPrice <= 0)) {
        setMessage('Error: Precio obligatorio.');
        setIsSubmitting(false);
        return;
    }

    const numStock = parseInt(stock);
    if (type === 'PRODUCTO' && (!stock || numStock < 1)) {
        setMessage('Error: El stock debe ser al menos 1.');
        setIsSubmitting(false);
        return;
    }

    const payload = {
      storeId: selectedStoreId,
      title, description,
      price: price === '' ? 0 : numPrice,
      categoryId, type,
      stock: type === 'PRODUCTO' ? numStock : 1,
      images, 
      condition: (type === 'PRODUCTO' && condition) ? condition : null,
      brand: isVehicleCategory ? brand : null,
      model: isVehicleCategory ? model : null,
      year: isVehicleCategory ? parseInt(year) : null,
      mileage: isVehicleCategory ? parseInt(mileage) : null,
      suggestedCategory: showSuggestionInput ? suggestedCategory : null 
    };

    try {
      const response = await fetch('https://mosstall-desa-production.up.railway.app/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
      setMessage('Error de conexión.');
      setIsSubmitting(false);
    }
  };

  // Pantalla de Carga Inicial
  if (!hasCheckedStores) {
      return (
          <main className="min-h-screen bg-slate-50 text-[#1a237e] p-6 pb-20 flex items-center justify-center font-sans">
              <div className="text-2xl animate-pulse font-bold">⏳ Preparando tu perfil comercial...</div>
          </main>
      );
  }

  const parsedPrice = parseFloat(price);

  return (
    <main className="min-h-screen bg-slate-50 text-gray-900 p-6 pb-20 font-sans">
      <div className="container mx-auto max-w-3xl">
        
        <Link href="/dashboard" className="text-gray-500 hover:text-[#1a237e] mb-6 block w-fit font-bold transition-colors">
           &larr; Volver al panel
        </Link>

        {isCreatingStore ? (
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
                    <div>
                        <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">CBU / CVU de Cobro (22 dígitos)</label>
                        <input type="number" value={newStoreCBU} onChange={e=>setNewStoreCBU(e.target.value)} required placeholder="1234567890123456789012" className="w-full rounded-xl border border-gray-200 bg-slate-50 p-3.5 text-gray-900 font-medium focus:border-[#1a237e] focus:ring-2 outline-none"/>
                    </div>
                    <button type="submit" disabled={isSubmittingStore} className="w-full bg-[#1a237e] hover:bg-[#121858] text-white font-black py-4 rounded-xl shadow-lg disabled:opacity-50 transition-transform hover:-translate-y-0.5 mt-2">
                        {isSubmittingStore ? 'Creando Perfil...' : 'Comenzar a Vender 🚀'}
                    </button>
                    {storeMessage && <p className="text-center text-[#d50000] text-sm font-bold mt-2">{storeMessage}</p>}
                    
                    {myStores.length > 0 && (
                        <button type="button" onClick={() => setIsCreatingStore(false)} className="w-full text-center text-gray-400 hover:text-gray-600 text-sm font-bold mt-4">
                            Cancelar y usar perfil existente
                        </button>
                    )}
                </form>
            </div>
        ) : (
          <div className="rounded-3xl bg-white p-6 md:p-10 shadow-sm border border-gray-100">
            {/* CORRECCIÓN TASK 1.1: FLEX COL EN MOBILE Y AJUSTE DE TAMAÑOS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Crear Publicación</h1>
                <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-2 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full md:w-auto overflow-hidden">
                    <span className="text-xs font-bold text-purple-800 uppercase shrink-0">PERFIL ACTIVO:</span>
                    <select value={selectedStoreId} onChange={handleStoreChange} className="bg-transparent text-[#1a237e] font-black text-sm outline-none cursor-pointer w-full max-w-full truncate">
                        {myStores.map(s => <option key={s.id} value={s.id}>{s.name} ({s.type === 'PRODUCT_STORE' ? 'Productos' : s.type === 'SERVICE_PROFESSIONAL' ? 'Servicios' : 'Digital'})</option>)}
                        <option value="NEW" className="text-purple-600 bg-purple-50 font-bold">+ Crear Nuevo Perfil</option>
                    </select>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* TIPO DE PUBLICACIÓN */}
              <div>
                <label className="mb-3 block text-sm font-bold text-gray-700 uppercase tracking-wide">¿Qué vas a publicar en este perfil?</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 opacity-70 pointer-events-none">
                  {(['PRODUCTO', 'SERVICIO', 'INFOPRODUCTO'] as ListingType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`rounded-xl border px-4 py-4 text-sm font-black transition-all shadow-sm
                        ${type === t 
                          ? 'border-[#1a237e] bg-[#1a237e]/5 text-[#1a237e] ring-2 ring-[#1a237e]' 
                          : 'border-gray-200 bg-slate-50 text-gray-400'
                        }`}
                    >
                      {t === 'PRODUCTO' && '📦 Producto Físico'}
                      {t === 'SERVICIO' && '🛠️ Servicio'}
                      {t === 'INFOPRODUCTO' && '📂 Infoproducto'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2 font-medium">El tipo de publicación se autodefine según el perfil comercial que seleccionaste arriba.</p>
              </div>

              {/* SECCIÓN DE FOTOS */}
              <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700 uppercase tracking-wide">{getMediaLabel()}</label>
                  <div className="flex items-center justify-center w-full">
                      <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-36 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-gray-100 transition-colors ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              {isUploading ? (
                                  <p className="text-sm font-bold text-[#1a237e] animate-pulse">Subiendo imagen...</p>
                              ) : (
                                  <>
                                      <svg className="w-10 h-10 mb-3 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                      </svg>
                                      <p className="text-sm text-gray-600"><span className="font-bold">Haz clic para subir</span></p>
                                      <p className="text-xs text-gray-400 font-medium mt-1">PNG, JPG (Máx. 10MB)</p>
                                  </>
                              )}
                          </div>
                          <input id="dropzone-file" type="file" className="hidden" multiple accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                      </label>
                  </div>
                  {images.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                          {images.map((url, index) => (
                              <div key={index} className="relative aspect-square rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
                                  <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                  <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-white border border-gray-200 text-[#d50000] h-6 w-6 flex items-center justify-center rounded-full text-xs font-black shadow-sm hover:bg-red-50 hover:scale-110 transition-all">X</button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {/* CATEGORÍA MEJORADA */}
              <div className="relative">
                <label className="mb-2 block text-sm font-bold text-gray-700 uppercase tracking-wide">Categoría</label>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder={isLoadingCategories ? "Cargando..." : `Buscar en ${type === 'PRODUCTO' ? 'Productos' : type === 'SERVICIO' ? 'Servicios' : 'Infoproductos'}...`}
                    value={isCategoryDropdownOpen ? categorySearch : selectedCategoryName}
                    onClick={() => !isLoadingCategories && setIsCategoryDropdownOpen(true)} 
                    onChange={(e) => {
                      setCategorySearch(e.target.value);
                      setIsCategoryDropdownOpen(true);
                      if (e.target.value === '') {
                          setCategoryId('');
                          setSelectedCategoryName('');
                      }
                    }}
                    onFocus={() => {
                      setCategorySearch(''); 
                      setIsCategoryDropdownOpen(true);
                    }}
                    disabled={isLoadingCategories}
                    className={`w-full rounded-xl border p-3.5 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#1a237e] transition-all 
                      ${categoryId ? 'bg-blue-50 border-[#1a237e]/40 shadow-inner' : 'bg-slate-50 border-gray-200'}
                      ${isLoadingCategories ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  />
                  <div className="absolute right-4 top-4 pointer-events-none text-gray-400 font-bold text-xs">▼</div>
                  {categoryId && <span className="absolute right-9 top-3.5 text-green-600 font-bold text-lg">✓</span>}
                </div>
                
                {categoryLoadError && <p className="text-[#d50000] text-xs mt-2 font-bold">Error cargando categorías.</p>}
                
                {isCategoryDropdownOpen && !isLoadingCategories && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                    {groupedCategories.length > 0 ? (
                      groupedCategories.map((root) => (
                        <div key={root.id}>
                          <div className="px-5 py-2.5 bg-slate-50 text-[#1a237e] font-black text-xs uppercase tracking-widest border-b border-gray-100 sticky top-0">
                              {root.name}
                          </div>
                          {root.children?.map((child) => (
                              <div 
                                  key={child.id}
                                  onClick={() => {
                                    setCategoryId(child.id);
                                    setSelectedCategoryName(child.name);
                                    setCategorySearch(child.name);
                                    setIsCategoryDropdownOpen(false);
                                  }}
                                  className="px-6 py-3.5 hover:bg-blue-50 hover:text-[#1a237e] cursor-pointer text-sm text-gray-600 font-medium border-b border-gray-50 transition-colors"
                              >
                                  {child.name}
                              </div>
                          ))}
                        </div>
                      ))
                    ) : (
                      <div className="p-5 text-center bg-slate-50">
                          <p className="text-gray-500 text-sm mb-3 font-medium">
                              {categorySearch ? `No encontramos "${categorySearch}"` : "No hay resultados"}
                          </p>
                          <button 
                              type="button"
                              onClick={selectGenericOther}
                              className="text-[#1a237e] hover:text-[#121858] text-sm font-black underline"
                          >
                              Seleccionar "Otros {type === 'PRODUCTO' ? 'Productos' : type === 'SERVICIO' ? 'Servicios' : ''}"
                          </button>
                      </div>
                    )}
                  </div>
                )}
                {isCategoryDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsCategoryDropdownOpen(false)}></div>}
              </div>

              {/* SUGERENCIA */}
              {showSuggestionInput && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300 p-5 bg-blue-50 rounded-xl border border-blue-100 shadow-inner">
                      <label className="block text-[#1a237e] font-black mb-2 text-sm">
                          ¿Qué estás publicando exactamente? <span className="text-[#d50000]">*</span>
                      </label>
                      <input 
                          type="text"
                          value={suggestedCategory}
                          onChange={(e) => setSuggestedCategory(e.target.value)}
                          className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium focus:border-[#1a237e] focus:ring-2 focus:ring-[#1a237e] outline-none transition-all shadow-sm"
                          placeholder="Ej: Miel de Yateí, Clases de Yoga, Monopatín..."
                      />
                      <p className="text-xs text-gray-500 mt-2 font-medium">
                          Esto nos ayuda a crear la categoría correcta en el futuro.
                      </p>
                  </div>
              )}

              {/* DETALLES ESPECÍFICOS */}
              {type === 'PRODUCTO' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="mb-2 block text-sm font-bold text-gray-700 uppercase tracking-wide">Condición</label>
                          <div className="flex gap-4">
                              {(['NUEVO', 'USADO'] as ProductCondition[]).map((cond) => (
                                  <label key={cond} className={`flex items-center gap-2 cursor-pointer px-4 py-3.5 rounded-xl border transition-all w-full justify-center shadow-sm active:scale-[0.98] ${condition === cond ? 'bg-blue-50 border-[#1a237e]/50 ring-1 ring-[#1a237e]/50' : 'bg-slate-50 border-gray-200 hover:bg-gray-50'}`}>
                                      <input 
                                          type="radio" 
                                          name="condition" 
                                          value={cond}
                                          checked={condition === cond}
                                          onChange={(e) => setCondition(e.target.value as ProductCondition)}
                                          className="text-[#1a237e] focus:ring-[#1a237e]"
                                      />
                                      <span className="capitalize font-bold text-gray-800">{cond.toLowerCase()}</span>
                                  </label>
                              ))}
                          </div>
                      </div>

                      <div>
                          <label className="mb-2 block text-sm font-bold text-gray-700 uppercase tracking-wide">Stock Disponible</label>
                          <input
                              type="number"
                              value={stock}
                              onChange={(e) => setStock(e.target.value)}
                              min="1"
                              className="w-full rounded-xl border border-gray-200 bg-slate-50 p-3.5 text-gray-900 font-medium focus:border-[#1a237e] focus:ring-2 focus:ring-[#1a237e] transition-all outline-none"
                              placeholder="Cantidad"
                          />
                      </div>
                  </div>
              )}

              {isVehicleCategory && (
                  <div className="bg-slate-50 p-5 rounded-xl border border-gray-200 animate-fade-in shadow-inner">
                      <h3 className="text-[#1a237e] font-black mb-4 text-sm uppercase tracking-wider">Detalles del Vehículo</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Marca</label>
                              <input type="text" placeholder="Ej: Toyota" value={brand} onChange={e => setBrand(e.target.value)} className="w-full rounded-lg bg-white border border-gray-200 p-3 text-gray-900 font-medium focus:ring-2 focus:ring-[#1a237e] outline-none transition-all" />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Modelo</label>
                              <input type="text" placeholder="Ej: Corolla" value={model} onChange={e => setModel(e.target.value)} className="w-full rounded-lg bg-white border border-gray-200 p-3 text-gray-900 font-medium focus:ring-2 focus:ring-[#1a237e] outline-none transition-all" />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Año</label>
                              <input type="number" placeholder="Ej: 2020" value={year} onChange={e => setYear(e.target.value)} className="w-full rounded-lg bg-white border border-gray-200 p-3 text-gray-900 font-medium focus:ring-2 focus:ring-[#1a237e] outline-none transition-all" />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Kilómetros</label>
                              <input type="number" placeholder="Ej: 45000" value={mileage} onChange={e => setMileage(e.target.value)} className="w-full rounded-lg bg-white border border-gray-200 p-3 text-gray-900 font-medium focus:ring-2 focus:ring-[#1a237e] outline-none transition-all" />
                          </div>
                      </div>
                  </div>
              )}

              {/* INFO BÁSICA */}
              <div className="space-y-5">
                  <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700 uppercase tracking-wide">Título</label>
                      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-slate-50 p-3.5 text-gray-900 font-medium focus:border-[#1a237e] focus:ring-2 focus:ring-[#1a237e] outline-none transition-all" placeholder={getTitlePlaceholder()} required />
                  </div>
                  <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700 uppercase tracking-wide">Precio ($)</label>
                      <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-slate-50 p-3.5 text-gray-900 font-black text-lg focus:border-[#1a237e] focus:ring-2 focus:ring-[#1a237e] outline-none transition-all" placeholder={type === 'PRODUCTO' ? "0.00" : "0.00 (Opcional)"} required={type === 'PRODUCTO'} step="0.01" />
                      
                      {/* BRIEF #041: Calculadora de Fees en Tiempo Real */}
                      {parsedPrice > 0 && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100 flex items-center gap-2">
                              <span className="text-xl">💰</span>
                              <p className="text-sm text-green-800 font-medium">
                                Recibirás limpio: <span className="font-black">${(parsedPrice * 0.95).toFixed(2)}</span>
                                <span className="block text-xs text-green-600/80">(Descuento del 5% de tarifa de plataforma)</span>
                              </p>
                          </div>
                      )}
                  </div>
                  <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700 uppercase tracking-wide">Descripción</label>
                      <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-slate-50 p-3.5 text-gray-900 font-medium focus:border-[#1a237e] focus:ring-2 focus:ring-[#1a237e] outline-none transition-all resize-none" placeholder="Explica los detalles, beneficios y características..." required />
                  </div>
              </div>

              <button type="submit" disabled={isSubmitting || isUploading} className="w-full bg-[#1a237e] hover:bg-[#121858] text-white font-black py-4 rounded-xl shadow-lg disabled:opacity-50 transition-transform hover:-translate-y-0.5 mt-6 text-lg">
                {isSubmitting ? 'Procesando...' : 'Publicar Ahora'}
              </button>
            </form>
            
            {message && <div className={`mt-6 p-4 rounded-xl text-center text-sm font-bold ${message.includes('Error') ? 'bg-red-50 text-[#d50000] border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>{message}</div>}
          </div>
        )}
      </div>
    </main>
  );
}