import type { NextConfig } from 'next';

const isMobileExport = process.env.MOBILE_EXPORT === 'true';

const nextConfig: NextConfig = {
  // Static export only when building for mobile (Capacitor)
  // API routes won't work in static export, so keep this off for Vercel
  ...(isMobileExport ? { output: 'export' } : {}),
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
