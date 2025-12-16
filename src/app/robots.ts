import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/dashboard/', '/shop/', '/admin/', '/api/'],
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: ['/dashboard/', '/shop/', '/admin/', '/api/'],
                crawlDelay: 0,
            },
        ],
        sitemap: 'https://swarnavyapar.in/sitemap.xml',
        host: 'https://swarnavyapar.in',
    };
}
