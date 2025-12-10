'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Share2, Search, ShoppingBag, Heart, Sparkles, Battery, Wifi, Signal } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';

const products = [
    { name: 'Kundan Royal Necklace', weight: '45.2g', karat: '22k', price: '₹2,85,000', image: '/products/kundan_necklace.png' },
    { name: 'Temple Earrings', weight: '12.5g', karat: '22k', price: '₹76,000', image: '/products/temple_earrings.png' },
    { name: 'Antique Nakshi Bangle', weight: '28.0g', karat: '22k', price: '₹1,78,000', image: '/products/antique_bangle.png' },
    { name: 'Solitaire Pendant', weight: '8.1g', karat: '18k', price: '₹1,25,000', image: '/products/diamond_pendant.png' },
];

export function CatalogueSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [80, -80]);
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        // No interval needed for static mockup feel, but good for realism
    }, []);

    return (
        <section ref={containerRef} className="py-32 relative overflow-hidden bg-black text-white selection:bg-gold-500/30">
            {/* Cinematic Background */}
            <div className="absolute inset-0 bg-[#050505]">
                <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-purple-900/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-gold-600/10 rounded-full blur-[120px] animate-pulse delay-1000" />
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />
            </div>

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

                    {/* Left: Content */}
                    <div className="flex-1 text-center lg:text-left space-y-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-gold-400 text-xs font-medium uppercase tracking-widest mx-auto lg:mx-0"
                        >
                            <Sparkles className="w-3 h-3" />
                            <span>Digital Storefront</span>
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl font-bold font-heading tracking-tight leading-[1.1]"
                        >
                            Your Shop.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500">
                                Online & Elegant.
                            </span>
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed"
                        >
                            Transform your inventory into a breathtaking digital catalogue.
                            Share live collections on WhatsApp with a single tap.
                            Give your customers a premium browsing experience they'll love.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-wrap justify-center lg:justify-start gap-3"
                        >
                            {['WhatsApp Sharing', 'Smart Filters', 'Privacy Controls', 'Live Rates'].map((label, i) => (
                                <span key={i} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300">
                                    {label}
                                </span>
                            ))}
                        </motion.div>
                    </div>

                    {/* Right: iPhone 17 Pro Max Mockup */}
                    <div className="flex-1 w-full flex items-center justify-center perspective-1000">
                        <motion.div
                            style={{ y, rotateY: -3, rotateX: 3 }}
                            whileHover={{ rotateY: 0, rotateX: 0 }}
                            transition={{ type: "spring", stiffness: 100, damping: 30 }}
                            className="relative w-[340px] h-[700px] bg-slate-900 border-[6px] border-[#3a3a3a] rounded-[3.5rem] shadow-2xl shadow-purple-900/30 overflow-hidden group"
                        >
                            {/* Titanium Frame Overlay */}
                            <div className="absolute inset-0 rounded-[3.1rem] border border-white/10 pointer-events-none z-50"></div>

                            {/* Screen Bezel */}
                            <div className="absolute inset-1 bg-black rounded-[3.2rem] overflow-hidden">

                                {/* Dynamic Island */}
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-[28px] bg-black rounded-full z-50 flex items-center justify-between px-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center">
                                        {/* FaceID sensors hidden */}
                                    </div>
                                </div>

                                {/* Status Bar */}
                                <div className="absolute top-3 left-6 right-6 flex justify-between items-center z-40 text-white text-[12px] font-medium">
                                    <span>{currentTime || '9:41'}</span>
                                    <div className="flex items-center gap-1.5">
                                        <Signal className="w-3.5 h-3.5 fill-current" />
                                        <Wifi className="w-3.5 h-3.5" />
                                        <Battery className="w-4 h-4" />
                                    </div>
                                </div>

                                {/* App Content */}
                                <div className="h-full w-full bg-[#0f0f11] overflow-hidden flex flex-col relative">

                                    {/* Header */}
                                    <div className="mt-12 px-5 pb-4 flex justify-between items-center">
                                        <Share2 className="w-5 h-5 text-gold-400" />
                                        <div className="text-sm font-bold tracking-widest text-white/90">LUXE JEWELS</div>
                                        <Search className="w-5 h-5 text-white/50" />
                                    </div>

                                    {/* Category Pills */}
                                    <div className="flex gap-3 px-5 py-2 overflow-x-auto no-scrollbar mask-gradient">
                                        {['All', 'Necklaces', 'Earrings', 'Bangles'].map((cat, i) => (
                                            <div key={i} className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap ${i === 0 ? 'bg-gold-500 text-black' : 'bg-white/10 text-white/70'}`}>
                                                {cat}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Product Grid */}
                                    <div className="flex-1 px-4 py-4 grid grid-cols-2 gap-3 overflow-y-auto no-scrollbar pb-20">
                                        {products.map((product, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: 0.1 * i }}
                                                className="relative bg-[#1a1a1e] rounded-2xl overflow-hidden group/card"
                                            >
                                                {/* Product Image */}
                                                <div className="aspect-[4/5] relative">
                                                    <Image
                                                        src={product.image}
                                                        alt={product.name}
                                                        fill
                                                        className="object-cover transition-transform duration-700 group-hover/card:scale-110"
                                                    />
                                                    {/* Gradient Overlay for text readability if needed */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />

                                                    <button className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                                                        <Heart className="w-4 h-4 text-white" />
                                                    </button>
                                                </div>

                                                {/* Product Info */}
                                                <div className="p-3">
                                                    <p className="text-xs font-semibold text-white truncate">{product.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70">{product.karat}</span>
                                                        <span className="text-[10px] text-slate-500">{product.weight}</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-gold-400 mt-1.5">{product.price}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Floating Cart Button */}
                                    <div className="absolute bottom-6 right-6 z-20">
                                        <div className="w-14 h-14 bg-gold-500 rounded-full flex items-center justify-center shadow-lg shadow-gold-500/40 relative">
                                            <ShoppingBag className="w-6 h-6 text-black" />
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-[#0f0f11] text-[10px] font-bold text-white">2</div>
                                        </div>
                                    </div>

                                    {/* Navigation Bar */}
                                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#1a1a1e]/80 backdrop-blur-xl border-t border-white/5 flex justify-around items-center px-2">
                                        {[1, 2, 3, 4].map((_, i) => (
                                            <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center ${i === 0 ? 'text-gold-400' : 'text-white/30'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-gold-400' : 'bg-white/30'}`} />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Home Indicator */}
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full z-50"></div>

                                </div>
                            </div>
                        </motion.div>

                        {/* Decorative Elements */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-gold-400 to-orange-500 rounded-full blur-2xl opacity-20 animate-float" />
                        <div className="absolute bottom-20 -left-10 w-40 h-40 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-3xl opacity-20 animate-float delay-1000" />
                    </div>

                </div>
            </div>
        </section>
    );
}
