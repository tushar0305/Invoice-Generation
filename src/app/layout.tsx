import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SupabaseProvider } from '@/supabase/provider';
import { AuthWrapper } from '@/components/auth-wrapper';
import { QueryProvider } from '@/components/query-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { AppListeners } from '@/components/app-listeners';
import { InstallPrompt } from '@/components/install-prompt';
import { UpdatePrompt } from '@/components/update-prompt';

export const metadata: Metadata = {
  metadataBase: new URL('https://swarnavyapar.in'),
  title: {
    default: 'SwarnaVyapar - Premium Jewellery Management Software',
    template: '%s | SwarnaVyapar',
  },
  description:
    'India\'s most premium jewellery management suite. Create professional invoices, track stock, and manage customers with elegance. Designed for modern jewellers.',
  keywords: [
    'jewellery software',
    'jewellery billing software',
    'gold invoice generator',
    'jewellery inventory management',
    'hallmarking software',
    'gst billing software for jewellers',
    'swarnavyapar',
  ],
  authors: [{ name: 'SwarnaVyapar Team' }],
  creator: 'SwarnaVyapar',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://swarnavyapar.in',
    title: 'SwarnaVyapar - Premium Jewellery Management Software',
    description:
      'Transform your jewellery business with SwarnaVyapar. Elegant invoicing, smart inventory tracking, and seamless customer management.',
    siteName: 'SwarnaVyapar',
    images: [
      {
        url: process.env.NEXT_PUBLIC_LOGO_URL || '/logo/logo.png',
        width: 1200,
        height: 630,
        alt: 'SwarnaVyapar Logo',
      },
    ],
  },
  icons: {
    icon: process.env.NEXT_PUBLIC_LOGO_URL || '/logo/logo.png',
    shortcut: process.env.NEXT_PUBLIC_LOGO_URL || '/logo/logo.png',
    apple: process.env.NEXT_PUBLIC_LOGO_URL || '/logo/logo.png',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SwarnaVyapar - Premium Jewellery Management Software',
    description:
      'Transform your jewellery business with SwarnaVyapar. Elegant invoicing, smart inventory tracking, and seamless customer management.',
    creator: '@swarnavyapar',
    images: ['https://swarnavyapar.in/logo/browser.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'Y0oXQR9Ayb5-D7vGVucdwsA7-Y5tYUD_deNB5wVbNe0',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicons and touch icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo/swarnavyapar.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo/swarnavyapar.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo/swarnavyapar.png" />
        <link rel="manifest" href="/manifest.webmanifest" />

        {/* Preload self-hosted fonts (place WOFF2 files under /public/fonts/) */}
        <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/PlayfairDisplay-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/PlayfairDisplay-Italic.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="font-body antialiased bg-mesh min-h-screen" suppressHydrationWarning>
        <SupabaseProvider>
          <QueryProvider>
            <AuthWrapper>
              <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
                {/* Global listeners: analytics + heatmap */}
                <AppListeners />
                {children}
                <InstallPrompt />
                <UpdatePrompt />
                {/* Service worker registration */}
                {/* Service worker registration */}
                <script dangerouslySetInnerHTML={{
                  __html: `
                  if ('serviceWorker' in navigator) {
                    window.addEventListener('load', function() {
                      if ('${process.env.NODE_ENV}' === 'production') {
                        navigator.serviceWorker.register('/sw.js').catch(function(e){console.debug('SW reg failed', e)});
                      } else {
                        // Unregister in dev to prevent caching issues
                        navigator.serviceWorker.getRegistrations().then(function(registrations) {
                          for(let registration of registrations) {
                            registration.unregister();
                            console.debug('SW unregistered in dev');
                          }
                        });
                      }
                    });
                  }
                `}} />
              </ThemeProvider>
            </AuthWrapper>
            <Toaster />
          </QueryProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
