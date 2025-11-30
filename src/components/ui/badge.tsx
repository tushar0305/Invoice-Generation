import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        // Premium status badges with subtle backgrounds
        success:
          "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20",
        warning:
          "border-yellow-500/20 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20",
        error:
          "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20",
        info:
          "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20",
        neutral:
          "border-gray-500/20 bg-gray-500/10 text-gray-700 dark:text-gray-400 hover:bg-gray-500/20",
      },
      size: {
        sm: "h-5 px-2 text-[10px]",      // 20px height, extra small text
        md: "h-6 px-2.5 text-xs",         // 24px height - DEFAULT
        lg: "h-7 px-3 text-sm",           // 28px height
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
