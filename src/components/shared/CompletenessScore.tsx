import { cn } from "@/lib/utils";

interface CompletenessScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

function getColour(score: number) {
  if (score >= 90) return { stroke: "#166534", text: "text-green-700" };
  if (score >= 70) return { stroke: "#1e3a5f", text: "text-blue-800" };
  if (score >= 40) return { stroke: "#713f12", text: "text-amber-800" };
  return { stroke: "#991b1b", text: "text-red-700" };
}

export function CompletenessScore({
  score,
  size = "md",
  showLabel = false,
  className,
}: CompletenessScoreProps) {
  const { stroke, text } = getColour(score);
  const radius = size === "sm" ? 14 : size === "lg" ? 28 : 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const dim = radius * 2 + 8;
  const fontSize = size === "sm" ? "text-[9px]" : size === "lg" ? "text-base" : "text-xs";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} className="-rotate-90">
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="#E8E8E6"
          strokeWidth="3"
        />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <span className={cn("font-semibold tabular-nums", text, fontSize)}>
        {score}%
      </span>
      {showLabel && (
        <span className="text-xs text-[#525252]">
          {score >= 90
            ? "Best-in-class"
            : score >= 70
            ? "Ready to publish"
            : score >= 40
            ? "Getting there"
            : "Needs more info"}
        </span>
      )}
    </div>
  );
}
