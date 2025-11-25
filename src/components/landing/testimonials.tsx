'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const testimonials = [
    {
        quote: "SwarnaVyapar transformed how we manage our stock. The gold rate sync feature alone saves us hours every day.",
        author: "Rajesh Mehta",
        role: "Owner, Mehta Jewellers",
        location: "Mumbai"
    },
    {
        quote: "Finally, software that understands the Indian jewellery business. The GST reports are a lifesaver.",
        author: "Suresh Soni",
        role: "Director, Soni Gold House",
        location: "Jaipur"
    },
    {
        quote: "The interface is so beautiful and easy to use. My staff learned it in just one day. Highly recommended!",
        author: "Priya Khandelwal",
        role: "Manager, Khandelwal Gems",
        location: "Delhi"
    }
];

export function Testimonials() {
    return (
        <section id="testimonials" className="py-24 relative bg-slate-50">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-slate-900 font-heading">
                        Loved by Jewellers Across India
                    </h2>
                    <div className="w-24 h-1 bg-gold-500 mx-auto rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="relative p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-all group"
                        >
                            <Quote className="absolute top-6 right-6 h-8 w-8 text-gold-100 group-hover:text-gold-200 transition-colors" />

                            <p className="text-lg text-slate-600 mb-8 relative z-10 italic">
                                "{testimonial.quote}"
                            </p>

                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-gold-100">
                                    <AvatarFallback className="bg-gold-50 text-gold-600 font-bold">
                                        {testimonial.author[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-semibold text-slate-900">{testimonial.author}</div>
                                    <div className="text-xs text-slate-500">{testimonial.role}</div>
                                    <div className="text-xs text-gold-600/80">{testimonial.location}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
