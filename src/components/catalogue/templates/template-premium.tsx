'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    ShoppingBag,
    MessageCircle,
    X,
    Sparkles, // Replaced Gem with Sparkles to fix caching issue
    Stars,
    ChevronRight,
    Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { incrementView } from '@/actions/catalogue-actions';

interface StoreClientProps {
    shop: any;
    initialProducts: any[];
    categories: any[];
}

export function TemplatePremium({ shop, initialProducts, categories }: StoreClientProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [scrolled, setScrolled] = useState(false);

    // Simulated parallax effect
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
            setOffset(window.scrollY * 0.5);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const filteredProducts = useMemo(() => {
        return initialProducts.filter(p => {
            const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [initialProducts, selectedCategory, searchTerm]);

    const handleProductClick = (product: any) => {
        setSelectedProduct(product);
        incrementView(shop.shop_id, 'product_view', { product_id: product.id });
    };

    const handleWhatsAppInquiry = (product?: any) => {
        if (!shop.contact_phone) return;
        let text = `Greetings ${shop.shop_display_name}, I am admiring your collection.`;
        if (product) {
            text = `Greetings, I wish to inquire about the *${product.name}* (Price: ₹${product.price}). Kindly provide more details.`;
        }
        const url = `https://wa.me/${shop.contact_phone.replace(/\+/g, '')}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
        incrementView(shop.shop_id, 'whatsapp_click', { product_id: product?.id });
    };

    return (
        <div className="min-h-screen bg-[#050505] text-[#E5D5C0] font-serif selection:bg-[#C6A87C] selection:text-black overflow-x-hidden">

            {/* 1. Luxurious Header */}
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${scrolled ? 'bg-black/90 backdrop-blur-md border-b border-[#C6A87C]/20 py-4' : 'bg-transparent py-8'}`}
            >
                <div className="max-w-[1600px] mx-auto px-8 flex items-center justify-between">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col"
                    >
                        <span className="text-[10px] tracking-[0.4em] text-[#C6A87C] uppercase mb-1 hidden md:block">Fine Jewellery</span>
                        <h1 className="text-2xl md:text-3xl font-light italic tracking-wider text-white">
                            {shop.shop_display_name}
                        </h1>
                    </motion.div>

                    <div className="flex items-center gap-8">
                        {/* Desktop Nav */}
                        <nav className="hidden md:flex gap-6 text-sm tracking-[0.2em] uppercase text-[#888]">
                            <button onClick={() => setSelectedCategory('all')} className={`hover:text-[#C6A87C] transition-colors ${selectedCategory === 'all' ? 'text-white border-b border-[#C6A87C]' : ''}`}>Collection</button>
                            <button className="hover:text-[#C6A87C] transition-colors">About</button>
                            <button className="hover:text-[#C6A87C] transition-colors">Contact</button>
                        </nav>

                        {/* Search */}
                        <div className="relative group">
                            <Search className="absolute right-0 top-2 h-4 w-4 text-[#888] group-focus-within:text-[#C6A87C] transition-colors cursor-pointer" />
                            <input
                                className="bg-transparent text-right pr-6 h-8 text-[#E5D5C0] placeholder:text-[#444] outline-none w-24 focus:w-48 text-sm border-b border-transparent focus:border-[#C6A87C] transition-all duration-500 font-sans tracking-wide"
                                placeholder="SEARCH"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* 2. Parallax Hero Section (Only visible on 'all' and top) */}
            {selectedCategory === 'all' && !searchTerm && (
                <div className="relative h-[60vh] md:h-[80vh] overflow-hidden flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1515562141207-7a88fb0537bf?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 grayscale"
                        style={{ transform: `translateY(${offset * 0.5}px)` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#050505_100%)] opacity-80" />

                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="relative z-10 text-center px-6 max-w-4xl"
                    >
                        <p className="text-[#C6A87C] tracking-[0.5em] text-xs md:text-sm uppercase mb-6 flex items-center justify-center gap-4">
                            <span className="w-12 h-[1px] bg-[#C6A87C]"></span>
                            Exquisite Craftsmanship
                            <span className="w-12 h-[1px] bg-[#C6A87C]"></span>
                        </p>
                        <h2 className="text-5xl md:text-7xl lg:text-8xl font-thin text-white mb-8 leading-none tracking-tight">
                            Timeless <span className="italic font-normal text-[#C6A87C] font-serif">Elegance</span>
                        </h2>
                        {shop.about_text && (
                            <p className="text-[#888] font-sans font-light tracking-wide max-w-lg mx-auto leading-relaxed">
                                {shop.about_text}
                            </p>
                        )}
                    </motion.div>
                </div>
            )}

            {/* 3. Categories & Grid */}
            <main className="max-w-[1600px] mx-auto px-6 py-20 relative z-10 transition-all duration-500">

                {/* Elegant Category Filter */}
                <div className="flex flex-wrap justify-center gap-8 mb-24">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`text-lg md:text-xl italic font-light transition-all duration-500 ${selectedCategory === 'all' ? 'text-[#C6A87C] border-b border-[#C6A87C]' : 'text-[#444] hover:text-[#AA987C]'}`}
                    >
                        View All
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`text-lg md:text-xl italic font-light transition-all duration-500 ${selectedCategory === cat.id ? 'text-[#C6A87C] border-b border-[#C6A87C]' : 'text-[#444] hover:text-[#AA987C]'}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="text-center py-32">
                        <Sparkles className="h-12 w-12 mx-auto mb-6 text-[#222]" />
                        <p className="text-xl font-light text-[#444] italic">This collection is currently reserved.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 md:gap-16">
                        {filteredProducts.map((product, index) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                                viewport={{ once: true, margin: "-100px" }}
                                onClick={() => handleProductClick(product)}
                                className="group cursor-pointer"
                            >
                                <div className="aspect-[4/5] bg-[#0A0A0A] relative border border-[#1A1A1A] group-hover:border-[#C6A87C]/40 transition-all duration-700 shadow-2xl shadow-black">
                                    {/* 3D Depth Decoration */}
                                    {/* <div className="absolute -inset-0.5 bg-gradient-to-r from-[#C6A87C] to-[#8A7456] opacity-0 group-hover:opacity-20 blur transition-opacity duration-1000" /> */}

                                    <div className="relative h-full w-full overflow-hidden bg-[#0F0F0F]">
                                        {product.images && product.images[0] ? (
                                            <img
                                                src={product.images[0]}
                                                alt={product.name}
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-110 saturate-[0.8] group-hover:saturate-100"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[#222]">
                                                <Sparkles className="h-12 w-12" />
                                            </div>
                                        )}

                                        {/* Luxury Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-700" />

                                        {/* Floating Action */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 backdrop-blur-[2px]">
                                            <div className="border border-white/30 rounded-full p-4 hover:bg-[#C6A87C] hover:text-black hover:border-[#C6A87C] transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                                                <span className="sr-only">View</span>
                                                <Stars className="h-5 w-5" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 text-center space-y-3 px-4">
                                    <h3 className="text-xl font-light text-[#E5D5C0] group-hover:text-[#C6A87C] transition-colors duration-500 font-serif leading-tight">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="w-8 h-[1px] bg-[#222] group-hover:bg-[#C6A87C]/50 transition-colors duration-500"></span>
                                        <p className="text-[#888] font-sans font-light text-sm tracking-widest uppercase group-hover:text-white transition-colors duration-500">
                                            INR {product.price.toLocaleString('en-IN')}
                                        </p>
                                        <span className="w-8 h-[1px] bg-[#222] group-hover:bg-[#C6A87C]/50 transition-colors duration-500"></span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* 4. Footer */}
            <footer className="border-t border-[#111] py-20 text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-20 bg-gradient-to-b from-[#C6A87C]/50 to-transparent"></div>
                <div className="relative z-10 px-6">
                    <h2 className="text-3xl font-light italic mb-8">{shop.shop_display_name}</h2>
                    <div className="flex justify-center gap-8 mb-12 text-sm tracking-[0.2em] text-[#666] uppercase">
                        <a href="#" className="hover:text-[#C6A87C] transition-colors">Instagram</a>
                        <a href="#" className="hover:text-[#C6A87C] transition-colors">Facebook</a>
                        <a href="#" className="hover:text-[#C6A87C] transition-colors">Contact</a>
                    </div>
                    <p className="text-[#333] text-xs tracking-widest">© 2024. All Rights Reserved.</p>
                </div>
            </footer>

            {/* 5. Luxury Product Detail */}
            <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
                <DialogContent className="max-w-[100vw] w-full h-full p-0 overflow-y-auto border-none bg-[#050505] text-[#E5D5C0] rounded-none z-[60]">
                    <DialogHeader className="sr-only">
                        <DialogTitle>{selectedProduct?.name}</DialogTitle>
                    </DialogHeader>

                    {selectedProduct && (
                        <div className="min-h-screen flex flex-col items-center">

                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="fixed top-8 right-8 z-50 text-white/50 hover:text-[#C6A87C] transition-colors mix-blend-difference"
                            >
                                <span className="text-sm tracking-widest uppercase mr-2 hidden md:inline">Close</span>
                                <X className="h-6 w-6 inline" />
                            </button>

                            {/* Full Screen Hero with Gradient Overlay */}
                            <div className="w-full h-[70vh] md:h-[85vh] relative bg-[#0a0a0a]">
                                {selectedProduct.images && selectedProduct.images[0] ? (
                                    <div className="relative w-full h-full">
                                        <img
                                            src={selectedProduct.images[0]}
                                            className="w-full h-full object-cover opacity-80"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/30 via-transparent to-[#050505]" />
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[#222]">
                                        <Sparkles className="h-32 w-32 opacity-20" />
                                    </div>
                                )}

                                {/* Floating Title in Hero */}
                                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-20 text-center">
                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 1, delay: 0.2 }}
                                    >
                                        <p className="text-[#C6A87C] tracking-[0.3em] text-xs md:text-sm uppercase mb-4">Masterpiece Collection</p>
                                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-light italic text-white mb-6">
                                            {selectedProduct.name}
                                        </h1>
                                        <p className="text-2xl md:text-3xl font-light text-[#E5d5c0]">
                                            INR {selectedProduct.price.toLocaleString('en-IN')}
                                        </p>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Info Section */}
                            <div className="max-w-4xl max-auto px-6 py-20 md:py-32 w-full space-y-20">

                                {/* Description */}
                                <div className="text-center max-w-2xl mx-auto">
                                    <Stars className="h-6 w-6 text-[#C6A87C] mx-auto mb-8 opacity-50" />
                                    <p className="text-lg md:text-2xl font-light leading-relaxed text-[#bbb]">
                                        {selectedProduct.description || "A timeless piece designed to capture elegance and grace. Meticulously providing a sophisticated addition to any collection."}
                                    </p>
                                </div>

                                {/* Specs Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 border-y border-[#222] py-12">
                                    <div className="text-center p-4">
                                        <span className="block text-[#444] text-[10px] tracking-[0.2em] uppercase mb-2">Purity</span>
                                        <span className="text-xl md:text-2xl font-serif text-[#C6A87C]">{selectedProduct.purity || "22K"}</span>
                                    </div>
                                    <div className="text-center p-4">
                                        <span className="block text-[#444] text-[10px] tracking-[0.2em] uppercase mb-2">Weight</span>
                                        <span className="text-xl md:text-2xl font-serif text-[#C6A87C]">{selectedProduct.weight_g || "0"}g</span>
                                    </div>
                                    <div className="text-center p-4">
                                        <span className="block text-[#444] text-[10px] tracking-[0.2em] uppercase mb-2">Availability</span>
                                        <span className="text-xl md:text-2xl font-serif text-[#C6A87C]">In Stock</span>
                                    </div>
                                    <div className="text-center p-4">
                                        <span className="block text-[#444] text-[10px] tracking-[0.2em] uppercase mb-2">Certified</span>
                                        <span className="text-xl md:text-2xl font-serif text-[#C6A87C]">Yes</span>
                                    </div>
                                </div>

                                {/* CTA */}
                                <div className="text-center space-y-6">
                                    <p className="text-[#666] italic font-serif">Interested in this masterpiece?</p>
                                    <Button
                                        className="h-16 px-12 bg-[#C6A87C] text-black hover:bg-white hover:text-black rounded-none text-sm tracking-[0.2em] uppercase font-bold transition-all duration-500"
                                        onClick={() => handleWhatsAppInquiry(selectedProduct)}
                                    >
                                        Acquire / Inquire
                                    </Button>
                                </div>

                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
