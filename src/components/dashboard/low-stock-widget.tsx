'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LowStockItem {
    id: string;
    name: string;
    currentQty: number;
    minQty: number;
    unit: string;
}

interface LowStockWidgetProps {
    shopId: string;
    items: LowStockItem[];
}

export function LowStockWidget({ shopId, items }: LowStockWidgetProps) {
    const criticalItems = items.filter(item => item.currentQty <= item.minQty * 0.5);
    const warningItems = items.filter(item => item.currentQty > item.minQty * 0.5 && item.currentQty <= item.minQty);

    return (
        <Card className="h-full overflow-hidden bg-card border border-border shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${items.length > 0 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        <Package className={`h-4 w-4 ${items.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500'}`} />
                    </div>
                    Stock Alerts
                </CardTitle>
                {items.length > 0 && (
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30"
                    >
                        <AlertTriangle className="h-3 w-3 text-amber-600" />
                        <span className="text-[10px] font-bold text-amber-600">{items.length}</span>
                    </motion.div>
                )}
            </CardHeader>
            <CardContent className="pt-2">
                {items.length === 0 ? (
                    <div className="text-center py-4">
                        <Package className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                        <p className="text-xs text-gray-500">All stock levels healthy!</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {items.slice(0, 3).map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`
                  flex items-center justify-between p-2 rounded-lg border
                  ${item.currentQty <= item.minQty * 0.5
                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                                    }
                `}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{item.name}</p>
                                    <p className="text-[10px] text-gray-500">
                                        {item.currentQty} / {item.minQty} {item.unit}
                                    </p>
                                </div>
                                <div className={`
                  text-[10px] font-bold px-2 py-0.5 rounded
                  ${item.currentQty <= item.minQty * 0.5
                                        ? 'bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300'
                                        : 'bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300'
                                    }
                `}>
                                    {item.currentQty <= item.minQty * 0.5 ? 'Critical' : 'Low'}
                                </div>
                            </motion.div>
                        ))}
                        {items.length > 3 && (
                            <Button variant="ghost" size="sm" className="w-full text-xs h-7" asChild>
                                <Link href={`/shop/${shopId}/stock`}>
                                    +{items.length - 3} more <ArrowRight className="h-3 w-3 ml-1" />
                                </Link>
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
