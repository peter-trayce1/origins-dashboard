import { cn } from "@/lib/utils";

interface WizardProgressProps {
  steps: string[];
  currentStep: number;
}

export function WizardProgress({ steps, currentStep }: WizardProgressProps) {
  return (
    <div className="relative">
      {/* Track */}
      <div className="absolute top-3.5 left-0 right-0 h-px bg-[#E8E8E6] -z-0" />

      <ol className="relative flex justify-between">
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <li
              key={step}
              className="flex flex-col items-center gap-1.5 relative"
              style={{ width: `${100 / steps.length}%` }}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 bg-white z-10 transition-all duration-200",
                  isCompleted
                    ? "border-black bg-black text-white"
                    : isCurrent
                    ? "border-black text-black"
                    : "border-[#E8E8E6] text-[#8C8C8C]"
                )}
              >
                {isCompleted ? "✓" : stepNum}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium text-center leading-tight hidden sm:block",
                  isCurrent
                    ? "text-black"
                    : isCompleted
                    ? "text-[#525252]"
                    : "text-[#8C8C8C]"
                )}
              >
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
