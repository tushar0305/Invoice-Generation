'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Phone,
    MapPin,
    Search,
    ShoppingBag,
    X,
    MessageCircle,
    Share2,
    Clock,
    Filter,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { incrementView } from '@/actions/catalogue-actions';

interface StoreClientProps {
    shop: any;
    initialProducts: any[];
    categories: any[];
}

export function StoreClient({ shop, initialProducts, categories }: StoreClientProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [scrolled, setScrolled] = useState(false);

    // Track scroll for sticky header styling
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Filter Products
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

        let text = `Hi ${shop.shop_display_name}, I saw your online catalogue.`;
        if (product) {
            text = `Hi, I am interested in *${product.name}* (Price: ₹${product.price}). Can you share more details?`;
        }

        const url = `https://wa.me/${shop.contact_phone.replace(/\+/g, '')}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
        incrementView(shop.shop_id, 'whatsapp_click', { product_id: product?.id });
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 font-sans">

            {/* Hero Section */}
            <div
                className="relative text-white pt-12 pb-24 px-6 overflow-hidden transition-colors duration-500"
                style={{
                    background: `linear-gradient(135deg, ${shop.primary_color} 0%, #1a1a1a 100%)`
                }}
            >
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Sparkles className="w-64 h-64" />
                </div>

                <div className="max-w-4xl mx-auto relative z-10 text-center space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-2 drop-shadow-md">
                            {shop.shop_display_name}
                        </h1>
                        {shop.about_text && (
                            <p className="text-white/90 text-sm md:text-lg max-w-xl mx-auto leading-relaxed font-light">
                                {shop.about_text}
                            </p>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Sticky Navigation & Search */}
            <div
                className={`sticky top-0 z-40 transition-all duration-300 ${scrolled
                    ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg shadow-sm pt-2'
                    : 'bg-transparent -mt-10'
                    }`}
            >
                <div className="max-w-4xl mx-auto px-4 pb-4 space-y-4">
                    {/* Search Bar - Pop over effect */}
                    <div className={`${!scrolled ? 'shadow-lg' : ''} bg-white dark:bg-gray-800 rounded-full transition-shadow duration-300`}>
                        <div className="relative">
                            <Search className="absolute left-4 top-3 h-5 w-5 text-gray-400" />
                            <Input
                                placeholder="Search for jewellery..."
                                className="pl-12 h-11 border-none bg-transparent rounded-full focus-visible:ring-0 text-base"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Categories Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide mask-fade-sides">
                        <Button
                            variant={selectedCategory === 'all' ? 'default' : 'secondary'}
                            size="sm"
                            className={`rounded-full px-6 flex-shrink-0 transition-all duration-300 ${selectedCategory === 'all' ? 'shadow-md scale-105' : 'bg-white dark:bg-gray-800'}`}
                            onClick={() => setSelectedCategory('all')}
                            style={selectedCategory === 'all' ? { backgroundColor: shop.primary_color } : {}}
                        >
                            All
                        </Button>
                        {categories.map(cat => (
                            <Button
                                key={cat.id}
                                variant={selectedCategory === cat.id ? 'default' : 'secondary'}
                                size="sm"
                                className={`rounded-full px-6 flex-shrink-0 transition-all duration-300 ${selectedCategory === cat.id ? 'shadow-md scale-105' : 'bg-white dark:bg-gray-800'}`}
                                onClick={() => setSelectedCategory(cat.id)}
                                style={selectedCategory === cat.id ? { backgroundColor: shop.primary_color } : {}}
                            >
                                {cat.name}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-24 text-gray-400">
                        <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">No products found</p>
                        <p className="text-sm">Try using different search terms</p>
                    </div>
                ) : (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8"
                    >
                        {filteredProducts.map((product) => (
                            <motion.div
                                key={product.id}
                                variants={item}
                                onClick={() => handleProductClick(product)}
                                className="group cursor-pointer"
                            >
                                <div className="aspect-[4/5] bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm relative mb-3 transition-transform duration-500 group-hover:-translate-y-1 group-hover:shadow-lg">
                                    {/* Image */}
                                    {product.images && product.images[0] ? (
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-200 bg-gray-50 dark:bg-gray-900">
                                            <ShoppingBag className="h-12 w-12 mb-2" />
                                            <span className="text-xs font-medium text-gray-400">No Image</span>
                                        </div>
                                    )}

                                    {/* Featured Tag */}
                                    {product.is_featured && (
                                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-black text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                            Featured
                                        </span>
                                    )}

                                    {/* Price Badge on Image (Mobile style) */}
                                    <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full">
                                        ₹{product.price.toLocaleString('en-IN')}
                                    </div>
                                </div>

                                <div className="space-y-1 px-1">
                                    <h3 className="font-medium text-gray-900 dark:text-gray-100 text-base line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{product.purity}</span>
                                        {product.weight_g && <span>• {product.weight_g}g</span>}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Floating Action Button (WhatsApp) */}
            {shop.contact_phone && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="fixed bottom-6 right-6 z-50"
                >
                    <Button
                        size="icon"
                        className="h-14 w-14 rounded-full shadow-xl bg-[#25D366] hover:bg-[#128C7E] text-white transition-all hover:scale-110"
                        onClick={() => handleWhatsAppInquiry()}
                    >
                        <MessageCircle className="h-7 w-7" />
                    </Button>
                </motion.div>
            )}

            {/* Product Detail Modal */}
            <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
                <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl" aria-describedby="product-dialog-description">
                    <DialogHeader className="sr-only">
                        <DialogTitle>{selectedProduct?.name || 'Product Details'}</DialogTitle>
                        <DialogDescription id="product-dialog-description">
                            Detailed view of {selectedProduct?.name} including price, weight, and purity.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedProduct && (
                        <div className="flex flex-col bg-white dark:bg-gray-950">
                            {/* Full Header Image */}
                            <div className="relative aspect-square">
                                {selectedProduct.images && selectedProduct.images[0] ? (
                                    <img
                                        src={selectedProduct.images[0]}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                        <ShoppingBag className="h-20 w-20 text-gray-300" />
                                    </div>
                                )}
                                <Button
                                    className="absolute top-4 right-4 rounded-full h-8 w-8 bg-black/20 hover:bg-black/40 text-white backdrop-blur-md p-0"
                                    onClick={() => setSelectedProduct(null)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="p-6 md:p-8 space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                                        {selectedProduct.name}
                                    </h2>
                                    <p className="text-3xl font-bold mt-2" style={{ color: shop.primary_color }}>
                                        ₹{selectedProduct.price.toLocaleString('en-IN')}
                                    </p>
                                </div>

                                <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                                    <div className="flex-1 text-center border-r border-gray-200 dark:border-gray-800">
                                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Purity</p>
                                        <p className="font-semibold text-lg">{selectedProduct.purity}</p>
                                    </div>
                                    <div className="flex-1 text-center">
                                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Weight</p>
                                        <p className="font-semibold text-lg">{selectedProduct.weight_g || '-'}g</p>
                                    </div>
                                </div>

                                {selectedProduct.description && (
                                    <div className="prose prose-sm dark:prose-invert">
                                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                            {selectedProduct.description}
                                        </p>
                                    </div>
                                )}

                                <Button
                                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white gap-2 h-14 text-lg rounded-xl shadow-lg shadow-green-500/20 transition-transform active:scale-95"
                                    onClick={() => handleWhatsAppInquiry(selectedProduct)}
                                >
                                    <MessageCircle className="h-6 w-6" />
                                    Ask on WhatsApp
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
