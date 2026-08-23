import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-emerald-900 text-white hover:bg-emerald-800",
        secondary:
          "border-transparent bg-emerald-100 text-emerald-900 hover:bg-emerald-200",
        destructive:
          "border-transparent bg-red-600 text-white hover:bg-red-500",
        outline: "text-foreground border-emerald-800/30",
        gold: "border-amber-400 bg-amber-50 text-amber-900 font-bold",
        hec: "border-emerald-600 bg-emerald-50 text-emerald-900 font-medium",
        usaid: "border-blue-600 bg-blue-50 text-blue-900 font-medium"
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

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
