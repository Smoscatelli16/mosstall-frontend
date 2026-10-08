// src/app/profile/[id]/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from '../../components/ProductCard';

// --- TIPOS ---
type Review = {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    reviewer: { name: string | null };
};

type Store = {
    id: string;
    name: string;
    type: string;
    products: any[];
};

type UserProfile = {
    id: string;
    name: string | null;
    createdAt: string;
    professionalProfile: {
        profession: string | null;
        biography: string | null;
        experienceYears: number | null;
        education: string | null;
        portfolioImages: string[];
        certifications: string[];
    } | null;
    reviewsReceived: Review[];
    stores: Store[];
};

// --- FETCHER PARA SERVER COMPONENTS ---
async function getProfileData(userId: string): Promise<UserProfile | null> {
    try {
        const url = `http://127.0.0.1:3001/api/user/${userId}/public-profile`;
        const res = await fetch(url, { cache: 'no-store' });
        
        if (!res.ok) {
            return null;
        }
        
        return await res.json();
    } catch (error) {
        console.error("\n[Next.js Error] Falla al conectar con el backend:", error);
        return null;
    }
}

// --- METADATA DINÁMICA (SEO) ---
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const user = await getProfileData(resolvedParams.id);
    
    if (!user) {
        return { title: 'Usuario no encontrado | Mission Vende' };
    }

    return {
        title: `Catálogo de ${user.name || 'Usuario'} | Mission Vende`,
        description: user.professionalProfile?.biography 
            ? user.professionalProfile.biography.substring(0, 160)
            : `Descubre los productos y servicios ofrecidos por ${user.name || 'Usuario'} en Mission Vende.`,
    };
}

