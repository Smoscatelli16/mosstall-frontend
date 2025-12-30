// src/app/profile/[id]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type Review = {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    reviewer: { name: string | null };
};

type Product = {
    id: string;
    title: string;
    price: number;
    type: string;
    images: string[];
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
        certifications: string[]; // <--- NUEVO CAMPO AGREGADO
    } | null;
    reviewsReceived: Review[];
    products: Product[];
};

export default function PublicProfilePage() {
    const params = useParams();
    const userId = params.id as string;

    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPublicProfile = async () => {
            try {
                const res = await fetch(`http://localhost:3001/api/profile/${userId}`);
                
                if (!res.ok) {
                    if (res.status === 404) throw new Error("Usuario no encontrado");
                    throw new Error("Error al cargar perfil");
                }
                const data = await res.json();
                setUser(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchPublicProfile();
    }, [userId]);

    if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white"><div className="text-4xl animate-bounce">🚀</div></div>;
    if (error) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-400 font-bold">{error}</div>;
    if (!user) return null;

    // Helpers
    const profile = user.professionalProfile;
    const averageRating = user.reviewsReceived.length > 0
        ? (user.reviewsReceived.reduce((acc, r) => acc + r.rating, 0) / user.reviewsReceived.length).toFixed(1)
        : "N/A";

    return (
        <main className="min-h-screen bg-gray-900 text-white pb-20">
            
            {/* --- CABECERA DE PERFIL --- */}
            <div className="bg-linear-to-b from-gray-800 to-gray-900 border-b border-gray-800 pb-8 pt-12 px-4">
                <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-center md:items-start gap-6">
                    
                    {/* Avatar Grande */}
                    <div className="h-32 w-32 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-5xl border-4 border-gray-900 shadow-xl shrink-0">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>

                    <div className="text-center md:text-left grow">
                        <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                        <p className="text-blue-400 font-medium text-lg mt-1">{profile?.profession || 'Usuario de MossTall'}</p>
                        
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">📅 Miembro desde {new Date(user.createdAt).getFullYear()}</span>
                            
                            {user.reviewsReceived.length > 0 && (
                                <span className="flex items-center gap-1 text-yellow-400">⭐ {averageRating} ({user.reviewsReceived.length} reseñas)</span>
                            )}
                            
                            {/* Solo muestra experiencia si existe */}
                            {profile?.experienceYears && <span className="flex items-center gap-1 text-green-400">🎓 {profile.experienceYears} años exp.</span>}
                        </div>
                    </div>

                    {/* Botón de Contacto */}
                    <div className="shrink-0">
                        <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-transform hover:scale-105">
                            Contactar
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-5xl px-4 mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* --- COLUMNA IZQUIERDA (Biografía y Portafolio) --- */}
                <div className="md:col-span-2 space-y-8">
                    
                    {/* Biografía (MODIFICADO: Solo se muestra si tiene contenido) */}
                    {profile?.biography && (
                        <section className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                            <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Sobre mí</h2>
                            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {profile.biography}
                            </p>
                        </section>
                    )}

                    {/* Educación (Solo se muestra si tiene contenido) */}
                    {profile?.education && (
                        <section className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                             <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">🎓 Formación</h2>
                             <p className="text-gray-300">{profile.education}</p>
                        </section>
                    )}

                    {/* --- NUEVA SECCIÓN: Títulos y Certificados --- */}
                    {profile?.certifications && profile.certifications.length > 0 && (
                        <section>
                            <h2 className="text-xl font-bold text-blue-300 mb-4 flex items-center gap-2">📜 Credenciales Verificadas</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {profile.certifications.map((img, idx) => (
                                    <div key={idx} className="aspect-video rounded-lg overflow-hidden border border-blue-900/50 hover:border-blue-500 transition-colors cursor-pointer bg-gray-800">
                                        <img src={img} alt={`Certificado ${idx}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Portafolio (Galería) */}
                    {profile?.portfolioImages && profile.portfolioImages.length > 0 && (
                        <section>
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">📸 Portafolio de Trabajos</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {profile.portfolioImages.map((img, idx) => (
                                    <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-colors group cursor-pointer">
                                        <img src={img} alt={`Trabajo ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Publicaciones Activas (Solo si hay productos) */}
                    {user.products.length > 0 && (
                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">📢 Publicaciones de {user.name}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {user.products.map((prod) => (
                                    <Link href={`/product/${prod.id}`} key={prod.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:bg-gray-700 transition-colors flex gap-3 items-center">
                                        <div className="h-16 w-16 bg-gray-900 rounded shrink-0 overflow-hidden">
                                            {prod.images[0] ? (
                                                <img src={prod.images[0]} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="flex items-center justify-center h-full text-2xl">📦</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-white truncate">{prod.title}</h3>
                                            <p className="text-green-400 font-bold text-sm">${prod.price.toLocaleString('es-AR')}</p>
                                            <span className="text-[10px] bg-gray-900 text-gray-400 px-2 py-0.5 rounded uppercase">{prod.type}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* --- COLUMNA DERECHA (Reputación) --- */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 sticky top-24">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            ⭐ Reputación
                        </h2>
                        
                        {user.reviewsReceived.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-3xl mb-2">💤</p>
                                <p>Sin calificaciones aún.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {user.reviewsReceived.map((review) => (
                                    <div key={review.id} className="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-gray-300 text-sm">{review.reviewer.name || 'Anónimo'}</span>
                                            <div className="flex text-yellow-500 text-xs">
                                                {'★'.repeat(review.rating)}
                                                <span className="text-gray-600 ml-1">{'★'.repeat(5 - review.rating)}</span>
                                            </div>
                                        </div>
                                        {review.comment && (
                                            <p className="text-gray-400 text-sm italic">"{review.comment}"</p>
                                        )}
                                        <p className="text-xs text-gray-600 mt-2 text-right">{new Date(review.createdAt).toLocaleDateString()}</p>
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