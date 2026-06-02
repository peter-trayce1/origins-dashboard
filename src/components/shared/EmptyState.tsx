import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon | ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  const iconContent = typeof icon === "function"
    ? (() => { const Icon = icon as LucideIcon; return <Icon className="h-6 w-6 text-[#8C8C8C]" />; })()
    : icon;

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="w-12 h-12 rounded-xl bg-[#F4F4F3] flex items-center justify-center mb-4">
        {iconContent}
      </div>
      <h3 className="text-sm font-semibold text-black mb-1">{title}</h3>
      <p className="text-sm text-[#525252] max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
