// Standard textile care symbol icons — ISO 3758 / GINETEX style

export const CARE_LABELS: Record<string, string> = {
  wash:      "Wash",
  dry:       "Dry",
  iron:      "Iron",
  bleach:    "Bleach",
  dry_clean: "Dry clean",
  storage:   "Storage",
  repair:    "Repair",
  warranty:  "Warranty",
};

interface CareSymbolIconProps {
  type: string;
  active?: boolean;
  className?: string;
}

export function CareSymbolIcon({ type, active = false, className = "w-5 h-5" }: CareSymbolIconProps) {
  const stroke = active ? "white" : "#444444";
  const shared = {
    fill: "none",
    stroke,
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  switch (type) {
    case "wash":
      // Washtub — open-top basin with wavy waterline
      return (
        <svg viewBox="0 0 20 20" {...shared}>
          <path d="M3 6h14v8a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" />
          <path d="M6 12c1-1.5 2-1.5 3 0s2 1.5 3 0 2-1.5 3 0" />
          <path d="M10 6V4" />
        </svg>
      );

    case "dry":
      // Tumble dry — square with circle (drum)
      return (
        <svg viewBox="0 0 20 20" {...shared}>
          <rect x="2" y="2" width="16" height="16" rx="2" stroke={stroke} strokeWidth={1.5} />
          <circle cx="10" cy="10" r="5" />
        </svg>
      );

    case "iron":
      // Iron side-profile — angled nose, flat back, handle on top-right
      return (
        <svg viewBox="0 0 20 16" {...shared}>
          <path d="M1 13 L5 8 h13 v5 Z" />
          <path d="M13 8 V5 h5 v3" />
        </svg>
      );

    case "bleach":
      // Triangle — bleach / chlorine symbol
      return (
        <svg viewBox="0 0 20 18" {...shared}>
          <path d="M10 2 L1 17 h18 Z" />
        </svg>
      );

    case "dry_clean":
      // Circle — professional dry cleaning
      return (
        <svg viewBox="0 0 20 20" {...shared}>
          <circle cx="10" cy="10" r="8" />
        </svg>
      );

    case "storage":
      // Clothes hanger — hang to store
      return (
        <svg viewBox="0 0 20 18" {...shared}>
          <path d="M10 5 C10 3 11 2 12.5 2 S15 3 14.5 4.5 Q14 6 10 7" />
          <path d="M10 7 L2 15 h16 Z" />
        </svg>
      );

    case "repair":
      // Scissors — repair / tailoring
      return (
        <svg viewBox="0 0 20 20" {...shared}>
          <circle cx="5.5" cy="5.5" r="2.5" />
          <circle cx="5.5" cy="14.5" r="2.5" />
          <path d="M8 8 L18 4" />
          <path d="M8 12 L18 16" />
          <path d="M10.5 10 L8 10" />
        </svg>
      );

    case "warranty":
      // Shield with check — guarantee / warranty
      return (
        <svg viewBox="0 0 20 22" {...shared}>
          <path d="M10 1 L2 5 v6 c0 4.5 3.4 8.7 8 10 4.6-1.3 8-5.5 8-10 V5 Z" />
          <path d="M7 11 l2 2 4-4" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 20 20" {...shared}>
          <circle cx="10" cy="10" r="8" />
          <path d="M10 7 v4" />
          <circle cx="10" cy="14" r="0.75" fill={stroke} stroke="none" />
        </svg>
      );
  }
}
