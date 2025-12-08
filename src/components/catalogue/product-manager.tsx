'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Pencil,
    Trash2,
    Search,
    Image as ImageIcon,
    Tag,
    MoreVertical,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
    getCatalogueProducts,
    getCatalogueCategories,
    saveCatalogueProduct,
    deleteCatalogueProduct,
    saveCatalogueCategory
} from '@/actions/catalogue-actions';

interface ProductManagerProps {
    shopId: string;
}

export function ProductManager({ shopId }: ProductManagerProps) {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const { toast } = useToast();

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        category_id: '',
        price: '',
        weight_g: '',
        purity: '22K',
        description: '',
        is_featured: false,
        image_url: ''
    });
    const [newCategoryName, setNewCategoryName] = useState('');

    const loadData = async () => {
        setIsLoading(true);
        const [prodData, catData] = await Promise.all([
            getCatalogueProducts(shopId),
            getCatalogueCategories(shopId)
        ]);
        setProducts(prodData);
        setCategories(catData);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [shopId]);

    const handleSaveProduct = async () => {
        if (!formData.name) return toast({ title: 'Error', description: 'Name is required', variant: 'destructive' });

        setIsSaving(true);
        try {
            const payload = {
                shop_id: shopId,
                ...formData,
                images: formData.image_url ? [formData.image_url] : [],
                id: editingProduct?.id
            };

            const result = await saveCatalogueProduct(shopId, payload);
            if (result.success) {
                toast({ title: 'Success', description: 'Product saved' });
                setIsProductDialogOpen(false);
                setEditingProduct(null);
                resetForm();
                loadData();
            } else {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            }
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error(error);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        const result = await deleteCatalogueProduct(id, shopId);
        if (result.success) {
            toast({ title: 'Deleted', description: 'Product removed' });
            loadData();
        }
    };

    const handleSaveCategory = async () => {
        if (!newCategoryName) return;
        setIsSaving(true);
        const result = await saveCatalogueCategory(shopId, newCategoryName);
        if (result.success) {
            toast({ title: 'Success', description: 'Category added' });
            setIsCategoryDialogOpen(false);
            setNewCategoryName('');
            loadData();
        }
        setIsSaving(false);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            category_id: '',
            price: '',
            weight_g: '',
            purity: '22K',
            description: '',
            is_featured: false,
            image_url: ''
        });
    };

    const openEdit = (product: any) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            category_id: product.category_id || '',
            price: product.price,
            weight_g: product.weight_g,
            purity: product.purity,
            description: product.description || '',
            is_featured: product.is_featured,
            image_url: product.images && product.images[0] ? product.images[0] : ''
        });
        setIsProductDialogOpen(true);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search products..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={() => setIsCategoryDialogOpen(true)}>
                        <Tag className="h-4 w-4 mr-2" />
                        Categories
                    </Button>
                    <Button onClick={() => { setEditingProduct(null); resetForm(); setIsProductDialogOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : filteredProducts.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="p-8 text-center text-gray-500">
                        <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No products found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                        <Card key={product.id} className="group hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <ImageIcon className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openEdit(product)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleDeleteProduct(product.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                                <div className="flex justify-between text-sm text-gray-500 mt-1">
                                    <span>{product.category?.name || 'Uncategorized'}</span>
                                    <span>{product.purity}</span>
                                </div>
                                <div className="flex justify-between items-center mt-3 pt-3 border-t">
                                    <span className="font-medium">₹{product.price}</span>
                                    {product.weight_g && <span className="text-xs bg-gray-100 px-2 py-1 rounded">{product.weight_g}g</span>}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add/Edit Product Dialog */}
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Label>Product Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Gold Necklace Set"
                                />
                            </div>
                            <div>
                                <Label>Category</Label>
                                <Select
                                    value={formData.category_id}
                                    onValueChange={(val) => setFormData({ ...formData, category_id: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Purity</Label>
                                <Select
                                    value={formData.purity}
                                    onValueChange={(val) => setFormData({ ...formData, purity: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="24K">24K</SelectItem>
                                        <SelectItem value="22K">22K</SelectItem>
                                        <SelectItem value="18K">18K</SelectItem>
                                        <SelectItem value="14K">14K</SelectItem>
                                        <SelectItem value="Silver">Silver</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Weight (g)</Label>
                                <Input
                                    type="number"
                                    value={formData.weight_g}
                                    onChange={(e) => setFormData({ ...formData, weight_g: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <Label>Price (₹)</Label>
                                <Input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                            <div className="col-span-2">
                                <Label>Image URL (Optional)</Label>
                                <Input
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                            <div className="col-span-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Product details..."
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={formData.is_featured}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                                />
                                <Label>Mark as Featured</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveProduct} disabled={isSaving}>
                            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Save Product
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Category Dialog */}
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Category</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Category Name</Label>
                        <Input
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="e.g. Bridal Collection"
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveCategory} disabled={isSaving}>Save Category</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
