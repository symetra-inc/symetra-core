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
          "bg-[#FAFAFA] text-[#0A0A0A] shadow-sm hover:bg-[#FAFAFA]/90",
        destructive:
          "bg-red-900 text-[#FAFAFA] shadow-sm hover:bg-red-900/90",
        outline:
          "border border-[#71717A]/50 bg-transparent shadow-sm hover:bg-[#71717A]/10 hover:text-[#FAFAFA]",
        secondary:
          "bg-[#27272A] text-[#FAFAFA] shadow-sm hover:bg-[#27272A]/80",
        ghost: 
          "hover:bg-[#27272A]/50 hover:text-[#FAFAFA]",
        link: 
          "text-[#FAFAFA] underline-offset-4 hover:underline",
        // A VARIANTE DE CONVERSÃO DO CMO
        gold: 
          "bg-[#A38A5E] text-[#FAFAFA] shadow-[0_4px_14px_0_rgba(163,138,94,0.2)] hover:bg-[#A38A5E]/90",
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