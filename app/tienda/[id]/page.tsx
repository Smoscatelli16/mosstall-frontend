// src/app/tienda/[id]/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from '../../components/ProductCard';

// --- TIPOS ---
type ProfessionalProfile = {
    profession: string | null;
    biography: string | null;
    experienceYears: number | null;
    education: string | null;
    certifications: string[];
};

type StoreOwner = {
    id: string;
    name: string | null;
    professionalProfile: ProfessionalProfile | null;
};

type Store = {
    id: string;
    name: string;
    description: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    type: string;
    createdAt: string;
    ratingAverage: number | null;
    totalReviews: number;
    owner: StoreOwner;
    products: any[];
};

// --- FETCHER PARA SERVER COMPONENTS ---
async function getStoreData(storeId: string): Promise<Store | null> {
    try {
        // Al ser Server Component, se comunica localmente con el backend por 127.0.0.1
        const url = `http://127.0.0.1:3001/api/stores/${storeId}`;
        const res = await fetch(url, { cache: 'no-store' });
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error(`❌ [Next.js Server] Error HTTP ${res.status} al buscar tienda:`, errorText);
            return null;
        }
        
        return await res.json();
    } catch (error) {
        console.error("\n❌ [Next.js Error crítico] Falla de red al conectar con el backend:", error);
        return null;
    }
}

// --- METADATA DINÁMICA (SEO) ---
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const store = await getStoreData(resolvedParams.id);
    
    if (!store) {
        return { title: 'Tienda no encontrada | Mission Vende' };
    }

    return {
        title: `${store.name} | Mission Vende`,
        description: store.description 
            ? store.description.substring(0, 160)
            : `Descubre el catálogo de ${store.name} en Mission Vende.`,
    };
}

