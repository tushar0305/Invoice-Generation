'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface QuickMarketingProps {
    shopName: string;
    customerCount: number;
}

export function QuickMarketingWidget({ shopName, customerCount }: QuickMarketingProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleSendUpdate = () => {
        setIsLoading(true);

        // Simulate "preparing" the campaign
        setTimeout(() => {
            const message = `Hello! ${shopName} has a new collection of exclusive jewellery. Visit us today to explore the latest designs! ✨`;
            const encodedMessage = encodeURIComponent(message);

            // Open WhatsApp Web with the pre-filled message
            window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');

            toast({
                title: "WhatsApp Opened",
                description: "Select contacts to send your update.",
            });
            setIsLoading(false);
        }, 800);
    };

    return (
        <Card className="glass-panel border-gold-500/10 h-full bg-gradient-to-br from-white to-gold-50/30 dark:from-slate-950 dark:to-gold-950/10">
            <CardHeader className="pb-2 border-b border-gold-500/5">
                <CardTitle className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Quick Marketing
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                    Engage your <strong>{customerCount} customers</strong> instantly. Send a "New Collection" update via WhatsApp.
                </p>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-xs text-muted-foreground italic">
                    "Hello! {shopName} has a new collection of exclusive jewellery..."
                </div>

                <Button
                    onClick={handleSendUpdate}
                    disabled={isLoading || customerCount === 0}
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white shadow-lg shadow-emerald-500/20"
                >
                    {isLoading ? (
                        "Opening WhatsApp..."
                    ) : (
                        <>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Send Update
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
