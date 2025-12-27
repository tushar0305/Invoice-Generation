# Design System: Buttons

Buttons are our primary interaction points. They must be distinct and follow a hierarchy.

## Variants

### 1. Primary (Liquid Gold)
**Class**: `.btn-liquid-gold` or `Button` (default variant in some contexts if styled).
**Usage**: The main "Call to Action" on a page (e.g., "Create Invoice", "Save").
**Style**: Gradient Gold background, White/Dark text, slight shadow.

### 2. Outline (Royal Outline)
**Class**: `.btn-royal-outline` or `variant="outline"`.
**Usage**: Secondary actions (e.g., "Export", "Filter", "Cancel").
**Style**: Transparent background, Gold border, Gold text.

### 3. Ghost / Icon
**Class**: `variant="ghost"`.
**Usage**: Tertiary actions, icon-only buttons (Trash, Edit in rows).
**Style**: Transparent, gray text -> colored background on hover.

### 4. Destructive
**Class**: `variant="destructive"`.
**Usage**: High-risk actions (Delete).
**Style**: Red background, White text.

## Button Sizes

| Size | Height | Padding | Usage |
| :--- | :--- | :--- | :--- |
| `sm` | 36px (`h-9`) | `px-3` | Table actions, dense headers |
| `default` | 40px (`h-10`) | `px-4` | Details page actions, forms |
| `icon` | 36-40px | Square | Icon-only buttons |

## Code Example

```tsx
import { Button } from "@/components/ui/button"

// Primary
<Button>Create Invoice</Button>

// Secondary
<Button variant="outline">Cancel</Button>

// Icon Action
<Button variant="ghost" size="icon">
  <Trash2 className="h-4 w-4 text-destructive" />
</Button>
```
