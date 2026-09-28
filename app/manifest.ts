import type { MetadataRoute } from 'next';

// Permite instalar NetPlanner como app desde el teléfono
// (en iPhone: Safari > Compartir > Agregar a pantalla de inicio).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NetPlanner',
    short_name: 'NetPlanner',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0A7EA4',
    icons: [
      { src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/pwa/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
