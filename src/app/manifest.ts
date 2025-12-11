import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'SwarnaVyapar',
        short_name: 'SwarnaVyapar',
        description: 'Premium Jewellery Management Software',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#D4AF37',
        categories: ['business', 'finance', 'productivity'],
        icons: [
            {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any maskable' as any
            },
            {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable' as any
            },
        ],
        screenshots: [
            {
                src: '/screenshots/mobile-home.png',
                sizes: '1170x2532',
                type: 'image/png',
                label: 'Dashboard Home'
            },
            {
                src: '/screenshots/mobile-invoice.png',
                sizes: '1170x2532',
                type: 'image/png',
                label: 'Invoice Creation'
            }
        ],
        shortcuts: [
            {
                name: "Create Invoice",
                short_name: "Invoice",
                description: "Create a new invoice",
                url: "/shop/active/invoices/new",
                icons: [{ src: "/icons/shortcut-invoice.png", sizes: "96x96" }]
            },
            {
                name: "View Insights",
                short_name: "Insights",
                description: "View business analytics",
                url: "/shop/active/insights",
                icons: [{ src: "/icons/shortcut-insights.png", sizes: "96x96" }]
            },
            {
                name: "Add Stock",
                short_name: "Stock",
                description: "Add new inventory items",
                url: "/shop/active/stock/new",
                icons: [{ src: "/icons/shortcut-stock.png", sizes: "96x96" }]
            }
        ],
        prefer_related_applications: false,
    };
}
