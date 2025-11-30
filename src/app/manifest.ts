import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'SwarnaVyapar',
        short_name: 'SwarnaVyapar',
        description: 'Premium Jewellery Management Software',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
            {
                src: '/logo/browser.webp',
                sizes: '192x192',
                type: 'image/webp',
            },
            {
                src: '/logo/browser.webp',
                sizes: '512x512',
                type: 'image/webp',
            },
        ],
    };
}
