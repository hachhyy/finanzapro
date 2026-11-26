import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'POCKET',
  description:
    'Control Patrimonial, Flujo Mensual e Inversiones estilo Trade Republic para iOS',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'POCKET',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark bg-black text-white">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body className="bg-black text-white antialiased selection:bg-[#6366F1] selection:text-white min-h-dvh overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
