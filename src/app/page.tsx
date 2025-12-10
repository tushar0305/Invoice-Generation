import { Navbar } from '@/components/landing/navbar';
import { HeroSection } from '@/components/landing/hero-section';
import { ValueProp } from '@/components/landing/value-prop';
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
    title: 'SwarnaVyapar - Premium Jewellery Management Software for Modern Jewellers',
    description: 'India\'s #1 AI-powered jewellery management suite. Create GST-compliant invoices, track gold inventory, manage customers, and grow your jewellery business with voice invoicing and smart analytics.',
    keywords: [
        'jewellery software india',
        'jewellery billing software',
        'gold invoice generator',
        'jewellery inventory management',
        'hallmarking software',
        'gst billing software for jewellers',
        'gold shop management',
        'jewellery erp software',
        'jewellery pos system',
        'ai voice invoicing',
        'swarnavyapar'
    ],
    alternates: {
        canonical: 'https://swarnavyapar.in',
    },
};

export default function LandingPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'SwarnaVyapar',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web, Android, iOS',
        url: 'https://swarnavyapar.in',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'INR',
            priceValidUntil: '2025-12-31',
        },
        description: 'Premium jewellery management software for modern jewellers with AI voice invoicing, GST compliance, and smart inventory tracking.',
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '500',
            bestRating: '5',
            worstRating: '1',
        },
        featureList: [
            'GST Compliant Invoicing',
            'AI Voice Invoicing',
            'Smart Inventory Management',
            'Customer Loyalty Program',
            'WhatsApp Integration',
            'Multi-branch Support',
        ],
    };

    // FAQ Schema for better SEO
    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'What is SwarnaVyapar?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'SwarnaVyapar is India\'s premium AI-powered jewellery management software designed for modern jewellers. It offers GST-compliant invoicing, voice-based invoice creation, smart inventory tracking, and customer loyalty management.',
                },
            },
            {
                '@type': 'Question',
                name: 'Is SwarnaVyapar GST compliant?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, SwarnaVyapar is fully GST compliant and generates all invoices according to Indian GST regulations for gold, silver, and diamond jewellery.',
                },
            },
            {
                '@type': 'Question',
                name: 'Can I use SwarnaVyapar on mobile?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, SwarnaVyapar works seamlessly on desktop, tablet, and mobile devices. We also offer native Android and iOS apps for on-the-go management.',
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
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
                />

                <Navbar />
                <HeroSection />
                <ValueProp />
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
