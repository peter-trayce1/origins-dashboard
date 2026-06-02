import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Figma: white bg, #cccccc border, r=8, DM Mono, focus → #333333 border
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-[#cccccc] bg-white px-3 py-2",
        "font-mono text-sm text-[#333333] placeholder:text-[#8b8b8b] placeholder:font-light",
        "transition-colors duration-100 outline-none",
        "focus-visible:border-[#333333] focus-visible:ring-0",
        "disabled:cursor-not-allowed disabled:bg-[#e1e1e1] disabled:text-[#cccccc]",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/15",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
