import { Navbar } from '@/components/landing/navbar';
import { HeroSection } from '@/components/landing/hero-section';
import { ValueProp } from '@/components/landing/value-prop';
import { AIShowcase } from '@/components/landing/ai-showcase';
import { FeaturesJourney } from '@/components/landing/features-journey';
import { StorySection } from '@/components/landing/story-section';
import { Features } from '@/components/landing/features';
import { Showcase } from '@/components/landing/showcase';
import { WhyUs } from '@/components/landing/why-us';
import { Pricing } from '@/components/landing/pricing';
import { Testimonials } from '@/components/landing/testimonials';
import { Footer } from '@/components/landing/footer';
import { PlatformRedirect } from '@/components/platform-redirect';

export default function LandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SwarnaVyapar',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: 'https://swarnavyapar.in',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    description: 'Premium jewellery management software for modern jewellers.',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '500',
    },
  };

  return (
    <main className="flex min-h-screen flex-col bg-white overflow-x-hidden">
      <PlatformRedirect />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <HeroSection />
      <ValueProp />
      <AIShowcase />
      <FeaturesJourney />
      <StorySection />
      <Features />
      <Showcase />
      <WhyUs />
      <Pricing />
      <Testimonials />
      <Footer />
    </main>
  );
}
