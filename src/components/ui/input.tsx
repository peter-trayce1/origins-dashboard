import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // Figma: white bg, #cccccc border, r=8, DM Mono font
        "h-9 w-full min-w-0 rounded-lg border border-[#cccccc] bg-white px-3 py-1",
        "font-mono text-sm text-[#333333]",
        "placeholder:text-[#8b8b8b] placeholder:font-light",
        "transition-colors duration-100 outline-none",
        // Figma focus: border darkens to #333333
        "focus-visible:border-[#333333] focus-visible:ring-0",
        // Figma disabled: #e1e1e1 bg, #cccccc border, muted text
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#e1e1e1] disabled:text-[#cccccc]",
        // Figma error: #e74c3c border
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/15",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      {...props}
    />
  )
}

export { Input }
