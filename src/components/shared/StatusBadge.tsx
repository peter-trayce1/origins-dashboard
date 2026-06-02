import { cn } from "@/lib/utils";

type Status = "draft" | "published" | "archived";

const statusConfig: Record<Status, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-[#F4F4F3] text-[#525252] border border-[#E8E8E6]",
  },
  published: {
    label: "Published",
    className: "bg-green-50 text-green-700 border border-green-200",
  },
  archived: {
    label: "Archived",
    className: "bg-[#F4F4F3] text-[#8C8C8C] border border-[#E8E8E6]",
  },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.draft;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium leading-5",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
