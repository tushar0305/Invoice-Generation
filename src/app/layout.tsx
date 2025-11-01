import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { AuthWrapper } from '@/components/auth-wrapper';

export const metadata: Metadata = {
  title: 'Saambh Invoice Pro',
  description:
    'An elegant invoice generation app for Saambh Jewellers to create, manage, and print detailed customer invoices.',
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
          href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <FirebaseClientProvider>
            <AuthWrapper>
                {children}
            </AuthWrapper>
            <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
