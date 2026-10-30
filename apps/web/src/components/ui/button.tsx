import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#71717A] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-linen)] text-[var(--color-ink)] shadow-sm hover:bg-[var(--color-linen)]/90",
        destructive:
          "bg-red-900 text-[var(--color-linen)] shadow-sm hover:bg-red-900/90",
        outline:
          "border border-[#71717A]/50 bg-transparent shadow-sm hover:bg-[#71717A]/10 hover:text-[var(--color-linen)]",
        secondary:
          "bg-[var(--color-ink3)] text-[var(--color-linen)] shadow-sm hover:bg-[var(--color-ink3)]/80",
        ghost: 
          "hover:bg-[var(--color-ink3)]/50 hover:text-[var(--color-linen)]",
        link: 
          "text-[var(--color-linen)] underline-offset-4 hover:underline",
        // A VARIANTE DE CONVERSÃO DO CMO
        gold: 
          "bg-[#A38A5E] text-[var(--color-linen)] shadow-[0_4px_14px_0_rgba(163,138,94,0.2)] hover:bg-[#A38A5E]/90",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-sm px-3 text-xs",
        lg: "h-11 rounded-sm px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }