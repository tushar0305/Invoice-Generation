"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useUser } from '@/supabase/provider';
import { supabase } from '@/supabase/client';

export function ThemeToggle() {
    const { setTheme, theme } = useTheme();
    const { user } = useUser();

    const handleThemeChange = async () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);

        if (user) {
            const { error } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.uid,
                    theme: newTheme,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
            
            if (error) {
                console.error('Error updating theme preference:', error);
            }
        }
    };

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full"
        >
            <Button
                variant="ghost"
                onClick={handleThemeChange}
                className="w-full h-11 px-4 rounded-xl border border-primary/10 bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 hover:border-primary/20 transition-all duration-300 group relative overflow-hidden shadow-gold-sm hover:shadow-gold-md"
            >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

                <div className="relative flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        <div className="relative h-5 w-5">
                            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-300 text-primary dark:-rotate-90 dark:scale-0 absolute" />
                            <Moon className="h-5 w-5 rotate-90 scale-0 transition-all duration-300 text-primary dark:rotate-0 dark:scale-100 absolute" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                            {theme === "dark" ? "Dark Mode" : "Light Mode"}
                        </span>
                    </div>

                    {/* Toggle indicator */}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-background/50 border border-border/50">
                        <div className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${theme === "light" ? "bg-primary" : "bg-muted-foreground/30"}`} />
                        <div className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${theme === "dark" ? "bg-primary" : "bg-muted-foreground/30"}`} />
                    </div>
                </div>
                <span className="sr-only">Toggle theme</span>
            </Button>
        </motion.div>
    );
}
