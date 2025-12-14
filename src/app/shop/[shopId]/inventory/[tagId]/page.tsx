'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, QrCode, Scale, IndianRupee, MapPin, Calendar, Printer, Package, History, Edit } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { InventoryItem, InventoryStatusHistory } from '@/lib/inventory-types';
import { STATUS_LABELS } from '@/lib/inventory-types';
import { Loader2 } from 'lucide-react';

export default function InventoryItemDetailPage({ params }: { params: Promise<{ shopId: string; tagId: string }> }) {
    const { shopId, tagId } = use(params);
    const router = useRouter();
    const { toast } = useToast();
    const [item, setItem] = useState<InventoryItem | null>(null);
    const [history, setHistory] = useState<InventoryStatusHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchItem() {
            try {
                const response = await fetch(`/api/v1/inventory/${tagId}`);
                const data = await response.json();

                if (!response.ok) throw new Error(data.error);

                setItem(data.item);
                setHistory(data.history || []);
            } catch (err: any) {
                toast({ variant: 'destructive', title: 'Error', description: err.message });
                router.push(`/shop/${shopId}/inventory`);
            } finally {
                setIsLoading(false);
            }
        }
        fetchItem();
    }, [tagId, shopId, router, toast]);

    const handlePrintTag = () => {
        if (!item) return;
        
        // Create a hidden iframe for printing
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(item.tag_id)}`;
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Print Tag - ${item.tag_id}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: Arial, sans-serif; 
                        padding: 20px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        background: white;
                    }
                    .tag-container {
                        border: 2px dashed #333;
                        padding: 20px;
                        text-align: center;
                        width: fit-content;
                        background: white;
                    }
                    .qr-code {
                        width: 200px;
                        height: 200px;
                        margin-bottom: 10px;
                    }
                    .tag-id {
                        font-size: 16px;
                        font-weight: bold;
                        font-family: 'Courier New', monospace;
                        margin-bottom: 5px;
                        letter-spacing: 1px;
                    }
                    .item-name {
                        font-size: 12px;
                        color: #555;
                        margin-bottom: 3px;
                    }
                    .item-details {
                        font-size: 11px;
                        color: #777;
                    }
                    @media print {
                        body {
                            padding: 0;
                            background: none;
                        }
                        .tag-container {
                            border: 2px dashed #000;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="tag-container">
                    <img src="${qrUrl}" alt="QR Code" class="qr-code">
                    <div class="tag-id">${item.tag_id}</div>
                    <div class="item-name">${item.name || item.category}</div>
                    <div class="item-details">${item.purity} • ${item.net_weight}g</div>
                </div>
            </body>
            </html>
        `;
        
        if (iframe.contentDocument) {
            iframe.contentDocument.open();
            iframe.contentDocument.write(htmlContent);
            iframe.contentDocument.close();
            
            iframe.onload = () => {
                iframe.contentWindow?.print();
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            };
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!item) {
        return null;
    }

    const statusInfo = STATUS_LABELS[item.status];

    return (
        <div className="space-y-6 pb-20 md:pb-6">
            {/* Header */}
            <div className="flex items-start gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="shrink-0 h-10 w-10 rounded-full hover:bg-muted mt-1"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Badge
                            variant="secondary"
                            className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded-full",
                                item.status === 'IN_STOCK' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                                item.status === 'RESERVED' && "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
                                item.status === 'SOLD' && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                            )}
                        >
                            {statusInfo?.label || item.status}
                        </Badge>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold truncate">{item.name}</h1>
                    <p className="text-muted-foreground font-mono text-sm">{item.tag_id}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrintTag} title="Print Tag">
                        <Printer className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => router.push(`/shop/${shopId}/inventory/new?edit=${item.id}`)} title="Edit">
                        <Edit className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* QR Code & Key Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* QR Code Card */}
                <Card className="glass-card border-border/50 md:row-span-2">
                    <CardContent className="p-6 flex flex-col items-center justify-center">
                        <div className="bg-white p-4 rounded-xl mb-4">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(item.tag_id)}`}
                                alt="QR Code"
                                className="w-[150px] h-[150px]"
                            />
                        </div>
                        <p className="font-mono text-lg font-bold text-center">{item.tag_id}</p>
                        <p className="text-sm text-muted-foreground mt-1">Scan to view details</p>
                        <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={handlePrintTag}>
                            <Printer className="h-4 w-4" />
                            Print Tag
                        </Button>
                    </CardContent>
                </Card>

                {/* Weight Card */}
                <Card className="glass-card border-border/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Scale className="h-4 w-4 text-blue-500" />
                            Weight
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Gross</span>
                                <span className="font-bold">{item.gross_weight}g</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Net</span>
                                <span className="font-bold text-primary">{item.net_weight}g</span>
                            </div>
                            {item.stone_weight > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Stone</span>
                                    <span>{item.stone_weight}g</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Pricing Card */}
                <Card className="glass-card border-border/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <IndianRupee className="h-4 w-4 text-green-500" />
                            Charges
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Making Charge</span>
                                <span>₹{item.making_charge_value} {item.making_charge_type === 'PER_GRAM' ? '/g' : ''}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Stone Value</span>
                                <span>₹{item.stone_value || '0'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Details Card */}
                <Card className="glass-card border-border/50 md:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Package className="h-4 w-4 text-purple-500" />
                            Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground block">Metal</span>
                                <span className="font-medium">{item.metal_type}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Purity</span>
                                <span className="font-medium text-amber-600 dark:text-amber-400">{item.purity}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Category</span>
                                <span className="font-medium">{item.category || '-'}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Location</span>
                                <span className="font-medium">{item.location || '-'}</span>
                            </div>
                        </div>
                        {item.description && (
                            <div className="mt-4 pt-4 border-t border-border/50">
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Status History */}
            {history.length > 0 && (
                <Card className="glass-card border-border/50">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <History className="h-4 w-4 text-muted-foreground" />
                            Status History
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-3">
                            {history.map((entry, idx) => (
                                <div key={entry.id} className="flex items-start gap-3 text-sm">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                                        idx === 0 ? "bg-primary" : "bg-muted"
                                    )} />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            {entry.old_status && (
                                                <>
                                                    <span className="text-muted-foreground">{entry.old_status}</span>
                                                    <span className="text-muted-foreground">→</span>
                                                </>
                                            )}
                                            <span className="font-medium">{entry.new_status}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(entry.created_at).toLocaleDateString()} at {new Date(entry.created_at).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
