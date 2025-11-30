import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2",
          // Typography
          "text-sm placeholder:text-muted-foreground",
          // Focus state - Premium
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background focus:border-primary",
          // Disabled state - Clear visual indicator
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted/50",
          // Transitions
          "transition-all duration-200",
          // File input specific
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
