# Design System: Typography

We use a dual-font system to convey "Modern Luxury".

## Font Families

### 1. Inter (Body & UI)
**Usage**: All UI text, tables, inputs, buttons, and functional elements.
**Why**: Highly legible at small sizes, neutral, and clean.

```css
font-family: 'Inter', sans-serif;
```

### 2. Playfair Display (Headings)
**Usage**: Big Page Titles, H1/H2, and Brand Moments (Logos, Hero sections).
**Why**: A high-contrast serif that evokes "Gold/Jewellery" heritage and luxury.

```css
font-family: 'Playfair Display', serif;
```

## Type Scale

We follow the standard Tailwind scale, but with specific semantic mappings.

| Class | Size | Line Height | Usage |
| :--- | :--- | :--- | :--- |
| `text-xs` | 12px | 1rem | Table metadata, hints, secondary text |
| `text-sm` | 14px | 1.25rem | **Standard Body Size** (Table rows, Inputs) |
| `text-base` | 16px | 1.5rem | Card descriptions, large inputs |
| `text-lg` | 18px | 1.75rem | Modal titles |
| `text-xl` | 20px | 1.75rem | Section Headers |
| `text-2xl` | 24px | 2rem | Page Titles (H1) |
| `text-3xl` | 30px | 2.25rem | Dashboard KPI Values |

## Font Weights

-   **Regular (400)**: Body text.
-   **Medium (500)**: Buttons, Navigation, Table Data.
-   **Semibold (600)**: Subheadings, Important Data.
-   **Bold (700)**: Page Titles (Playfair), KPIs.

## Best Practices

1.  **Tabular Nums**: When displaying prices or IDs, always use `tabular-nums` class to align digits strictly.
    ```tsx
    <span className="font-mono tabular-nums">₹{amount}</span>
    ```
2.  **Uppercase Headers**: Table headers are always `text-xs uppercase tracking-wider font-bold text-muted-foreground`.