// --- RENDERIZADO DEL SERVIDOR ---
export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const user = await getProfileData(resolvedParams.id);

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
                <div className="border-dashed border-2 border-[#d50000]/30 bg-[#d50000]/5 p-8 rounded-3xl m-8 text-center max-w-md shadow-sm">
                    <span className="text-5xl block mb-4">🕵️‍♂️</span>
                    <h2 className="text-[#d50000] font-black text-xl mb-2">Perfil Inaccesible</h2>
                    <p className="text-gray-600 text-sm font-medium">El perfil de este usuario no existe, fue eliminado, o el servidor no pudo conectarse.</p>
                </div>
            </div>
        );
    }

    // Helpers
    const profile = user.professionalProfile;
    const averageRating = user.reviewsReceived.length > 0
        ? (user.reviewsReceived.reduce((acc, r) => acc + r.rating, 0) / user.reviewsReceived.length).toFixed(1)
        : "N/A";

    const hasAnyProducts = user.stores?.some(store => store.products && store.products.length > 0);

    return (
        <main className="min-h-screen bg-slate-50 text-gray-900 pb-20 font-sans">
            
            {/* --- CABECERA DE PERFIL --- */}
            <div className="bg-white border-b border-gray-100 pb-10 pt-16 px-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[#1a237e]/5 transform -skew-y-2 origin-top-left -z-10"></div>

                <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                    <div className="h-32 w-32 rounded-3xl bg-[#1a237e]/10 flex items-center justify-center text-5xl font-black text-[#1a237e] border-4 border-white shadow-lg shrink-0 uppercase">
                        {user.name?.charAt(0) || 'U'}
                    </div>

                    <div className="text-center md:text-left grow pt-2">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">{user.name}</h1>
                        <p className="text-[#1a237e] font-bold text-lg mt-1">{profile?.profession || 'Vendedor en Mission Vende'}</p>
                        
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-5 text-sm">
                            <span className="flex items-center gap-1 text-gray-500 font-bold bg-gray-100 px-3 py-1 rounded-xl">
                                📅 Miembro desde {new Date(user.createdAt).getFullYear()}
                            </span>
                            
                            {user.reviewsReceived.length > 0 && (
                                <span className="flex items-center gap-1 text-yellow-700 font-black bg-yellow-100 px-3 py-1 rounded-xl shadow-sm">
                                    ⭐ {averageRating} ({user.reviewsReceived.length} reseñas)
                                </span>
                            )}
                            
                            {profile?.experienceYears && (
                                <span className="flex items-center gap-1 text-green-700 font-black bg-green-100 px-3 py-1 rounded-xl shadow-sm">
                                    🎓 {profile.experienceYears} años exp.
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-5xl px-4 mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* --- COLUMNA IZQUIERDA (Biografía, Portafolio y Vidrieras por Tienda) --- */}
                <div className="md:col-span-2 space-y-8">
                    
                    {profile?.biography && (
                        <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                            <h2 className="text-xl font-black text-gray-900 mb-4 border-b border-gray-100 pb-3">Sobre mí</h2>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">
                                {profile.biography}
                            </p>
                        </section>
                    )}

                    {profile?.education && (
                        <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                             <h2 className="text-xl font-black text-gray-900 mb-3 flex items-center gap-2">🎓 Formación Académica</h2>
                             <p className="text-gray-600 font-medium">{profile.education}</p>
                        </section>
                    )}

                    {profile?.certifications && profile.certifications.length > 0 && (
                        <section>
                            <h2 className="text-xl font-black text-[#1a237e] mb-4 flex items-center gap-2">📜 Credenciales Verificadas</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                                {profile.certifications.map((img, idx) => (
                                    <div key={idx} className="aspect-video rounded-xl overflow-hidden border border-gray-200 hover:border-[#1a237e]/50 hover:shadow-md transition-all cursor-pointer bg-white shadow-sm">
                                        <img src={img} alt={`Certificado ${idx}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {profile?.portfolioImages && profile.portfolioImages.length > 0 && (
                        <section className="pt-4">
                            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">📸 Portafolio de Trabajos</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                                {profile.portfolioImages.map((img, idx) => (
                                    <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-gray-200 hover:border-[#1a237e]/50 transition-all group cursor-pointer shadow-sm bg-white">
                                        <img src={img} alt={`Trabajo ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* --- VIDRIERAS AGRUPADAS POR TIENDA --- */}
                    <section className="pt-6">
                        <h2 className="text-2xl font-black text-gray-900 mb-8 border-b border-gray-200 pb-3">
                            🛒 Catálogo Activo
                        </h2>
                        
                        {!hasAnyProducts ? (
                            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 border-dashed">
                                <p className="text-5xl mb-4">🏜️</p>
                                <p className="text-gray-500 font-bold">Este vendedor no tiene publicaciones activas en este momento.</p>
                            </div>
                        ) : (
                            <div className="space-y-12 w-full overflow-hidden">
                                {user.stores.map((store) => {
                                    if (!store.products || store.products.length === 0) return null;

                                    // Lógica estricta de 5 productos
                                    const displayedProducts = store.products.slice(0, 5);
                                    const remaining = store.products.length - 5;

                                    return (
                                        <div key={store.id} className="relative mb-12">
                                            
                                            {/* --- CABECERA ESTÉTICA CON DEGRADADO --- */}
                                            <div className="relative mb-6 rounded-2xl md:rounded-3xl overflow-hidden shadow-lg border border-gray-100/50 group/banner">
                                                {/* Fondos y degradados adaptativos */}
                                                <div className={`absolute inset-0 bg-gradient-to-r ${
                                                    store.type === 'PRODUCT_STORE' 
                                                        ? 'from-[#1a237e] via-blue-800 to-indigo-900' 
                                                        : store.type === 'SERVICE_PROFESSIONAL'
                                                        ? 'from-slate-800 via-gray-800 to-[#1a237e]' // Tono más sobrio para servicios
                                                        : 'from-[#311b92] via-purple-800 to-[#d50000]/80' // Tono vibrante para digital
                                                } z-0`}></div>
                                                
                                                {/* Brillos decorativos para darle profundidad */}
                                                <div className="absolute -top-24 -right-24 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl z-0 pointer-events-none"></div>
                                                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-400 opacity-20 rounded-full blur-2xl z-0 pointer-events-none"></div>

                                                <div className="relative z-10 p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                                                    <div>
                                                        <p className="text-xs md:text-sm font-black text-white/80 uppercase tracking-widest mb-1.5 drop-shadow-sm flex items-center gap-2">
                                                            {store.type === 'PRODUCT_STORE' && '🛍️ Tienda de Productos'}
                                                            {store.type === 'SERVICE_PROFESSIONAL' && '🛠️ Servicios Profesionales'}
                                                            {store.type === 'DIGITAL_CREATOR' && '💻 Creador Digital'}
                                                        </p>
                                                        <h3 className="text-2xl md:text-4xl font-black text-white drop-shadow-md tracking-tight">
                                                            {store.name}
                                                        </h3>
                                                    </div>
                                                    
                                                    <Link 
                                                        href={`/tienda/${store.id}`} 
                                                        className="shrink-0 bg-white/10 hover:bg-white text-white hover:text-[#1a237e] border border-white/30 backdrop-blur-md px-6 py-3 rounded-xl font-black text-sm transition-all duration-300 flex items-center gap-2 shadow-[0_4px_15px_rgba(0,0,0,0.1)] group/btn"
                                                    >
                                                        {store.type === 'SERVICE_PROFESSIONAL' ? 'Ver perfil completo' : 'Visitar tienda'}
                                                        <span className="group-hover/btn:translate-x-1 transition-transform">&rarr;</span>
                                                    </Link>
                                                </div>
                                            </div>

                                            {/* Carrusel */}
                                            <div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 gap-4 snap-x snap-mandatory scrollbar-hide">
                                                {displayedProducts.map((prod) => (
                                                    <div key={prod.id} className="min-w-[260px] max-w-[260px] snap-start shrink-0">
                                                        <ProductCard product={prod} />
                                                    </div>
                                                ))}

                                                {/* Tarjeta dinámica interactiva de Ver Más */}
                                                {remaining > 0 && (
                                                    <Link href={`/tienda/${store.id}`} className="min-w-[260px] max-w-[260px] snap-start shrink-0 border-2 border-dashed border-[#1a237e]/30 rounded-3xl flex flex-col items-center justify-center bg-[#1a237e]/5 hover:bg-[#1a237e]/10 transition-all text-[#1a237e] group cursor-pointer shadow-sm hover:shadow-md">
                                                        <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                                            ➕
                                                        </div>
                                                        <span className="font-black text-lg">+{remaining} {store.type === 'SERVICE_PROFESSIONAL' ? 'servicios' : 'productos'}</span>
                                                        <span className="text-sm font-bold text-[#1a237e]/70 mt-1">Ver más en el catálogo</span>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>

                {/* --- COLUMNA DERECHA (Reputación) --- */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 sticky top-24 shadow-sm">
                        <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                            ⭐ Reputación
                        </h2>
                        
                        {user.reviewsReceived.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 bg-slate-50 rounded-2xl border border-dashed border-gray-200">
                                <p className="text-4xl mb-3">💤</p>
                                <p className="font-medium text-sm">Sin calificaciones aún.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {user.reviewsReceived.map((review) => (
                                    <div key={review.id} className="bg-slate-50 p-5 rounded-2xl border border-gray-100">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="font-black text-gray-900 text-sm">{review.reviewer.name || 'Anónimo'}</span>
                                            <div className="flex text-yellow-500 text-[10px] tracking-widest">
                                                {'★'.repeat(review.rating)}
                                                <span className="text-gray-300">{'★'.repeat(5 - review.rating)}</span>
                                            </div>
                                        </div>
                                        {review.comment && (
                                            <p className="text-gray-600 text-[13px] italic mb-3 font-medium">"{review.comment}"</p>
                                        )}
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{new Date(review.createdAt).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </main>
    );
}