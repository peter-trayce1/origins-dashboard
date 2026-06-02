import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base — DM Mono font, 8px radius, transitions matching Figma
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-1.5",
    "rounded-lg border border-transparent bg-clip-padding",
    "font-mono text-sm font-medium whitespace-nowrap",
    "transition-all duration-100 outline-none select-none",
    "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1",
    "active:not-aria-[haspopup]:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary — #0e6dea fill, white text; hover #5698ee; disabled via opacity
        default:
          "bg-primary text-primary-foreground hover:bg-[#5698ee] active:bg-[#0a5bc4]",
        // Outline — #cccccc border default, #333333 on hover; transparent fill
        outline:
          "border-[#cccccc] bg-transparent text-[#333333] hover:border-[#333333] hover:text-[#333333] disabled:border-[#e1e1e1] disabled:text-[#cccccc]",
        // Ghost — no border/fill; hover shows #e6f0fd bg
        ghost:
          "bg-transparent text-[#333333] hover:bg-[#e6f0fd] hover:text-[#333333]",
        // Secondary — light grey fill
        secondary:
          "bg-[#f4f4f4] text-[#333333] hover:bg-[#e1e1e1]",
        // Destructive — red
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-[#c0392b] active:bg-[#a93226]",
        link: "text-primary underline-offset-4 hover:underline font-sans",
      },
      size: {
        // Figma: Small = 36px h, Large = 52px h; default maps to "small compact"
        default: "h-9 px-4 text-sm",
        sm:      "h-8 px-3 text-xs rounded-lg",
        lg:      "h-13 px-6 text-base",
        xs:      "h-6 px-2 text-xs rounded-md",
        icon:    "size-9",
        "icon-sm": "size-8 rounded-lg",
        "icon-xs": "size-6 rounded-md",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