// --- RENDERIZADO DEL SERVIDOR ---
export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const store = await getStoreData(resolvedParams.id);

    if (!store) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
                <div className="border-dashed border-2 border-[#d50000]/30 bg-[#d50000]/5 p-8 rounded-3xl m-8 text-center max-w-md shadow-sm">
                    <span className="text-5xl block mb-4">🏪</span>
                    <h2 className="text-[#d50000] font-black text-xl mb-2">Tienda Inaccesible</h2>
                    <p className="text-gray-600 text-sm font-medium">Esta tienda no existe, fue eliminada, o el servidor no pudo conectarse.</p>
                    <Link href="/" className="mt-6 inline-block bg-[#1a237e] text-white px-6 py-2 rounded-xl font-bold">Volver al inicio</Link>
                </div>
            </div>
        );
    }

    // Helpers
    const isService = store.type === 'SERVICE_PROFESSIONAL';
    const isDigital = store.type === 'DIGITAL_CREATOR';
    const isProduct = store.type === 'PRODUCT_STORE';
    const profProfile = store.owner.professionalProfile;

    return (
        <main className="min-h-screen bg-slate-50 text-gray-900 pb-20 font-sans">
            
            {/* --- HERO BANNER (CABECERA ESTÉTICA) --- */}
            <div className="relative w-full h-[300px] md:h-[350px] overflow-hidden shadow-md">
                {/* Degradado dinámico basado en el tipo de tienda */}
                <div className={`absolute inset-0 bg-gradient-to-r ${
                    isProduct ? 'from-[#1a237e] via-blue-800 to-indigo-900' : 
                    isService ? 'from-slate-800 via-gray-800 to-[#1a237e]' : 
                    'from-[#311b92] via-purple-800 to-[#d50000]/80'
                } z-0`}></div>
                
                {/* Brillos decorativos */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl z-0 pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-400 opacity-20 rounded-full blur-2xl z-0 pointer-events-none transform -translate-x-1/4 translate-y-1/4"></div>

                {/* Si la tienda tiene banner, lo superponemos sutilmente */}
                {store.bannerUrl && (
                    <img 
                        src={store.bannerUrl} 
                        alt={`Banner de ${store.name}`} 
                        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40 z-0"
                    />
                )}
            </div>

            {/* --- CONTENIDO PRINCIPAL --- */}
            <div className="container mx-auto max-w-6xl px-4 relative z-10 -mt-24 md:-mt-32">
                
                {/* Panel de Información Superior */}
                <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-xl border border-gray-100 flex flex-col md:flex-row gap-8 items-center md:items-start mb-10">
                    
                    {/* Logo / Avatar de la tienda */}
                    <div className="w-32 h-32 md:w-40 md:h-40 shrink-0 bg-white rounded-3xl shadow-lg border-4 border-white flex items-center justify-center text-5xl font-black text-[#1a237e] overflow-hidden z-20">
                        {store.logoUrl ? (
                            <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
                        ) : (
                            store.name.charAt(0).toUpperCase()
                        )}
                    </div>

                    <div className="flex-grow text-center md:text-left mt-2 md:mt-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">
                                    {isProduct && '🛍️ Tienda de Productos'}
                                    {isService && '🛠️ Servicios Profesionales'}
                                    {isDigital && '💻 Creador Digital'}
                                </span>
                                <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">{store.name}</h1>
                            </div>
                            
                            {/* Propietario */}
                            <Link href={`/profile/${store.owner.id}`} className="inline-flex items-center gap-2 bg-slate-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 px-4 py-2 rounded-xl transition-colors group">
                                <span className="text-sm font-medium text-gray-500">De:</span>
                                <span className="text-sm font-black text-[#1a237e] group-hover:underline">{store.owner.name}</span>
                                <span className="text-gray-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
                            </Link>
                        </div>

                        {store.description && (
                            <p className="mt-4 text-gray-600 font-medium leading-relaxed max-w-3xl">
                                {store.description}
                            </p>
                        )}

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6">
                            <span className="text-sm font-bold text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
                                📅 Creada en {new Date(store.createdAt).getFullYear()}
                            </span>
                            <span className="text-sm font-black text-blue-800 bg-blue-100 px-4 py-2 rounded-lg shadow-sm">
                                📦 {store.products.length} publicaciones
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* --- COLUMNA IZQUIERDA: Filtros e Info Extra --- */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* Bloque de Perfil Profesional (Solo para Servicios) */}
                        {isService && profProfile && (
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-black text-gray-900 mb-4 border-b border-gray-100 pb-3 flex items-center gap-2">
                                    🎓 Respaldo Profesional
                                </h3>
                                {profProfile.profession && (
                                    <p className="text-sm font-bold text-[#1a237e] mb-2">{profProfile.profession}</p>
                                )}
                                {profProfile.education && (
                                    <p className="text-sm text-gray-600 mb-3"><span className="font-bold text-gray-800">Formación:</span> {profProfile.education}</p>
                                )}
                                {profProfile.experienceYears && (
                                    <p className="text-sm text-gray-600 mb-4"><span className="font-bold text-gray-800">Experiencia:</span> {profProfile.experienceYears} años</p>
                                )}
                                {profProfile.certifications && profProfile.certifications.length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Matrículas / Certificados</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {profProfile.certifications.slice(0, 2).map((cert, idx) => (
                                                <div key={idx} className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                                    <img src={cert} alt="Certificación" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm sticky top-24">
                            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                                ⭐ Reputación de Tienda
                            </h3>
                            <div className="text-center py-6 bg-slate-50 rounded-2xl border border-gray-100">
                                <span className="text-4xl font-black text-gray-900 block mb-1">
                                    {store.ratingAverage ? store.ratingAverage.toFixed(1) : '-'}
                                </span>
                                <div className="flex justify-center text-yellow-400 text-sm mb-2">
                                    {'★'.repeat(Math.round(store.ratingAverage || 0))}
                                    <span className="text-gray-300">{'★'.repeat(5 - Math.round(store.ratingAverage || 0))}</span>
                                </div>
                                <p className="text-xs font-bold text-gray-500">
                                    {store.totalReviews} calificaciones
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* --- COLUMNA DERECHA: Catálogo --- */}
                    <div className="lg:col-span-3">
                        <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
                            <h2 className="text-2xl font-black text-gray-900">
                                {isService ? 'Servicios Disponibles' : 'Catálogo Activo'}
                            </h2>
                        </div>

                        {store.products.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                                <p className="text-5xl mb-4">🏜️</p>
                                <p className="text-xl font-bold text-gray-800 mb-2">Vidriera vacía</p>
                                <p className="text-gray-500 font-medium">Esta tienda aún no tiene publicaciones activas.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {store.products.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </main>
    );
}