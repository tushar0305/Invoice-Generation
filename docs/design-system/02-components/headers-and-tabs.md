# Design System: Page Headers & Tabs

This document outlines the standard patterns for high-impact page headers ("Hero Sections") and content navigation tabs, based on the **Khata Book / Ledger** design.

## 1. Premium Page Header (The "Hero")

For major feature pages (e.g., Ledger, Invoices Dashboard, Smart Insights), we use a visually rich "Hero" section that combines gradients, glassmorphism, and floating elements to create a premium feel.

### Visual Anatomy
1.  **Background**: A subtle gradient mesh or radial burst.
2.  **Floating Orbs**: Animated, blurred circles (`bg-primary/20 blur-3xl`) to add depth.
3.  **Glass Material**: The main content card uses `backdrop-blur-xl bg-white/60` (Light) or `bg-gray-900/60` (Dark).
4.  **Typography**: Large Playfair Display (Serif) or Inter ExtraBold titles.

### Component Structure
```tsx
<div className="relative overflow-hidden pb-12">
    {/* 1. Background Layers */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
    
    {/* 2. Floating Orbs (Animated) */}
    <div className="absolute top-0 right-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse" />
    
    {/* 3. Glass Container */}
    <div className="relative max-w-7xl mx-auto px-4 py-10">
        <div className="backdrop-blur-xl bg-card/60 border border-white/10 shadow-2xl p-6 rounded-3xl">
            <div className="flex justify-between items-center">
                <div>
                     <Badge variant="premium">Feature Name</Badge>
                     <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-primary">
                        Page Title
                     </h1>
                     <p className="text-muted-foreground mt-2">Subtitle description...</p>
                </div>
            </div>
        </div>
    </div>
</div>
```

## 2. Stats Grid (Bento Style)

Often paired with the Hero, we display key metrics in a "Bento Grid" (2x2 or 4x1 layout).

-   **Style**: Glassmorphic cards (`bg-card/60 backdrop-blur`).
-   **Interactivity**: Hover lift effect (`hover:-translate-y-1`).
-   **Iconography**: Large, distinct icons with colored backgrounds (`bg-emerald-500/10 text-emerald-600`).

## 3. Capsule Tab Switcher

For filtering lists (e.g., "All vs Customers vs Suppliers"), we use a **Capsule Tab** pattern instead of standard underlined tabs.

### Design Rules
-   **Container**: `h-auto p-1.5 bg-background/80 backdrop-blur-xl border border-border shadow-xl shadow-black/5 rounded-full grid grid-cols-2 w-full md:w-auto md:inline-flex md:h-14` (Grid on mobile, inline on desktop).
-   **Button Base**: `rounded-full px-6 md:px-8 py-3 md:py-0 h-full text-sm font-medium transition-all capitalize flex items-center justify-center gap-2`
-   **Active State**: `data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg`.
-   **Inactive State**: `text-muted-foreground hover:bg-muted/50`.

### Code Example
```tsx
<TabsList className="h-auto p-1.5 bg-background/80 backdrop-blur-xl border border-border shadow-xl shadow-black/5 rounded-full grid grid-cols-2 w-full md:w-auto md:inline-flex md:h-14">
  {tabs.map(tab => (
    <TabsTrigger
      key={tab.id}
      value={tab.id}
      className="rounded-full px-6 md:px-8 py-3 md:py-0 h-full text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all capitalize"
    >
      <tab.icon className="h-4 w-4" />
      {tab.label}
    </TabsTrigger>
  ))}
</TabsList>
```

## 4. Sticky Toolbar

When scrolling long lists, the filter/search bar should stick to the top.

```tsx
<div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b py-4">
   {/* Search Input & Capsule Tabs go here */}
</div>
```
