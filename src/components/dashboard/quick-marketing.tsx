'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send, Sparkles, Zap, Users } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

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
        <Card className="h-full min-h-[400px] overflow-hidden relative flex flex-col border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-gray-900">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/8 via-transparent to-emerald-500/8 pointer-events-none" />

            <CardHeader className="pb-3 border-b-2 border-gray-200 dark:border-gray-700 relative">
                <CardTitle className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-800/20 border border-purple-200/50 dark:border-purple-700/30">
                        <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    Quick Marketing
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5 relative">
                {/* Customer count highlight */}
                <motion.div
                    className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-blue-50/80 to-purple-50/60 dark:from-blue-950/30 dark:to-purple-900/20 border border-blue-100/50 dark:border-blue-800/30"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-800/30 border border-blue-200/50 dark:border-blue-700/30">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-foreground font-heading tabular-nums">{customerCount}</p>
                        <p className="text-xs text-muted-foreground">Ready to engage</p>
                    </div>
                </motion.div>

                {/* Message preview */}
                <motion.div
                    className="relative overflow-hidden bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-900 dark:to-slate-800/50 p-4 rounded-2xl border border-slate-100/60 dark:border-slate-700/30 shadow-inner"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                >
                    <div className="absolute top-2 right-2">
                        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Message Preview</p>
                    <p className="text-sm text-foreground leading-relaxed">
                        "Hello! <span className="font-semibold text-amber-600 dark:text-amber-400">{shopName}</span> has a new collection of exclusive jewellery..."
                    </p>
                </motion.div>

                {/* WhatsApp button */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                >
                    <Button
                        onClick={handleSendUpdate}
                        disabled={isLoading || customerCount === 0}
                        className="w-full h-12 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#22c55e] hover:to-[#0d9488] text-white shadow-lg shadow-emerald-500/25 rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                    <Send className="w-4 h-4" />
                                </motion.div>
                                Opening WhatsApp...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <MessageCircle className="w-5 h-5" />
                                Send Update via WhatsApp
                            </span>
                        )}
                    </Button>
                </motion.div>

                {customerCount === 0 && (
                    <p className="text-xs text-center text-muted-foreground/70">
                        Add customers to start marketing
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
