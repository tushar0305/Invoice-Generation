'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

const testimonials = [
    {
        name: "Rajesh Kumar",
        role: "Owner, Lakshmi Jewellers",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces",
        content: "SwarnaVyapar has completely transformed how we manage our shop. The GST billing is effortless, and the inventory tracking saves us hours every week.",
        rating: 5
    },
    {
        name: "Priya Sharma",
        role: "Manager, Sharma Gold House",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces",
        content: "The AI insights are incredible. It predicted our festive season demand with 90% accuracy, helping us stock up on the right designs.",
        rating: 5
    },
    {
        name: "Amit Patel",
        role: "Director, Patel Diamonds",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces",
        content: "Finally, a software that understands the Indian jewellery market. The Girvi/Loan management feature is a lifesaver for our business.",
        rating: 5
    }
];

export function Testimonials() {
    return (
        <section className="py-24 bg-neutral-50 dark:bg-[#0A0A0A] transition-colors duration-500">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-4"
                    >
                        Trusted by <span className="text-amber-600">Jewellers Across India</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-neutral-500 dark:text-neutral-400 text-lg"
                    >
                        Join hundreds of satisfied shop owners who have modernized their business.
                    </motion.p>
                </div>

                {/* Mobile Carousel */}
                <div className="block md:hidden">
                    <Carousel opts={{ align: "start", loop: true }} className="w-full">
                        <CarouselContent className="-ml-4">
                            {testimonials.map((testimonial, index) => (
                                <CarouselItem key={index} className="pl-4 basis-[90%]">
                                    <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-neutral-200 dark:border-white/5 shadow-sm relative h-full">
                                        <Quote className="absolute top-6 right-6 w-6 h-6 text-amber-500/20" />

                                        <div className="flex gap-1 mb-4">
                                            {[...Array(testimonial.rating)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                                            ))}
                                        </div>

                                        <p className="text-neutral-600 dark:text-neutral-300 mb-6 text-sm leading-relaxed line-clamp-4">
                                            "{testimonial.content}"
                                        </p>

                                        <div className="flex items-center gap-3">
                                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-200 shrink-0">
                                                <Image
                                                    src={testimonial.image}
                                                    alt={testimonial.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-neutral-900 dark:text-white text-sm">
                                                    {testimonial.name}
                                                </h4>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                    {testimonial.role}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </div>

                {/* Desktop Grid */}
                <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-neutral-200 dark:border-white/5 shadow-sm relative"
                        >
                            <Quote className="absolute top-8 right-8 w-8 h-8 text-amber-500/20" />

                            <div className="flex gap-1 mb-6">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-amber-500 text-amber-500" />
                                ))}
                            </div>

                            <p className="text-neutral-600 dark:text-neutral-300 mb-8 leading-relaxed">
                                "{testimonial.content}"
                            </p>

                            <div className="flex items-center gap-4">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-neutral-200">
                                    <Image
                                        src={testimonial.image}
                                        alt={testimonial.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-neutral-900 dark:text-white">
                                        {testimonial.name}
                                    </h4>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                        {testimonial.role}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
