import { cn } from "@/lib/utils";
import type { ConfidenceLevel } from "@/types/passport";

const config: Record<ConfidenceLevel, { label: string; className: string }> = {
  verified: {
    label: "Verified",
    className: "bg-green-50 text-green-700 border border-green-200",
  },
  brand_declared: {
    label: "Brand declared",
    className: "bg-blue-50 text-blue-800 border border-blue-200",
  },
  supplier_declared: {
    label: "Supplier declared",
    className: "bg-amber-50 text-amber-800 border border-amber-200",
  },
  ai_suggested: {
    label: "AI suggested",
    className: "bg-purple-50 text-purple-800 border border-purple-200",
  },
  missing: {
    label: "Missing",
    className: "bg-red-50 text-red-700 border border-red-200",
  },
};

interface ConfidenceTagProps {
  level: ConfidenceLevel;
  className?: string;
}

export function ConfidenceTag({ level, className }: ConfidenceTagProps) {
  const c = config[level] ?? config.missing;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold leading-5 uppercase tracking-wide",
        c.className,
        className
      )}
    >
      {c.label}
    </span>
  );
}
