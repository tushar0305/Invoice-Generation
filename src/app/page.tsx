import { Navbar } from '@/components/landing/navbar';
import { HeroSection } from '@/components/landing/hero-section';

import { AIShowcase } from '@/components/landing/ai-showcase';
import { FeaturesJourney } from '@/components/landing/features-journey';

import { WhyUs } from '@/components/landing/why-us';
import { Pricing } from '@/components/landing/pricing';
import { Testimonials } from '@/components/landing/testimonials';
import { Footer } from '@/components/landing/footer';
import { PlatformRedirect } from '@/components/platform-redirect';
import { LoyaltyProgram } from '@/components/landing/loyalty-program';
import { KhataLoanSection } from '@/components/landing/khata-loan-section';
import { CatalogueSection } from '@/components/landing/catalogue-section';
import { Metadata } from 'next';

// Enhanced metadata for SEO
export const metadata: Metadata = {
    title: 'SwarnaVyapar - #1 AI-Powered Jewellery Management Software in India',
    description: 'India\'s leading jewellery management software with AI voice invoicing, GST-compliant billing, smart inventory tracking, customer loyalty & hallmarking. Trusted by 500+ jewellers. Start free trial today!',
    keywords: [
        'jewellery software india',
        'jewellery billing software',
        'gold invoice generator',
        'jewellery inventory management',
        'jewellery erp software',
        'hallmarking software',
        'gst billing software for jewellers',
        'gold shop management',
        'jewellery pos system',
        'jewellery accounting software',
        'ai voice invoicing',
        'jewellery store management',
        'jewellery shop software',
        'diamond inventory software',
        'gold rate management',
        'swarnavyapar'
    ],
    alternates: {
        canonical: 'https://swarnavyapar.in',
    },
    openGraph: {
        title: 'SwarnaVyapar - #1 AI-Powered Jewellery Management Software',
        description: 'Transform your jewellery business with AI voice invoicing, GST-compliant billing & smart inventory. Join 500+ jewellers across India.',
        url: 'https://swarnavyapar.in',
        siteName: 'SwarnaVyapar',
        images: [
            {
                url: 'https://swarnavyapar.in/logo/swarnavyapar_light.png',
                width: 1200,
                height: 630,
                alt: 'SwarnaVyapar - Jewellery Management Software',
            },
        ],
        locale: 'en_IN',
        type: 'website',
    },
};

export default function LandingPage() {
    // Organization Schema for Logo in Google Search
    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'SwarnaVyapar',
        alternateName: 'Swarna Vyapar',
        url: 'https://swarnavyapar.in',
        logo: 'https://swarnavyapar.in/logo/swarnavyapar_light.png',
        description: 'Leading AI-powered jewellery management software in India for billing, inventory & customer management.',
        foundingDate: '2024',
        address: {
            '@type': 'PostalAddress',
            addressCountry: 'IN',
            addressRegion: 'India',
        },
        contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'Customer Service',
            email: 'hello@swarnavyapar.com',
            availableLanguage: ['English', 'Hindi'],
        },
        sameAs: [
            'https://www.facebook.com/swarnavyapar',
            'https://twitter.com/swarnavyapar',
            'https://www.instagram.com/swarnavyapar',
            'https://www.linkedin.com/company/swarnavyapar',
        ],
    };

    // Enhanced Software Application Schema
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'SwarnaVyapar',
        alternateName: 'SwarnaVyapar Jewellery Software',
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'Jewellery Management Software',
        operatingSystem: 'Web, Android, iOS, Windows, macOS',
        url: 'https://swarnavyapar.in',
        downloadUrl: 'https://swarnavyapar.in/login',
        screenshot: 'https://swarnavyapar.in/screenshots/dashboard.png',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'INR',
            availability: 'https://schema.org/InStock',
            priceValidUntil: '2025-12-31',
            url: 'https://swarnavyapar.in/pricing',
        },
        description: 'AI-powered jewellery management software with voice invoicing, GST-compliant billing, inventory tracking, customer loyalty management, and hallmarking compliance. Trusted by 500+ jewellers across India.',
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            ratingCount: '523',
            bestRating: '5',
            worstRating: '1',
            reviewCount: '523',
        },
        featureList: [
            'AI Voice Invoicing',
            'GST Compliant Billing',
            'Smart Inventory Management',
            'Hallmarking Compliance',
            'Customer Loyalty Program',
            'WhatsApp Integration',
            'Multi-branch Support',
            'Gold Rate Tracking',
            'Diamond Inventory',
            'QR Code Scanning',
            'Offline Mode',
            'Mobile App (Android & iOS)',
        ],
        author: {
            '@type': 'Organization',
            name: 'SwarnaVyapar',
        },
    };

    // WebSite Schema for Sitelinks Search Box
    const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'SwarnaVyapar',
        url: 'https://swarnavyapar.in',
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://swarnavyapar.in/search?q={search_term_string}',
            },
            'query-input': 'required name=search_term_string',
        },
    };

    // BreadcrumbList Schema
    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://swarnavyapar.in',
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Features',
                item: 'https://swarnavyapar.in#features',
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: 'Pricing',
                item: 'https://swarnavyapar.in#pricing',
            },
        ],
    };

    // FAQ Schema for better SEO
    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'What is SwarnaVyapar jewellery software?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'SwarnaVyapar is India\'s leading AI-powered jewellery management software designed for modern jewellers. It offers GST-compliant invoicing, AI voice-based invoice creation, smart inventory tracking, hallmarking compliance, customer loyalty management, and multi-branch support. Trusted by over 500 jewellers across India.',
                },
            },
            {
                '@type': 'Question',
                name: 'Is SwarnaVyapar GST compliant for jewellery billing?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, SwarnaVyapar is 100% GST compliant and generates all invoices according to Indian GST regulations for gold, silver, diamond, and platinum jewellery. It automatically calculates GST, generates GSTR reports, and ensures full compliance.',
                },
            },
            {
                '@type': 'Question',
                name: 'Can I use SwarnaVyapar on mobile devices?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, SwarnaVyapar works seamlessly on desktop, tablet, and mobile devices. We also offer native Android and iOS apps with offline mode for on-the-go jewellery business management.',
                },
            },
            {
                '@type': 'Question',
                name: 'What features does SwarnaVyapar offer for jewellery shops?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'SwarnaVyapar offers AI voice invoicing, GST-compliant billing, inventory management with QR codes, hallmarking compliance, customer loyalty programs, WhatsApp integration, gold rate tracking, and comprehensive business analytics.',
                },
            },
        ],
    };

    return (
        <>
            <main
                id="main-content"
                className="flex min-h-screen flex-col bg-white overflow-x-hidden"
                role="main"
            >
                <PlatformRedirect />

                {/* Structured Data for SEO */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
                />

                <Navbar />
                <HeroSection />

                <AIShowcase />
                <FeaturesJourney />
                <CatalogueSection />
                <KhataLoanSection />
                <LoyaltyProgram />
                <WhyUs />
                <Pricing />
                <Testimonials />
                <Footer />
            </main>
        </>
    );
}
