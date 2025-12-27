# Data Tables

Standardized table component for displaying data collections (Customers, Invoices, Inventory).

## Design Philosophy
-   **Fixed Layout**: Tables sit within a fixed-height container filling the screen (minus header), with internal scrolling.
-   **Sticky Headers**: Column headers remain visible while scrolling.
-   **Theme-Aware**: Rows highlight with the theme color on hover.
-   **Integrated Pagination**: Pagination controls are pinned to the bottom of the table container.

## Structure & Classes

### 1. Main Container
The wrapper responsible for the fixed height, rounded corners, and border.
```tsx
<div className="hidden md:flex flex-col max-h-[calc(100dvh-180px)] rounded-2xl border-2 border-gray-300 dark:border-white/20 overflow-hidden bg-card shadow-lg relative">
  {/* Scrollable Area */}
  <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
    <Table className="table-modern min-w-[1000px] relative">
      {/* ... */}
    </Table>
  </div>
  {/* Footer */}
</div>
```

### 2. Table Header
 sticky header with a backdrop blur and distinct borders.
```tsx
<TableHeader className="bg-muted/50 border-b-2 border-gray-300 dark:border-white/20 sticky top-0 z-20 shadow-sm backdrop-blur-sm">
  <TableRow className="hover:bg-transparent border-b border-border/50">
    <TableHead className="text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-10 pl-6">
      Column Name
    </TableHead>
    {/* ... other columns ... */}
  </TableRow>
</TableHeader>
```

### 3. Table Rows (Hover Effect)
Rows should be interactive and highlight using the primary theme color intensity on hover.
```tsx
<TableRow
  key={item.id}
  className="hover:bg-primary/5 cursor-pointer transition-colors border-b border-border/50 last:border-0 group"
  onClick={() => handleRowClick(item)}
>
  <TableCell className="pl-6 py-2">
    {/* Cell Content */}
  </TableCell>
</TableRow>
```

### 4. Pagination Footer
Pinned to the bottom of the container.
```tsx
<div className="flex items-center justify-between border-t border-gray-200 dark:border-white/10 p-4 bg-muted/20 backdrop-blur-sm z-20">
  <div className="text-sm text-muted-foreground text-center sm:text-left">
    Showing <span className="font-medium text-foreground">{start}</span> - <span className="font-medium text-foreground">{end}</span> of <span className="font-medium text-foreground">{total}</span>
  </div>
  <div className="flex items-center gap-2">
    <Button variant="outline" size="sm" className="rounded-full px-4 border-none shadow-sm bg-background hover:bg-muted" onClick={prevPage} disabled={!hasPrev}>
      Previous
    </Button>
    <Button variant="outline" size="sm" className="rounded-full px-4 border-none shadow-sm bg-background hover:bg-muted" onClick={nextPage} disabled={!hasNext}>
      Next
    </Button>
  </div>
</div>
```
