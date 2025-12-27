# Design System: Colors

The **SwarnaVyapar** brand uses a "Premium Gold" aesthetic, designed to feel luxurious yet functional for high-volume retail.

## Palette Overview

Our color system is built on **HSL variables** to support seamless Dark Mode switching.

### Primary Brand (Gold)
Used for primary actions, active states, and brand accents.

| Token | Hex (Base) | Tailind Class | Usage |
| :--- | :--- | :--- | :--- |
| **Gold 50** | `#FFF9E5` | `bg-gold-50` | Backgrounds, heavy tints |
| **Gold 100** | `#FFF3CC` | `bg-gold-100` | Secondary backgrounds |
| **Gold 500** | `#D4AF37` | `bg-gold-500` | **Primary Brand Color** (Buttons, Icons) |
| **Gold 600** | `#AA8C2C` | `bg-gold-600` | Hover states |
| **Gold 900** | `#2B230B` | `bg-gold-900` | Text on Light Gold |

### Neutrals (Slate)
Used for text, borders, and general UI structure. We avoid pure black (`#000`) for a softer, premium feel.

-   **Background**: White (`#FFFFFF`) / Dark (`#0a0a0b`)
-   **Foreground**: Deep Slate (`#1D1F23`) / White (`#fafafa`)
-   **Muted**: Slate Gray (`#6B7280`)

### Semantic Colors

| Intent | Color Family | Usage |
| :--- | :--- | :--- |
| **Success** | **Emerald** | Payment Received, Stock Added (`bg-emerald-500`) |
| **Destructive** | **Red/Rose** | Delete, Overdue, Error (`bg-destructive`) |
| **Warning** | **Amber** | Low Stock, Pending Action |
| **Info** | **Blue** | Links, Help Text |

## Usage Rules

### 1. Gradients
Use gradients sparingly for "Call to Action" buttons or Hero sections to create a metallic effect.
```css
.btn-gold {
  background: linear-gradient(135deg, #D4AF37 0%, #F3E5AB 50%, #D4AF37 100%);
}
```

### 2. Dark Mode
In Dark Mode, we shift from "White/Gold" to "Deep Black/Gold Glow".
-   Backgrounds become `#0a0a0b` (Rich Black).
-   Cards use `backdrop-filter: blur(24px)` for a "Glassmorphism" look.
-   Gold accents become **Neon/Glow** (`text-gold-400` or `hsl(42 75% 55%)`) to pop against the dark background.

### 3. Borders
Borders should be subtle.
-   **Light Mode**: `border-black/5` or `border-gold-500/20`.
-   **Dark Mode**: `border-white/10`.
