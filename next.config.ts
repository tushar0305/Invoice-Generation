import type { NextConfig } from 'next';

const isMobileExport = process.env.MOBILE_EXPORT === 'true';

const nextConfig: NextConfig = {

  // Static export only when building for mobile (Capacitor)
  // API routes won't work in static export, so keep this off for Vercel
  ...(isMobileExport ? { output: 'export' } : {}),
  
  // Image optimization - enable for web, disable for mobile export
  images: {
    unoptimized: isMobileExport, // Only disable optimization for mobile builds
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
      {
        // Supabase storage for user uploads
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/**',
      },
    ],
    // Optimize image formats
    formats: ['image/avif', 'image/webp'],
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  
  // Experimental features for performance
  experimental: {
    // Optimized package imports
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@radix-ui/react-icons',
      'framer-motion',
    ],
  },
  
  // Custom headers for caching static assets
  async headers() {
    return [
      {
        // Cache static assets for 1 year
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache JS/CSS with revalidation
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // API routes - no cache by default
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

// Bundle analyzer - enable with ANALYZE=true npm run build
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);
