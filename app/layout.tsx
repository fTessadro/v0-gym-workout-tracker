import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { PWARegistrator } from '@/components/pwa-registrator'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Gym Tracker - Trackea tus entrenamientos',
  description: 'App mobile-first para registrar y seguimiento de entrenamientos de gimnasio. Trackea ejercicios, series, repeticiones y peso.',
  generator: 'v0.app',
  applicationName: 'Gym Tracker',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Gym Tracker',
  },
  formatDetection: {
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    minimumScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: [
      {
        url: '/icon-192.png',
        sizes: '192x192',
      },
      {
        url: '/icon-512.png',
        sizes: '512x512',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <PWARegistrator />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
