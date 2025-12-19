"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import { useUser } from "@/supabase/provider";

type Theme = "light" | "dark" | "obsidian" | "system";
type Palette = "gold" | "emerald" | "maroon" | "ivory" | "blue" | "rose";

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};

type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    palette: Palette;
    setPalette: (p: Palette) => void;
};

const initialState: ThemeProviderState = {
    theme: "light",
    setTheme: () => null,
    palette: "gold",
    setPalette: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
    children,
    defaultTheme = "light",
    storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(defaultTheme);
    const [palette, setPalette] = useState<Palette>("gold");
    const [mounted, setMounted] = useState(false);

    const { user } = useUser();

    useEffect(() => {
        setMounted(true);

        // 1. Load from local storage immediately for speed
        const storedTheme = localStorage.getItem(storageKey) as Theme;
        if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
            setTheme(storedTheme);
        }

        // 2. Load theme from DB if user is logged in (Sync)
        const loadThemeFromDB = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('user_preferences')
                .select('theme')
                .eq('user_id', user.uid)
                .single();

            // Only override if DB has a value and it's different (or just trust DB)
            // Ideally, local interaction updates DB, so they should match.
            // If they differ, DB wins as "cloud truth"? Or Local wins as "on this device"?
            // Let's let DB win to ensure cross-device sync.
            if (data?.theme && ['light', 'dark', 'system'].includes(data.theme)) {
                setTheme(data.theme as Theme);
            }
        };
        loadThemeFromDB();
    }, [user, storageKey]);

    useEffect(() => {
        const root = window.document.documentElement;

        root.classList.remove("light", "dark");

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light";

            root.classList.add(systemTheme);
            return;
        }

        root.classList.add(theme);
    }, [theme]);

    const value = React.useMemo(() => ({
        theme,
        setTheme: (newTheme: Theme) => {
            setTheme(newTheme);
            // Sync to DB
            if (user) {
                supabase.from('user_preferences').upsert({
                    user_id: user.uid,
                    theme: newTheme as any,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' }).then(({ error }) => {
                    if (error) console.error("Failed to sync theme:", error);
                });
            }
        },
        palette,
        setPalette: (p: Palette) => setPalette(p),
    }), [theme, palette, user]);

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext);

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider");

    return context;
}
