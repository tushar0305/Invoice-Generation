# Design System: Layout Patterns

SwarnaVyapar uses a **"Fixed Application Shell"** architecture. Unlike traditional websites that scroll the `<body>`, our app behaves like a desktop application (e.g., VS Code, Excel).

## The Desktop Shell

The layout consists of a fixed Sidebar and a Header, with a content area that fills the remaining viewport.

### Core Structure
```tsx
// The main container fills the screen and removes body scroll
<div className="h-screen w-full flex overflow-hidden">
  <Sidebar />
  <main className="flex-1 flex flex-col h-full overflow-hidden">
    <Header />
    <div className="flex-1 overflow-hidden relative">
      {/* Page Content Goes Here */}
    </div>
  </main>
</div>
```

### Page Layouts

#### 1. The Data Grid (Invoices, Inventory)
For pages with large tables, we do **NOT** scroll the page. We scroll the table body only.

**Rules:**
-   **Container Height**: `h-[calc(100vh-var(--nav-height))]` (approx `6rem` header).
-   **Table Container**: `flex-1 overflow-auto`.
-   **Header**: `sticky top-0 z-20`.

**Example:**
```tsx
<div className="flex flex-col h-[calc(100vh-6rem)]">
  <div className="shrink-0 p-4">
     {/* Filters & Actions */}
  </div>
  <div className="flex-1 overflow-auto border rounded-xl">
     <Table>
       <TableHeader className="sticky top-0 z-20 bg-card">...</TableHeader>
       <TableBody>...</TableBody>
     </Table>
  </div>
</div>
```

#### 2. The Dashboard (Scrollable)
For dashboard or form-heavy pages, standard scrolling is permitted within the main content area.
-   Use `ScrollArea` or native `d-flex flex-col overflow-y-auto`.

## Mobile Layouts

On mobile, the Sidebar becomes a `Sheet` (Drawer) or Bottom Navigation.

-   **Cards NOT Tables**: Do not show complex tables on mobile. Use `<Card />` components to render list items.
-   **Touch Targets**: All interactive elements must be at least `44px` high (`h-11`).
-   **Sticky Bottom**: Primary actions (e.g., "Save") should often be sticky at the bottom of the screen (`fixed bottom-0 w-full`) or in a bottom drawer.
