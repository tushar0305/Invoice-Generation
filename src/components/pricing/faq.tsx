'use client';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
    {
        question: "Do I need technical knowledge to use SwarnaVyapar?",
        answer: "No — the app is built for simplicity. Anyone can use it without prior technical experience."
    },
    {
        question: "Can I upgrade or downgrade anytime?",
        answer: "Yes, you can instantly upgrade or downgrade your plan directly from your dashboard."
    },
    {
        question: "Is my data secure?",
        answer: "Absolutely. Your data is encrypted and stored on secure cloud servers with bank-grade security protocols."
    },
    {
        question: "Do you support mobile users?",
        answer: "Yes, SwarnaVyapar is fully mobile-friendly and works seamlessly on any device (Android, iOS, Tablets, Desktop)."
    },
    {
        question: "Can multiple staff members use the app?",
        answer: "Yes. Staff permissions and the number of staff accounts depend on your selected plan."
    },
    {
        question: "Do you offer free onboarding?",
        answer: "Yes — our team helps you migrate your data and set up your account completely free of charge."
    }
];

export function FAQ() {
    return (
        <section className="py-24 bg-slate-50">
            <div className="container px-4 md:px-6 mx-auto max-w-3xl">
                <header className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4 font-heading">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-lg text-slate-600">
                        Have questions? We're here to help.
                    </p>
                </header>

                <Accordion type="single" collapsible className="w-full space-y-4">
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="bg-white border border-slate-200 rounded-lg px-6">
                            <AccordionTrigger className="text-base font-semibold text-slate-900 hover:text-slate-700 hover:no-underline py-6">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-slate-600 pb-6 leading-relaxed">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
