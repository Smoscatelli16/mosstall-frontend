// src/app/product/[productId]/page.tsx
import { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';

async function getProductData(productId: string) {
    try {
        const res = await fetch(`https://mosstall-desa-production.up.railway.app/api/products/${productId}`, {
            next: { revalidate: 30 }
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("[Next.js Error] Error al obtener producto para metadata:", error);
        return null;
    }
}

// --- METADATA DINÁMICA (OPEN GRAPH - TASK 8.1) ---
export async function generateMetadata({ params }: { params: Promise<{ productId?: string; id?: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const productId = resolvedParams.productId || resolvedParams.id || '';
    const product = await getProductData(productId);

    if (!product) {
        return {
            title: 'Producto no encontrado | Mission Vende',
            description: 'El producto o servicio solicitado no se encuentra disponible.'
        };
    }

    const title = `${product.title} | Mission Vende`;
    const description = product.description 
        ? product.description.substring(0, 160)
        : `Mira ${product.title} en Mission Vende.`;
        
    const ogImage = (product.images && product.images.length > 0)
        ? product.images[0]
        : 'https://mosstall-desa-production.up.railway.app/default-og.png';

    const productUrl = `https://mosstall-desa-production.up.railway.app/product/${productId}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: productUrl,
            siteName: 'Mission Vende',
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: product.title,
                }
            ],
            locale: 'es_AR',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage],
        },
    };
}

export default async function ProductPage({ params }: { params: Promise<{ productId?: string; id?: string }> }) {
    const resolvedParams = await params;
    const productId = resolvedParams.productId || resolvedParams.id || '';
    const initialProduct = await getProductData(productId);

    return <ProductDetailClient initialProduct={initialProduct} productId={productId} />;
}