'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import { Bot } from 'lucide-react';
import { SmartAIInsights } from '@/components/smart-ai-insights';
import { motion } from 'framer-motion';

export function FloatingStoreAssistant({ shopId }: { shopId: string }) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="fixed bottom-24 md:bottom-6 right-6 z-50"
                >
                    <Button
                        size="icon"
                        className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-tr from-[#D4AF37] to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white transition-all hover:scale-110 border-2 border-white/20"
                    >
                        <Bot className="h-7 w-7" />
                    </Button>
                </motion.div>
            </SheetTrigger>
            <SheetContent side="right" className="w-[100vw] sm:w-[540px] p-0 border-l border-white/10 z-[100]">
                {/* Visible Header helps with spacing for the Close button */}
                <SheetHeader className="px-6 py-4 border-b border-border/40">
                    <SheetTitle>Store Assistant AI</SheetTitle>
                </SheetHeader>
                <div className="h-[calc(100vh-4rem)] w-full bg-slate-50 dark:bg-slate-950 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto">
                        <SmartAIInsights
                            shopId={shopId}
                            className="min-h-full border-none shadow-none rounded-none bg-transparent p-4 md:p-6 pb-24"
                        />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
