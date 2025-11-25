import { Navbar } from '@/components/landing/navbar';
import { HeroSection } from '@/components/landing/hero-section';
import { ValueProp } from '@/components/landing/value-prop';
import { AIShowcase } from '@/components/landing/ai-showcase';
import { StorySection } from '@/components/landing/story-section';
import { Features } from '@/components/landing/features';
import { Showcase } from '@/components/landing/showcase';
import { WhyUs } from '@/components/landing/why-us';
import { Pricing } from '@/components/landing/pricing';
import { Testimonials } from '@/components/landing/testimonials';
import { Footer } from '@/components/landing/footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 selection:bg-gold-200">
      <Navbar />
      <HeroSection />
      <ValueProp />
      <AIShowcase />
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
