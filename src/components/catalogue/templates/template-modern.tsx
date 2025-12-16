'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    ShoppingBag,
    MessageCircle,
    MapPin,
    ZoomIn,
    X,
    Sparkles,
    Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

export function TemplateModern({ shop, initialProducts, categories }: StoreClientProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
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
        let text = `Hi ${shop.shop_display_name}, I saw your catalogue.`;
        if (product) {
            text = `Hi, I am interested in *${product.name}* (Price: ₹${product.price}).`;
        }
        const url = `https://wa.me/${shop.contact_phone.replace(/\+/g, '')}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
        incrementView(shop.shop_id, 'whatsapp_click', { product_id: product?.id });
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">

            {/* 1. Modern Header & Navigation */}
            <header
                className={`sticky top-0 z-40 transition-all duration-500 ease-in-out ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm py-3' : 'bg-transparent py-6'}`}
            >
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1 min-w-0"
                    >
                        <h1 className={`font-bold text-slate-900 tracking-tight truncate transition-all duration-300 ${scrolled ? 'text-xl' : 'text-3xl'}`}>
                            {shop.shop_display_name}
                        </h1>
                        {!scrolled && shop.contact_address && (
                            <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                                <MapPin className="h-3.5 w-3.5" />
                                <p className="text-sm truncate max-w-md">{shop.contact_address}</p>
                            </div>
                        )}
                    </motion.div>

                    <div className={`relative transition-all duration-500 ${scrolled ? 'w-full max-w-xs' : 'w-12 hover:w-64'}`}>
                        <div className="relative group">
                            <Input
                                className={`rounded-full bg-slate-100 border-transparent focus:bg-white focus:border-indigo-200 pl-10 h-10 transition-all duration-300 w-full`}
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                    </div>
                </div>

                {/* Category Pills - Enhanced Design */}
                <div className={`max-w-7xl mx-auto px-6 mt-6 overflow-x-auto scrollbar-hide pb-3 transition-all duration-500 ${scrolled ? 'opacity-0 h-0 mt-0 pointer-events-none' : 'opacity-100 h-auto'}`}>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-8 py-3 rounded-3xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${selectedCategory === 'all' ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/30 scale-[1.05]' : 'bg-white/90 backdrop-blur-sm text-slate-700 shadow-md hover:bg-white hover:shadow-xl hover:scale-[1.02]'}`}
                        >
                            ✨ All Collection
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-8 py-3 rounded-3xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${selectedCategory === cat.id ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/30 scale-[1.05]' : 'bg-white/90 backdrop-blur-sm text-slate-700 shadow-md hover:bg-white hover:shadow-xl hover:scale-[1.02]'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* 2. Main Grid */}
            <main className="max-w-7xl mx-auto px-6 py-8 pb-32">
                {shop.about_text && !scrolled && selectedCategory === 'all' && !searchTerm && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-16 max-w-2xl p-8 rounded-3xl bg-white/80 backdrop-blur-sm shadow-lg border border-slate-100"
                    >
                        <div className="flex items-start gap-3 mb-4">
                            <Sparkles className="h-6 w-6 text-indigo-500 flex-shrink-0 mt-1" />
                            <h3 className="text-xl font-bold text-slate-900">Our Story</h3>
                        </div>
                        <p className="text-base text-slate-600 leading-relaxed pl-9">
                            {shop.about_text}
                        </p>
                    </motion.div>
                )}

                {filteredProducts.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 text-slate-400">
                        <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-50 stroke-1" />
                        <p className="text-xl font-medium text-slate-500">No items found</p>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
                    >
                        {filteredProducts.map((product) => (
                            <motion.div
                                key={product.id}
                                variants={{
                                    hidden: { opacity: 0, y: 30 },
                                    show: { opacity: 1, y: 0 }
                                }}
                                whileHover={{ y: -12 }}
                                onClick={() => handleProductClick(product)}
                                className="bg-white rounded-3xl p-4 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500 cursor-pointer group flex flex-col h-full"
                            >
                                <div className="aspect-[3/4] bg-slate-50 rounded-[1.5rem] overflow-hidden relative mb-4">
                                    {product.images && product.images[0] ? (
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <ShoppingBag className="h-10 w-10" />
                                        </div>
                                    )}

                                    {/* Hover Action */}
                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="bg-white/90 backdrop-blur-md rounded-full p-3 text-slate-900 shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-300 spring-bounce">
                                            <ZoomIn className="h-6 w-6" />
                                        </div>
                                    </div>

                                    {/* Price Tag - Floating */}
                                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                                        ₹{product.price.toLocaleString('en-IN')}
                                    </div>
                                </div>

                                <div className="px-3 pb-3 space-y-2">
                                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 min-h-[3rem] group-hover:text-indigo-600 transition-colors">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                                            {product.purity && <span className="bg-slate-50 px-2 py-1 rounded-full">{product.purity}</span>}
                                            {product.weight_g && <span className="bg-slate-50 px-2 py-1 rounded-full">{product.weight_g}g</span>}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </main>

            {/* 3. Modern Footer */}
            <footer className="py-12 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h2 className="font-bold text-lg mb-6">{shop.shop_display_name}</h2>
                    {shop.contact_phone && (
                        <Button
                            variant="outline"
                            className="rounded-full h-12 px-8 border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50"
                            onClick={() => handleWhatsAppInquiry()}
                        >
                            <MessageCircle className="mr-2 h-4 w-4" /> Contact Support
                        </Button>
                    )}
                    <p className="mt-8 text-xs text-slate-400 uppercase tracking-widest">© 2024 SwarnaVyapar</p>
                </div>
            </footer>

            {/* 4. Product Detail (Modern / Scroll Reveal) */}
            <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
                <DialogContent className="max-w-5xl p-0 overflow-hidden border-none bg-white shadow-2xl rounded-none sm:rounded-[2rem] w-[95vw] h-[90vh] sm:h-[85vh] flex flex-col md:flex-row">
                    <DialogHeader className="sr-only">
                        <DialogTitle>{selectedProduct?.name}</DialogTitle>
                    </DialogHeader>

                    {selectedProduct && (
                        <>
                            {/* Image Section */}
                            <div className="w-full md:w-[45%] lg:w-1/2 bg-slate-100 relative h-1/2 md:h-full">
                                {selectedProduct.images && selectedProduct.images[0] ? (
                                    <img
                                        src={selectedProduct.images[0]}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <ShoppingBag className="h-20 w-20" />
                                    </div>
                                )}
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="absolute top-4 left-4 z-10 bg-white/20 backdrop-blur-md hover:bg-white/40 p-2 rounded-full text-slate-900 transition-colors md:hidden"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Details Section */}
                            <div className="w-full md:w-[55%] lg:w-1/2 flex flex-col h-1/2 md:h-full bg-white">
                                <div className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12 relative">
                                    <button
                                        onClick={() => setSelectedProduct(null)}
                                        className="absolute top-6 right-6 z-10 p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors hidden md:block"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="space-y-6"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none rounded-lg px-2.5 py-0.5 font-semibold">
                                                    NEW ARRIVAL
                                                </Badge>
                                                {selectedProduct.category_id && (
                                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                                        {categories.find(c => c.id === selectedProduct.category_id)?.name}
                                                    </span>
                                                )}
                                            </div>
                                            <h2 className="text-2xl md:text-4xl font-bold text-slate-900 leading-tight">
                                                {selectedProduct.name}
                                            </h2>
                                            <p className="text-3xl font-black text-slate-900 mt-4 tracking-tight">
                                                ₹{selectedProduct.price.toLocaleString('en-IN')}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Purity</p>
                                                <p className="text-lg font-semibold text-slate-900">{selectedProduct.purity || "N/A"}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Weight</p>
                                                <p className="text-lg font-semibold text-slate-900">{selectedProduct.weight_g ? `${selectedProduct.weight_g}g` : 'N/A'}</p>
                                            </div>
                                        </div>

                                        {selectedProduct.description && (
                                            <div className="prose prose-slate prose-sm text-slate-600 leading-relaxed">
                                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Description</h4>
                                                {selectedProduct.description}
                                            </div>
                                        )}
                                    </motion.div>
                                </div>

                                {/* Sticky Bottom Bar */}
                                <div className="p-6 border-t border-slate-100 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] z-20">
                                    <Button
                                        className="w-full h-14 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white shadow-lg shadow-slate-900/20 hover:shadow-indigo-600/30 text-lg font-semibold tracking-wide flex items-center justify-center gap-2 transition-all duration-300"
                                        onClick={() => handleWhatsAppInquiry(selectedProduct)}
                                    >
                                        <MessageCircle className="h-5 w-5" />
                                        Inquire via WhatsApp
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
