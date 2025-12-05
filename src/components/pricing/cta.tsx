'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function CTA() {
    return (
        <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
            <div className="container px-4 md:px-6 mx-auto text-center">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6 font-heading">
                    Start Managing Your Jewellery<br />Business Like a Pro
                </h2>
                <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
                    Take control of your billing, stock, customers, loans & analytics — all in one powerful app.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/login">
                        <Button size="lg" className="h-12 px-8 text-base bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/10 w-full sm:w-auto">
                            Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                    <Button size="lg" variant="outline" className="h-12 px-8 text-base w-full sm:w-auto">
                        Book a Demo
                    </Button>
                </div>
            </div>
        </section>
    );
}
