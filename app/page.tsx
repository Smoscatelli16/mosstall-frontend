// Esta es la NUEVA página principal: http://localhost:3000/
// Se ha convertido en nuestra "vidriera" (Marketplace).

"use client";

import { useState, useEffect } from 'react'; // Importamos useEffect
import Link from 'next/link';

// --- (INICIO) Definición de Tipos ---
// Le decimos a TypeScript cómo es la estructura de un Producto
// que recibimos del backend (incluyendo el nombre del creador).
type ProductCreator = {
  name: string | null;
};

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  createdAt: string; // El backend nos da la fecha como texto (string)
  creator: ProductCreator;
};
// --- (FIN) Definición de Tipos ---


// --- (INICIO) Componente de Tarjeta de Producto ---
// Creamos un sub-componente para que el código sea más limpio.
// Muestra una "tarjeta" individual para cada producto.
function ProductCard({ product }: { product: Product }) {
  return (
    <div className="rounded-lg bg-gray-800 shadow-lg overflow-hidden">
      {/* Puedes agregar una imagen aquí más adelante */}
      {/* <img src={product.images[0] || 'default-image.png'} alt={product.title} className="w-full h-48 object-cover" /> */}
      
      <div className="p-5">
        <h3 className="text-xl font-bold text-white mb-2">{product.title}</h3>
        
        <p className="text-gray-400 mb-4 h-20 overflow-hidden">
          {product.description}
        </p>
        
        <div className="flex justify-between items-center mb-4">
          <span className="text-2xl font-bold text-blue-400">${product.price}</span>
          <span className="text-sm text-gray-500">
            Vendido por: <span className="font-medium text-gray-300">{product.creator.name || 'Anónimo'}</span>
          </span>
        </div>
        
        {/* --- ¡MODIFICACIÓN AQUÍ! --- */}
        {/* Reemplazamos el <button> por un <Link> que se ve igual */}
        <Link 
          href={`/product/${product.id}`}
          className="block w-full rounded-lg bg-blue-600 px-5 py-2.5 text-center font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-800"
        >
          Ver Detalles
        </Link>
      </div>
    </div>
  );
}
// --- (FIN) Componente de Tarjeta de Producto ---


// --- (INICIO) Componente Principal de la Página ---
export default function HomePage() {
  
  // --- Estados ---
  const [products, setProducts] = useState<Product[]>([]); // Una "caja" para la lista de productos
  const [loading, setLoading] = useState(true); // Para mostrar "Cargando..."
  const [error, setError] = useState<string | null>(null); // Para mostrar errores

  // --- Hook de Efecto ---
  // Esto se ejecuta UNA VEZ cuando la página se carga.
  useEffect(() => {
    // Definimos la función que irá a buscar los datos
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // ¡Llamamos a la nueva ruta PÚBLICA del backend!
        const response = await fetch('http://localhost:3001/api/products');
        
        if (!response.ok) {
          throw new Error('No se pudo cargar la lista de productos.');
        }

        const data: Product[] = await response.json();
        setProducts(data); // ¡Guardamos los productos en nuestra "caja"!

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false); // Dejamos de cargar (sea éxito o error)
      }
    };

    // Ejecutamos la función
    fetchProducts();

  }, []); // El array vacío `[]` significa: "ejecutar esto solo una vez al inicio"

  // --- Renderizado ---
  return (
    // --- CLASES REDUNDANTES ELIMINADAS ---
    <main className="p-8">
      <div className="container mx-auto">
        
        {/* --- ENCABEZADO DUPLICADO ELIMINADO --- */}
        {/* La Navbar global en layout.tsx se encarga de esto */}

        {/* Sección de la Vidriera */}
        <div>
          {/* Caso 1: Está "Cargando..." */}
          {loading && (
            <p className="text-center text-2xl text-gray-400">Cargando productos...</p>
          )}

          {/* Caso 2: Hubo un Error */}
          {error && (
            <p className="text-center text-2xl text-red-500">Error: {error}</p>
          )}

          {/* Caso 3: Éxito (y no está cargando) */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Si no hay productos */}
              {products.length === 0 && (
                <p className="text-center text-gray-400 col-span-full">
                  Aún no hay productos publicados. ¡Sé el primero!
                </p>
              )}

              {/* Mapeamos los productos y creamos una "tarjeta" por cada uno */}
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}

            </div>
          )}
        </div>

      </div>
    </main>
  );
}