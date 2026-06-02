"use client";

import {
  Package, Layers, MapPin, Leaf, ShieldCheck,
  Heart, BookOpen, Recycle, HelpCircle,
} from "lucide-react";

export type BuilderSection =
  | "product" | "materials" | "supply_chain" | "impact"
  | "certifications" | "care" | "story" | "circularity";

const SECTIONS: { id: BuilderSection; label: string; icon: React.ElementType }[] = [
  { id: "product",        label: "Product",        icon: Package },
  { id: "materials",      label: "Materials",      icon: Layers },
  { id: "care",           label: "Care",           icon: Heart },
  { id: "impact",         label: "Impact",         icon: Leaf },
  { id: "certifications", label: "Certifications", icon: ShieldCheck },
  { id: "supply_chain",   label: "Supply Chain",   icon: MapPin },
  { id: "story",          label: "Story",          icon: BookOpen },
  { id: "circularity",    label: "Circularity",    icon: Recycle },
];

interface Props {
  active: BuilderSection;
  onChange: (s: BuilderSection) => void;
  isDirty?: boolean;
}

export function BuilderNavSidebar({ active, onChange, isDirty }: Props) {
  return (
    <div className="w-[72px] shrink-0 bg-white border-r border-[#EBEBEA] flex flex-col items-stretch py-2 overflow-y-auto">
      {SECTIONS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`relative flex flex-col items-center gap-1.5 py-3.5 px-1 transition-colors ${
              isActive
                ? "text-black bg-[#F7F6F4]"
                : "text-[#8C8C8C] hover:text-[#444] hover:bg-[#FAFAF8]"
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-black rounded-r-full" />
            )}
            {/* Dirty indicator — shown on active section when unsaved */}
            {isActive && isDirty && (
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
            <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2 : 1.5} />
            <span className="text-[8.5px] font-medium leading-tight text-center tracking-wide">
              {label}
            </span>
          </button>
        );
      })}

      <div className="mt-auto pt-2 border-t border-[#EBEBEA]">
        <button className="w-full flex flex-col items-center gap-1.5 py-3.5 px-1 text-[#BDBDBB] hover:text-[#8C8C8C] transition-colors">
          <HelpCircle className="h-[18px] w-[18px]" strokeWidth={1.5} />
          <span className="text-[8.5px] font-medium tracking-wide">Help</span>
        </button>
      </div>
    </div>
  );
}
