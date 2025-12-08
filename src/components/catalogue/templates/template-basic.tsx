'use client';

import { useState, useMemo } from 'react';
import {
    Search,
    ShoppingBag,
    Phone,
    Share2,
    MapPin,
    Clock,
    Grid,
    List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export function TemplateBasic({ shop, initialProducts, categories }: StoreClientProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: shop.shop_display_name,
                url: window.location.href
            }).catch((err) => {
                if (process.env.NODE_ENV === 'development') {
                    console.error(err);
                }
            });
        }
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans">

            {/* 1. Header & Navigation (Clean, Centered) */}
            <header className="border-b border-gray-100 bg-white sticky top-0 z-40">
                <div className="max-w-md mx-auto px-4 py-3">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                            <h1 className="text-xl font-bold tracking-tight text-gray-900 truncate">
                                {shop.shop_display_name}
                            </h1>
                            {shop.contact_address && (
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                                    <MapPin className="h-3 w-3" /> {shop.contact_address}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-600" onClick={handleShare}>
                                <Share2 className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors h-10 rounded-lg text-sm"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Scrollable Categories */}
                <div className="border-t border-gray-100 overflow-x-auto scrollbar-hide py-2">
                    <div className="flex px-4 gap-6 min-w-max">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`text-sm font-medium pb-2 -mb-2.5 border-b-2 transition-colors ${selectedCategory === 'all' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500'}`}
                        >
                            All
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`text-sm font-medium pb-2 -mb-2.5 border-b-2 transition-colors ${selectedCategory === cat.id ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* 2. Main Content */}
            <main className="max-w-md mx-auto px-4 py-6 pb-24">

                {/* About Section (Simple Text) */}
                {shop.about_text && selectedCategory === 'all' && !searchTerm && (
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {shop.about_text}
                        </p>
                    </div>
                )}

                {/* Controls */}
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">{filteredProducts.length} Products</p>
                    <div className="flex gap-2 border rounded-md p-1">
                        <button onClick={() => setViewMode('grid')} className={`p-1 rounded ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}>
                            <Grid className="h-4 w-4" />
                        </button>
                        <button onClick={() => setViewMode('list')} className={`p-1 rounded ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}>
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Product Grid / List */}
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">No products found</p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-4" : "flex flex-col gap-4"}>
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                onClick={() => handleProductClick(product)}
                                className={`group cursor-pointer border border-gray-100 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow ${viewMode === 'list' ? 'flex items-center' : ''}`}
                            >
                                {/* Image Container - Fixed Aspect Ratio */}
                                <div className={`bg-gray-100 relative ${viewMode === 'grid' ? 'aspect-square w-full' : 'h-24 w-24 flex-shrink-0'}`}>
                                    {product.images && product.images[0] ? (
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <ShoppingBag className="h-8 w-8" />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-3 flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 text-sm truncate leading-tight mb-1">
                                        {product.name}
                                    </h3>
                                    <p className="text-gray-900 font-bold text-sm">
                                        ₹{product.price.toLocaleString('en-IN')}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                                        {product.purity && <span className="bg-gray-100 px-1.5 py-0.5 rounded">{product.purity}</span>}
                                        {product.weight_g && <span>{product.weight_g}g</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* 3. Footer (Simple Contact) */}
            <footer className="bg-gray-50 border-t border-gray-200 py-8 px-4 text-center">
                <h4 className="font-semibold text-gray-900 mb-2">{shop.shop_display_name}</h4>
                {shop.contact_phone && (
                    <Button variant="outline" size="sm" className="gap-2 text-green-600 border-green-200 hover:bg-green-50 mb-4" onClick={() => handleWhatsAppInquiry()}>
                        <Phone className="h-3 w-3" /> Contact Shop
                    </Button>
                )}
                <p className="text-xs text-gray-400">Powered by SwarnaVyapar</p>
            </footer>

            {/* 4. Product Detail Modal (Basic) */}
            <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
                <DialogContent className="max-w-sm rounded-lg p-0 overflow-hidden gap-0">
                    <DialogHeader className="sr-only">
                        <DialogTitle>{selectedProduct?.name}</DialogTitle>
                        <DialogDescription>Details</DialogDescription>
                    </DialogHeader>

                    {selectedProduct && (
                        <div className="flex flex-col max-h-[85vh] overflow-y-auto">
                            <div className="aspect-square bg-gray-100 relative">
                                {selectedProduct.images && selectedProduct.images[0] ? (
                                    <img
                                        src={selectedProduct.images[0]}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <ShoppingBag className="h-16 w-16" />
                                    </div>
                                )}
                            </div>

                            <div className="p-5 space-y-4">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 leading-tight">
                                        {selectedProduct.name}
                                    </h2>
                                    <p className="text-xl font-bold text-gray-900 mt-1">
                                        ₹{selectedProduct.price.toLocaleString('en-IN')}
                                    </p>
                                </div>

                                <div className="border-t border-b border-gray-100 py-3 flex justify-between text-sm">
                                    <div className="text-center flex-1 border-r border-gray-100">
                                        <span className="text-gray-500 block text-xs uppercase mb-0.5">Purity</span>
                                        <span className="font-medium text-gray-900">{selectedProduct.purity || '-'}</span>
                                    </div>
                                    <div className="text-center flex-1">
                                        <span className="text-gray-500 block text-xs uppercase mb-0.5">Weight</span>
                                        <span className="font-medium text-gray-900">{selectedProduct.weight_g ? `${selectedProduct.weight_g}g` : '-'}</span>
                                    </div>
                                </div>

                                {selectedProduct.description && (
                                    <div className="text-sm text-gray-600 leading-relaxed">
                                        {selectedProduct.description}
                                    </div>
                                )}

                                <Button
                                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white gap-2"
                                    onClick={() => handleWhatsAppInquiry(selectedProduct)}
                                >
                                    <Phone className="h-4 w-4" />
                                    Enquire on WhatsApp
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
