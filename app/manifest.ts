import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FinanzaPro — Patrimonio & Inversiones',
    short_name: 'FinanzaPro',
    description:
      'Gestión patrimonial estilo iOS & Trade Republic con DCA, liquidez e inversiones en tiempo real.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
