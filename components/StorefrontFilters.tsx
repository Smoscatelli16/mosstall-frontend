// src/app/components/StorefrontFilters.tsx
"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

type Category = {
  id: string;
  name: string;
  children?: Category[];
};

export default function StorefrontFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState(searchParams.get('categoryId') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sort') || 'newest');
  
  // Estado para desplegar filtros adicionales (Mobile y PC)
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategoryId) params.append('categoryId', selectedCategoryId);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (condition) params.append('condition', condition);
      if (sortOrder && sortOrder !== 'newest') params.append('sort', sortOrder);

      router.push(`/?${params.toString()}`);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedCategoryId, minPrice, maxPrice, condition, sortOrder, router]);

  // Contar filtros activos
  const activeFiltersCount = [selectedCategoryId, minPrice, maxPrice, condition].filter(Boolean).length;

  return (
    <div className="bg-[#1a237e] border-b border-[#121858] sticky top-0 z-40 shadow-lg">
      <div className="container mx-auto px-4 py-3">
          
          {/* LÍNEA PRINCIPAL COMPACTA: Buscador + Botón Buscar + Botón Filtros */}
          <div className="flex items-center gap-2 md:gap-3 w-full max-w-5xl mx-auto">
              
              {/* Contenedor de Búsqueda Integrado */}
              <div className="flex flex-grow bg-white rounded-xl overflow-hidden shadow-inner border border-transparent focus-within:border-blue-400 transition-colors">
                  <input 
                      type="text"
                      placeholder="Buscar en Mission Vende..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-transparent text-gray-900 px-4 py-2.5 outline-none text-sm md:text-base font-medium placeholder-gray-400"
                  />
                  <button className="bg-[#d50000] hover:bg-red-700 text-white px-4 md:px-6 py-2.5 font-black text-sm md:text-base transition-colors flex items-center justify-center shrink-0">
                      <span className="hidden md:inline">Buscar</span>
                      <span className="md:hidden text-lg">🔍</span>
                  </button>
              </div>

              {/* Botón Toggle de Filtros */}
              <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`shrink-0 flex items-center justify-center gap-1.5 px-3 md:px-5 py-2.5 rounded-xl border font-bold text-sm transition-colors ${
                      showFilters ? 'bg-white text-[#1a237e] border-white shadow-sm' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  }`}
              >
                  <span className="hidden md:inline">Filtros</span>
                  ⚙️
                  {activeFiltersCount > 0 && (
                      <span className="bg-[#d50000] text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm">
                          {activeFiltersCount}
                      </span>
                  )}
              </button>
          </div>

          {/* ÁREA DE FILTROS DESPLEGABLE (Colapsable) */}
          <div className={`transition-all duration-300 ease-in-out overflow-hidden max-w-5xl mx-auto flex flex-wrap items-center gap-3 text-sm font-bold ${
              showFilters ? 'max-h-96 opacity-100 pt-4 pb-1' : 'max-h-0 opacity-0 m-0'
          }`}>
              <select 
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full md:w-auto bg-white/10 text-white border-none rounded-xl px-4 py-2.5 hover:bg-white/20 cursor-pointer outline-none transition-colors appearance-none focus:ring-2 focus:ring-white/50"
              >
                  <option value="" className="text-gray-900 bg-white font-bold">Todas las Categorías</option>
                  {categories.map(cat => (
                      <optgroup key={cat.id} label={cat.name} className="text-[#1a237e] bg-slate-50 font-black">
                          {cat.children?.map(child => (
                              <option key={child.id} value={child.id} className="font-medium text-gray-800 bg-white">{child.name}</option>
                          ))}
                          {(!cat.children || cat.children.length === 0) && <option value={cat.id} className="font-medium text-gray-800 bg-white">{cat.name}</option>}
                      </optgroup>
                  ))}
              </select>

              <select 
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full md:w-auto bg-white/10 text-white border-none rounded-xl px-4 py-2.5 hover:bg-white/20 cursor-pointer outline-none transition-colors appearance-none"
              >
                  <option value="" className="text-gray-900 bg-white font-bold">Condición (Todas)</option>
                  <option value="NUEVO" className="text-gray-800 bg-white">Nuevo</option>
                  <option value="USADO" className="text-gray-800 bg-white">Usado</option>
              </select>

              <select 
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full md:w-auto bg-white/10 text-white border-none rounded-xl px-4 py-2.5 hover:bg-white/20 cursor-pointer outline-none transition-colors appearance-none"
              >
                  <option value="newest" className="text-gray-900 bg-white font-bold">Más Recientes</option>
                  <option value="price_asc" className="text-gray-800 bg-white">Menor Precio</option>
                  <option value="price_desc" className="text-gray-800 bg-white">Mayor Precio</option>
              </select>

              {/* Rango de Precios */}
              <div className="w-full md:w-auto flex items-center justify-between gap-2 bg-white/10 rounded-xl px-4 py-2.5">
                  <span className="text-white/70 font-black">$</span>
                  <input 
                      type="number" placeholder="Mínimo" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                      className="w-1/2 md:w-20 bg-transparent text-white text-sm outline-none placeholder-white/50 font-bold"
                  />
                  <span className="text-white/30 font-bold">-</span>
                  <input 
                      type="number" placeholder="Máximo" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-1/2 md:w-20 bg-transparent text-white text-sm outline-none placeholder-white/50 font-bold text-right md:text-left"
                  />
              </div>

              {/* Botón de Limpiar */}
              {activeFiltersCount > 0 && (
                <button 
                  onClick={() => {
                    setSelectedCategoryId(''); setMinPrice(''); setMaxPrice(''); setCondition('');
                  }}
                  className="w-full md:w-auto text-xs text-white/70 hover:text-white font-bold underline transition-colors pt-2 md:pt-0"
                >
                  Limpiar Filtros
                </button>
              )}
          </div>
      </div>
    </div>
  );
}