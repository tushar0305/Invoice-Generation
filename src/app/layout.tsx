import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SupabaseProvider } from '@/supabase/provider';
import { ActiveShopProvider } from '@/hooks/use-active-shop';
import { AuthWrapper } from '@/components/auth-wrapper';
import { QueryProvider } from '@/components/query-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { InstallPrompt } from '@/components/install-prompt';

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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SwarnaVyapar - Premium Jewellery Management Software',
    description:
      'Transform your jewellery business with SwarnaVyapar. Elegant invoicing, smart inventory tracking, and seamless customer management.',
    creator: '@swarnavyapar',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-mesh min-h-screen" suppressHydrationWarning>
        <SupabaseProvider>
          <QueryProvider>
            <ActiveShopProvider>
              <AuthWrapper>
                <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
                  {children}
                  <InstallPrompt />
                </ThemeProvider>
              </AuthWrapper>
              <Toaster />
            </ActiveShopProvider>
          </QueryProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
