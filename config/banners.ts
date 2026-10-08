// config/banners.ts

export interface BannerItem {
  id: string | number;
  imageUrlDesktop: string;
  imageUrlMobile: string;
  altText: string;
  linkUrl: string;
  active: boolean;
}

export const banners: BannerItem[] = [
  {
    id: 1,
    imageUrlDesktop: '/banner.jpg',
    imageUrlMobile: '/banner.jpg', // Podés poner una versión vertical o cuadrada si la tenés
    altText: 'Compra Seguro en Misiones con Mission Vende',
    linkUrl: '/se-busca',
    active: true,
  },
  {
    id: 2,
    imageUrlDesktop: '/banner-2.png',
    imageUrlMobile: '/banner-2.png',
    altText: 'Vende tu auto al mejor precio',
    linkUrl: '/',
    active: true,
  },
  // Añade nuevos banners aquí
  {
    id: 3,
    imageUrlDesktop: '/banner-3.png',
    imageUrlMobile: '/banner-3.png',
    altText: 'Vende tu auto al mejor precio',
    linkUrl: '/',
    active: true,
  },
  {
    id: 4,
    imageUrlDesktop: '/banner-4.jpeg',
    imageUrlMobile: '/banner-4.jpeg',
    altText: 'Compra Seguro en Misiones con Mission Vende',
    linkUrl: '/se-busca',
    active: true, // Cambiar a false para ocultar esta campaña
  },
];