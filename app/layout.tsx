import type { Metadata, Viewport } from 'next'
import { StoreProvider } from '@/lib/store'
import { PWAInitializer } from '@/components/pwa-initializer'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

// `next/font` removed — use fonts via global CSS or local @font-face

export const metadata: Metadata = {
  title: 'FIORA | Sistema de Joyeria',
  description: 'Sistema administrativo e inventario para joyeria FIORA. Ventas rapidas, gestion de inventario y reportes.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FIORA',
    startupImage: '/IconoBeigeFondo.png',
  },
  icons: {
    icon: '/IconoBeigeFondo.png',
    apple: '/IconoBeigeFondo.png',
    shortcut: '/IconoBeigeFondo.png',
  },
  applicationName: 'FIORA',
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#092b2b',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <PWAInitializer />
        <StoreProvider>
          {children}
          <Toaster position="top-center" />
        </StoreProvider>
      </body>
    </html>
  )
}
