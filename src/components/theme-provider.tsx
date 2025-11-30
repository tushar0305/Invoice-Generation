"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

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

    useEffect(() => {
        const savedTheme = localStorage.getItem(storageKey) as Theme | null;
        if (savedTheme) {
            setTheme(savedTheme);
        } else {
            // First time open: default to light mode per product decision.
            // We still allow the provider to accept defaultTheme prop to override.
            setTheme(defaultTheme ?? "light");
        }
        setMounted(true);
    }, [storageKey]);

    useEffect(() => {
        if (!mounted) return;

        const root = window.document.documentElement;
        root.classList.remove("light", "dark", "obsidian");

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light";
            root.classList.add(systemTheme);
            return;
        }

        root.classList.add(theme);
        localStorage.setItem(storageKey, theme);
        // Apply palette via data attribute for CSS variables
        root.setAttribute('data-palette', palette);
    }, [theme, storageKey, mounted, palette]);

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            setTheme(theme);
        },
        palette,
        setPalette: (p: Palette) => setPalette(p),
    };

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
