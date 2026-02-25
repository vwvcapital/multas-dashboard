import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/10 text-primary dark:bg-primary/20",
        secondary:
          "border-transparent bg-slate-100 text-slate-600 dark:bg-neutral-900 dark:text-neutral-300",
        destructive:
          "border-transparent bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
        success:
          "border-transparent bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
        warning:
          "border-transparent bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
        purple:
          "border-transparent bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
        cyan:
          "border-transparent bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
        blue:
          "border-transparent bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
        outline: "border-2 border-slate-200 text-slate-600 bg-white dark:border-neutral-700 dark:text-neutral-300 dark:bg-neutral-950",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
