// src/app/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from './components/ProductCard';
import StorefrontFilters from './components/StorefrontFilters';
import HeroCarousel from './components/HeroCarousel';

// Definimos el tipo asíncrono que exige Next.js 15+
type SearchParams = Promise<{ [key: string]: string | undefined }>;

// 1. Configuración de SEO Local para Google
export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  // Desenvolvemos la promesa de los parámetros
  const resolvedParams = await searchParams;
  const query = resolvedParams?.search;
  
  return {
    title: query ? `${query} en Mission Vende` : 'Mission Vende | Compra y Venta en Misiones',
    description: 'Encuentra productos, servicios y vehículos en Posadas. El marketplace regional más seguro con fideicomiso.',
  };
}

// 2. Fetcher de Productos y Paginación (Corre en el Servidor)
async function getProductsData(resolvedParams: { [key: string]: string | undefined }) {
  const params = new URLSearchParams();
  Object.entries(resolvedParams).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });

  try {
    const res = await fetch(`http://localhost:3001/api/products?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) return { products: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
    return await res.json();
  } catch (error) {
    return { products: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  }
}

// 3. Fetcher de Categorías (Corre en el Servidor)
async function getCategories() {
  try {
    const res = await fetch('http://localhost:3001/api/categories', { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

// Helper para construir URLs sin perder los filtros actuales
const buildUrl = (resolvedParams: any, key: string, value: string) => {
    const params = new URLSearchParams(resolvedParams as any);
    if (value) params.set(key, value);
    else params.delete(key);
    
    // Si se cambia el tipo, reiniciar la página a 1
    if (key === 'type') params.delete('page');
    
    return `/?${params.toString()}`;
}

// 4. Renderizado de la Página Principal (Server Component)
export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  
  // Desenvolvemos la promesa de los parámetros obligatoriamente para Next 15+
  const resolvedParams = await searchParams;

  // Verificamos si el usuario está realizando una búsqueda activa (texto o filtros)
  const isSearchActive = Object.keys(resolvedParams).some(key => resolvedParams[key] !== undefined && resolvedParams[key] !== '' && key !== 'page');
  const currentType = resolvedParams.type || '';
  const currentPage = Number(resolvedParams.page) || 1;

  // Hacemos las dos peticiones al mismo tiempo para mayor velocidad
  const [productsData, categories] = await Promise.all([
    getProductsData(resolvedParams),
    getCategories()
  ]);

  // Manejo de compatibilidad (por si el backend devuelve un array directo o el nuevo objeto paginado)
  const products = Array.isArray(productsData) ? productsData : (productsData.products || []);
  const pagination = productsData.pagination || { currentPage: 1, totalPages: 1, totalItems: products.length };

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      
      {/* Lógica Condicional: Ocultamos el Banner si hay búsqueda */}
      {!isSearchActive && <HeroCarousel />}

      {/* HEADER DE FILTROS INTERACTIVOS (Sticky Mobile First) */}
      <StorefrontFilters categories={categories} />

      {/* BRIEF #041: CHIPS DE FILTRO POR TIPO (Sticky debajo de StorefrontFilters) */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30 shadow-sm">
          <div className="container mx-auto px-4 py-3 flex gap-3 overflow-x-auto scrollbar-hide items-center">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2">Ver:</span>
              <Link 
                href={buildUrl(resolvedParams, 'type', '')} 
                className={`px-5 py-2 rounded-full text-sm font-black transition-colors whitespace-nowrap ${!currentType ? 'bg-[#1a237e] text-white shadow-md' : 'bg-slate-100 text-gray-600 hover:bg-slate-200'}`}
              >
                  Todo
              </Link>
              <Link 
                href={buildUrl(resolvedParams, 'type', 'PRODUCTO')} 
                className={`px-5 py-2 rounded-full text-sm font-black transition-colors whitespace-nowrap ${currentType === 'PRODUCTO' ? 'bg-[#1a237e] text-white shadow-md' : 'bg-slate-100 text-gray-600 hover:bg-slate-200'}`}
              >
                  📦 Productos Físicos
              </Link>
              <Link 
                href={buildUrl(resolvedParams, 'type', 'SERVICIO')} 
                className={`px-5 py-2 rounded-full text-sm font-black transition-colors whitespace-nowrap ${currentType === 'SERVICIO' ? 'bg-[#1a237e] text-white shadow-md' : 'bg-slate-100 text-gray-600 hover:bg-slate-200'}`}
              >
                  🛠️ Servicios Profesionales
              </Link>
              <Link 
                href={buildUrl(resolvedParams, 'type', 'INFOPRODUCTO')} 
                className={`px-5 py-2 rounded-full text-sm font-black transition-colors whitespace-nowrap ${currentType === 'INFOPRODUCTO' ? 'bg-[#1a237e] text-white shadow-md' : 'bg-slate-100 text-gray-600 hover:bg-slate-200'}`}
              >
                  📂 Infoproductos Digitales
              </Link>
          </div>
      </div>

      {/* RESULTADOS Y GRILLA */}
      <div className="container mx-auto px-4 py-8 pb-20">
        
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl text-gray-900 font-black tracking-tight">
                {isSearchActive ? 'Resultados de tu búsqueda' : 'Últimas publicaciones'}
            </h2>
            {pagination.totalItems > 0 && (
              <span className="text-sm font-bold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                {pagination.totalItems} {pagination.totalItems === 1 ? 'resultado' : 'resultados'}
              </span>
            )}
        </div>

        {products.length === 0 ? (
            <div className="col-span-full py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-6xl mb-4">🔍</p>
                <p className="text-xl text-gray-900 font-bold">No encontramos publicaciones.</p>
                <p className="text-gray-500 mt-2 text-sm font-medium">Intenta buscar con otras palabras o quita los filtros.</p>
                <Link href="/" className="mt-6 inline-block px-8 py-3 bg-[#1a237e] text-white rounded-xl hover:bg-[#121858] transition-transform hover:-translate-y-0.5 shadow-md font-black">
                    Limpiar Filtros
                </Link>
            </div>
        ) : (
            <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                    {products.map((product: any) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>

                {/* BRIEF #041: CONTROLES DE PAGINACIÓN */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-16">
                        {currentPage > 1 && (
                            <Link href={buildUrl(resolvedParams, 'page', String(currentPage - 1))} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-slate-50 transition-colors">
                                &larr; Anterior
                            </Link>
                        )}
                        
                        <div className="flex gap-1 items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNumber) => (
                                <Link 
                                    key={pageNumber} 
                                    href={buildUrl(resolvedParams, 'page', String(pageNumber))}
                                    className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-black transition-colors ${pageNumber === currentPage ? 'bg-[#1a237e] text-white' : 'text-gray-600 hover:bg-slate-100'}`}
                                >
                                    {pageNumber}
                                </Link>
                            ))}
                        </div>

                        {currentPage < pagination.totalPages && (
                            <Link href={buildUrl(resolvedParams, 'page', String(currentPage + 1))} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-slate-50 transition-colors">
                                Siguiente &rarr;
                            </Link>
                        )}
                    </div>
                )}
            </>
        )}

      </div>
    </main>
  );
}