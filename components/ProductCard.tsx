// src/app/components/ProductCard.tsx
import Link from 'next/link';

type ProductCreator = { name: string | null };
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
  images: string[];
  condition?: 'NUEVO' | 'USADO' | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  mileage?: number | null;
};

export default function ProductCard({ product }: { product: Product }) {
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
  const mainImage = product.images && product.images.length > 0 ? product.images[0] : null;

  return (
    <Link 
      href={`/product/${product.id}`}
      className="block rounded-2xl bg-white shadow-md overflow-hidden border-2 border-transparent hover:border-[#1a237e] transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 active:scale-[0.98] active:opacity-90 flex flex-col h-full group cursor-pointer"
    >
      {/* Contenedor de Imagen */}
      <div className="h-60 bg-gray-50 flex items-center justify-center relative shrink-0 overflow-hidden">
        {mainImage ? (
            <img 
                src={mainImage} 
                alt={product.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
        ) : (
            <span className="text-5xl filter grayscale opacity-20 text-black">{typeIcon}</span>
        )}
        
        {/* Etiqueta NUEVO en Rojo Corporativo */}
        {product.condition === 'NUEVO' && (
            <span className="absolute top-3 left-3 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white rounded-lg shadow-md bg-[#d50000] z-10">
                NUEVO
            </span>
        )}
      </div>
      
      {/* Información del Producto */}
      <div className="p-5 flex flex-col grow">
        <div className="mb-2">
            {/* Precio en Azul Profundo Corporativo */}
            <span className={`text-3xl font-black tracking-tight ${showPrice ? 'text-[#1a237e]' : 'text-gray-900'}`}>
                {priceDisplay}
            </span>
        </div>

        {/* Título en Negro Puro */}
        <h3 className="text-sm font-bold text-black mb-1 leading-snug line-clamp-2 group-hover:text-[#d50000] transition-colors" title={product.title}>
            {product.title}
        </h3>

        {/* Especificaciones */}
        {hasVehicleSpecs && (
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-gray-500 mt-2 bg-gray-100 px-2 py-1 rounded-md w-fit">
                {product.year && <span>{product.year}</span>}
                {product.mileage !== null && product.mileage !== undefined && <span>• {product.mileage.toLocaleString('es-AR')} km</span>}
            </div>
        )}
        
        {/* Footer de la Tarjeta Limpio y Priorizando Espacios */}
        <div className="mt-auto pt-5 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-semibold truncate w-full text-left">
              Vendedor: <span className="text-black">{product.creator?.name || 'Anónimo'}</span>
            </span>
        </div>
      </div>
    </Link>
  );
}