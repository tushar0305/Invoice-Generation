import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { Pricing } from '@/components/landing/pricing';
import { AddOns } from '@/components/pricing/add-ons';
import { WhyChoose } from '@/components/pricing/why-choose';
import { FAQ } from '@/components/pricing/faq';
import { CTA } from '@/components/pricing/cta';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Pricing - SwarnaVyapar | Simple, Transparent Pricing for Jewellers',
    description: 'Choose the perfect plan for your jewellery business. Start with our free trial. No hidden charges. Plans for every stage of growth.',
};

export default function PricingPage() {
    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            {/* Hero Section */}
            <section className="pt-32 pb-16 bg-white text-center">
                <div className="container px-4 mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-50 border border-gold-200 text-gold-700 text-xs font-bold uppercase tracking-wider mb-6">
                        💎 Pricing Plans
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6 font-heading">
                        Simple, Transparent Pricing<br />for Jewellery Shops
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Run your entire jewellery business with powerful tools for billing, stock, customers, gold loans, AI insights, and more.
                        <br className="hidden md:block" /> No hidden charges. No complicated setup.
                    </p>
                </div>
            </section>

            {/* Pricing Cards */}
            <Pricing />

            {/* Add-Ons */}
            <AddOns />

            {/* Why Choose */}
            <WhyChoose />

            {/* FAQ */}
            <FAQ />

            {/* Bottom CTA */}
            <CTA />

            <Footer />
        </main>
    );
}
