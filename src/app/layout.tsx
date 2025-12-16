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
    default: 'SwarnaVyapar - AI-Powered Jewellery Management & Billing Software | GST Compliant',
    template: '%s | SwarnaVyapar - Jewellery Management Software',
  },
  description:
    'Leading jewellery management software in India. AI voice invoicing, GST-compliant billing, inventory tracking, customer loyalty & hallmarking. Trusted by 500+ jewellers. Free trial available.',
  keywords: [
    'jewellery software india',
    'jewellery billing software',
    'gold invoice generator',
    'jewellery inventory management',
    'jewellery erp software',
    'hallmarking software',
    'gst billing software for jewellers',
    'jewellery pos system',
    'gold shop management software',
    'jewellery accounting software',
    'ai voice invoicing',
    'jewellery store management',
    'swarnavyapar',
  ],
  authors: [{ name: 'SwarnaVyapar Team' }],
  creator: 'SwarnaVyapar',
  publisher: 'SwarnaVyapar',
  category: 'Business Software',
  classification: 'Jewellery Management Software',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://swarnavyapar.in',
    title: 'SwarnaVyapar - AI-Powered Jewellery Management Software',
    description:
      'Transform your jewellery business with AI voice invoicing, GST-compliant billing, smart inventory tracking, and customer loyalty management. Join 500+ jewellers across India.',
    siteName: 'SwarnaVyapar',
    images: [
      {
        url: 'https://swarnavyapar.in/logo/swarnavyapar_light.png',
        width: 1200,
        height: 630,
        alt: 'SwarnaVyapar - Jewellery Management Software',
        type: 'image/png',
      },
    ],
  },
  icons: {
    icon: [
      { url: '/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon/favicon.ico' },
    ],
    shortcut: '/favicon/favicon.ico',
    apple: [
      { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SwarnaVyapar - AI-Powered Jewellery Management Software',
    description:
      'Leading jewellery management software with AI voice invoicing, GST compliance, inventory tracking & loyalty management. Trusted by 500+ jewellers.',
    creator: '@swarnavyapar',
    images: ['https://swarnavyapar.in/logo/swarnavyapar_light.png'],
    site: '@swarnavyapar',
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
  alternates: {
    canonical: 'https://swarnavyapar.in',
  },
  other: {
    'google-site-verification': 'Y0oXQR9Ayb5-D7vGVucdwsA7-Y5tYUD_deNB5wVbNe0',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SwarnaVyapar',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

import { SmoothScroll } from '@/components/smooth-scroll';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload self-hosted fonts (place WOFF2 files under /public/fonts/) */}
        <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/PlayfairDisplay-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/PlayfairDisplay-Italic.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="font-body antialiased bg-mesh min-h-screen" suppressHydrationWarning>
        {/* <SmoothScroll> */}
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
                {/* Structured Data for Google Rich Results */}
                <script
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                      '@context': 'https://schema.org',
                      '@graph': [
                        {
                          '@type': 'Organization',
                          '@id': 'https://swarnavyapar.in/#organization',
                          name: 'SwarnaVyapar',
                          url: 'https://swarnavyapar.in',
                          logo: {
                            '@type': 'ImageObject',
                            url: 'https://swarnavyapar.in/logo/logo.png',
                            width: 512,
                            height: 512,
                            caption: 'SwarnaVyapar'
                          },
                          image: {
                            '@id': 'https://swarnavyapar.in/#logo',
                            url: 'https://swarnavyapar.in/logo/logo.png'
                          },
                          sameAs: [
                            'https://twitter.com/swarnavyapar',
                            // Add other social profiles here if available
                          ],
                          contactPoint: {
                            '@type': 'ContactPoint',
                            contactType: 'customer support',
                            // telephone: '+91-XXXXXXXXXX', // Add if available
                            email: 'support@swarnavyapar.in'
                          }
                        },
                        {
                          '@type': 'WebSite',
                          '@id': 'https://swarnavyapar.in/#website',
                          url: 'https://swarnavyapar.in',
                          name: 'SwarnaVyapar',
                          publisher: {
                            '@id': 'https://swarnavyapar.in/#organization'
                          },
                          inLanguage: 'en-IN'
                        }
                      ]
                    }),
                  }}
                />
              </ThemeProvider>
            </AuthWrapper>
            <Toaster />
          </QueryProvider>
        </SupabaseProvider>
        {/* </SmoothScroll> */}
      </body>
    </html>
  );
}
