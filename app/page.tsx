// src/app/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

// --- (INICIO) Definición de Tipos ---
type ProductCreator = {
  name: string | null;
};

// Tipos para Filtros
type Category = {
  id: string;
  name: string;
  children?: Category[];
};

type ListingType = 'PRODUCTO' | 'SERVICIO' | 'INFOPRODUCTO';

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  createdAt: string;
  creator: ProductCreator;
  type: ListingType;
  status: string;
  // Agregamos el array de imágenes
  images: string[];
  // Campos opcionales
  condition?: 'NUEVO' | 'USADO' | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  mileage?: number | null;
};
// --- (FIN) Definición de Tipos ---


// --- (INICIO) Componente de Tarjeta de Producto ---
function ProductCard({ product }: { product: Product }) {
  
  const showPrice = product.price > 0;
  const isService = product.type === 'SERVICIO';
  
  let priceDisplay;
  if (showPrice) {
    priceDisplay = `$${product.price.toLocaleString('es-AR')}`;
  } else if (isService) {
    priceDisplay = "A Cotizar";
  } else {
    priceDisplay = "GRATIS"; 
  }

  const typeIcon = product.type === 'SERVICIO' ? '🛠️' : product.type === 'INFOPRODUCTO' ? '📂' : '📦';
  const hasVehicleSpecs = product.brand || product.model || product.year;

  // Lógica de Imagen Principal
  // Si el array tiene fotos, usamos la primera. Si no, null.
  const mainImage = product.images && product.images.length > 0 ? product.images[0] : null;

  return (
    <div className="rounded-lg bg-gray-800 shadow-sm overflow-hidden border border-gray-700 hover:border-gray-500 transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col h-full group">
      
      {/* Zona de Imagen */}
      <div className="h-56 bg-white flex items-center justify-center relative shrink-0 overflow-hidden border-b border-gray-700">
        
        {mainImage ? (
            // Opción A: FOTO REAL
            <img 
                src={mainImage} 
                alt={product.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
        ) : (
            // Opción B: PLACEHOLDER (Ícono)
            <span className="text-5xl filter grayscale opacity-20 text-black">{typeIcon}</span>
        )}
        
        {/* Badge de Condición (Estilo ML) */}
        {product.condition === 'NUEVO' && (
            <span className="absolute top-2 left-2 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white rounded shadow-sm bg-blue-600 z-10">
                NUEVO
            </span>
        )}
      </div>
      
      <div className="p-4 flex flex-col grow">
        {/* Precio primero (Jerarquía visual de E-commerce) */}
        <div className="mb-2">
            <span className={`text-2xl font-normal ${showPrice ? 'text-white' : 'text-green-400'}`}>
                {priceDisplay}
            </span>
        </div>

        <h3 className="text-sm font-normal text-gray-300 mb-1 leading-snug line-clamp-2" title={product.title}>
            {product.title}
        </h3>

        {/* Ficha Técnica Mini */}
        {hasVehicleSpecs && (
            <div className="flex flex-wrap gap-2 text-xs font-medium text-gray-500 mt-1">
                {product.year && <span>{product.year}</span>}
                {product.mileage !== null && product.mileage !== undefined && <span>• {product.mileage} km</span>}
            </div>
        )}
        
        <div className="mt-auto pt-4">
            <Link 
                href={`/product/${product.id}`}
                className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
            >
                Ver más detalles
            </Link>
        </div>
      </div>
    </div>
  );
}
// --- (FIN) Componente de Tarjeta de Producto ---


// --- (INICIO) Componente Principal de la Página ---
export default function HomePage() {
  
  // --- Estados de Datos ---
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // --- Estados de Filtros ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [condition, setCondition] = useState('');
  const [minYear, setMinYear] = useState('');
  const [maxYear, setMaxYear] = useState('');
  
  const [sortOrder, setSortOrder] = useState('newest');

  // --- Estados de UI ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Cargar Categorías al inicio
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/categories');
        if (res.ok) setCategories(await res.json());
      } catch (e) { console.error("Error cargando categorías"); }
    };
    fetchCategories();
  }, []);

  // 2. Función Central de Búsqueda
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construimos la URL con los parámetros de búsqueda
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategoryId) params.append('categoryId', selectedCategoryId);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (condition) params.append('condition', condition);
      if (minYear) params.append('minYear', minYear);
      if (maxYear) params.append('maxYear', maxYear);
      if (sortOrder) params.append('sort', sortOrder);

      // DEBUG: Ver qué URL estamos llamando
      console.log("🔍 Buscando:", `http://localhost:3001/api/products?${params.toString()}`);

      const response = await fetch(`http://localhost:3001/api/products?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('No se pudo cargar la lista de productos.');
      }

      const data: Product[] = await response.json();
      setProducts(data);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Ejecutar búsqueda al inicio y cuando cambian los filtros
  useEffect(() => {
    const timeoutId = setTimeout(() => {
        fetchProducts();
    }, 500); // 500ms de espera (debounce) para no saturar
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedCategoryId, minPrice, maxPrice, condition, minYear, maxYear, sortOrder]);


  // --- Renderizado ---
  return (
    <main className="min-h-screen bg-[#121212]"> {/* Fondo Negro Principal */}
      
      {/* ==================================================================
          1. HEADER TIPO MERCADO LIBRE (Buscador y Filtros Arriba)
         ================================================================== */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 py-4">
            
            {/* Fila Superior: Buscador (Protagonista) */}
            <div className="flex justify-center mb-3">
                <div className="relative w-full max-w-4xl">
                    <input 
                        type="text"
                        placeholder="Buscar productos, marcas y más..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white text-gray-900 rounded-md shadow-sm border-none px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-lg placeholder-gray-400"
                    />
                    <button className="absolute right-0 top-0 h-full px-5 text-gray-500 border-l border-gray-200">
                        🔍
                    </button>
                </div>
            </div>

            {/* Fila Inferior: Filtros Rápidos (Estilo Navbar secundario) */}
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 text-sm">
                
                {/* Categorías */}
                <select 
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="bg-transparent text-gray-300 border-none hover:text-white cursor-pointer focus:ring-0"
                >
                    <option value="" className="bg-gray-800">Todas las Categorías</option>
                    {categories.map(cat => (
                        <optgroup key={cat.id} label={cat.name} className="bg-gray-800">
                            {cat.children?.map(child => (
                                <option key={child.id} value={child.id}>{child.name}</option>
                            ))}
                            {(!cat.children || cat.children.length === 0) && <option value={cat.id}>{cat.name}</option>}
                        </optgroup>
                    ))}
                </select>

                <div className="h-4 w-px bg-gray-700 hidden md:block"></div>

                {/* Condición */}
                <select 
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="bg-transparent text-gray-300 border-none hover:text-white cursor-pointer focus:ring-0"
                >
                    <option value="" className="bg-gray-800">Condición</option>
                    <option value="NUEVO" className="bg-gray-800">Nuevo</option>
                    <option value="USADO" className="bg-gray-800">Usado</option>
                </select>

                <div className="h-4 w-px bg-gray-700 hidden md:block"></div>

                {/* Ordenar */}
                <select 
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="bg-transparent text-gray-300 border-none hover:text-white cursor-pointer focus:ring-0"
                >
                    <option value="newest" className="bg-gray-800">Más Recientes</option>
                    <option value="price_asc" className="bg-gray-800">Menor Precio</option>
                    <option value="price_desc" className="bg-gray-800">Mayor Precio</option>
                </select>

                {/* Inputs de Precio (Discretos) */}
                <div className="flex items-center gap-1 ml-2 bg-gray-800 rounded px-2 py-1 border border-gray-700">
                    <input 
                        type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                        className="w-16 bg-transparent text-white text-xs outline-none placeholder-gray-500"
                    />
                    <span className="text-gray-500">-</span>
                    <input 
                        type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-16 bg-transparent text-white text-xs outline-none placeholder-gray-500"
                    />
                </div>
            </div>
        </div>
      </div>

      {/* ==================================================================
          2. BANNER PRINCIPAL (Debajo del Header)
         ================================================================== */}
      <div className="w-full relative bg-gray-800">
         {/* La imagen DEBE estar en la carpeta /public */}
         <img 
            src="/banner.jpg" 
            alt="MossTall Banner" 
            className="w-full h-auto object-cover max-h-[400px] md:max-h-[500px] shadow-2xl"
         />
         {/* Sombra inferior suave para conectar con el fondo */}
         <div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-[#121212] to-transparent"></div>
      </div>


      {/* ==================================================================
          3. RESULTADOS (Grid de Productos)
         ================================================================== */}
      <div className="container mx-auto px-4 py-12">
        
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl text-white font-light">
                Basado en tu última visita
                {loading && <span className="text-sm text-gray-500 ml-3 animate-pulse">Cargando...</span>}
            </h2>
        </div>

        {/* Mensaje de Error */}
        {error && (
            <div className="rounded-lg border border-red-900 bg-red-900/20 p-6 text-center mb-8">
                <p className="text-xl text-red-500 mb-1">¡Ups! Algo salió mal</p>
                <p className="text-gray-400 text-sm">{error}</p>
            </div>
        )}

        {/* Sin Resultados */}
        {!loading && !error && products.length === 0 && (
            <div className="col-span-full py-24 text-center bg-gray-900 rounded-xl border border-gray-800 border-dashed">
                <p className="text-6xl mb-4 text-gray-700">🔍</p>
                <p className="text-xl text-gray-300 font-medium">No encontramos publicaciones.</p>
                <p className="text-gray-500 mt-2 text-sm">Intenta buscar con otras palabras o quita los filtros.</p>
                <button 
                    onClick={() => {
                        setSearchTerm(''); setSelectedCategoryId(''); setMinPrice(''); setMaxPrice(''); setCondition('');
                    }}
                    className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    Limpiar Filtros
                </button>
            </div>
        )}

        {/* GRILLA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {!loading && !error && products.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
            
            {/* Skeletons de Carga */}
            {loading && products.length === 0 && [1,2,3,4,5].map(i => (
                <div key={i} className="h-80 rounded-lg bg-gray-900 animate-pulse border border-gray-800"></div>
            ))}
        </div>

      </div>
    </main>
  );
}