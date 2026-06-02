"use client";

import { useRef, useEffect } from "react";
import type { BuilderSection } from "./BuilderNavSidebar";
import { useWizardStore } from "@/stores/wizardStore";
import { Step1ProductInfo } from "@/components/passport/wizard/steps/Step1ProductInfo";
import { Step2Materials } from "@/components/passport/wizard/steps/Step2Materials";
import { Step3SupplyChain } from "@/components/passport/wizard/steps/Step3SupplyChain";
import { Step4Sustainability } from "@/components/passport/wizard/steps/Step4Sustainability";
import { Step5Certifications } from "@/components/passport/wizard/steps/Step5Certifications";
import { Step6Care } from "@/components/passport/wizard/steps/Step6Care";
import { Step7Story } from "@/components/passport/wizard/steps/Step7Story";
import { Step8Circularity } from "@/components/passport/wizard/steps/Step8Circularity";

const SECTION_META: Record<BuilderSection, { title: string; description: string }> = {
  product:        { title: "Product information",      description: "Identity, images, and core metadata." },
  materials:      { title: "Materials & composition",  description: "What is this product made from?" },
  supply_chain:   { title: "Supply chain",             description: "Where was it made? Add each step of the journey." },
  impact:         { title: "Sustainability & impact",  description: "Environmental metrics and substantiated claims." },
  certifications: { title: "Certifications",           description: "Third-party certifications and compliance records." },
  care:           { title: "Care & durability",        description: "Care instructions and repairability information." },
  story:          { title: "Brand story",              description: "The narrative behind this product." },
  circularity:    { title: "Circularity & end of life", description: "Repair, resale, take-back, and recycling pathways." },
};

// Per-section completion score (0–100)
function useSectionScore(section: BuilderSection): number {
  return useWizardStore((s) => {
    switch (section) {
      case "product": {
        let pts = 0;
        if (s.step1.product_name)        pts += 30;
        if (s.step1.primary_image_url)   pts += 25;
        if (s.step1.product_description) pts += 20;
        if (s.step1.category)            pts += 10;
        if (s.step1.country_of_origin)   pts += 15;
        return pts;
      }
      case "materials": {
        const total = s.step2.materials.reduce((sum, m) => sum + (Number(m.percentage) || 0), 0);
        if (!s.step2.materials.length) return 0;
        let pts = Math.min(60, s.step2.materials.length * 20);
        if (total === 100) pts += 40;
        else if (total > 0) pts += 20;
        return Math.min(pts, 100);
      }
      case "supply_chain": {
        if (!s.step3.facilities.length) return 0;
        return Math.min(s.step3.facilities.length * 35, 100);
      }
      case "impact": {
        let pts = 0;
        if (s.step4.sustainability_summary)       pts += 30;
        if (s.step4.carbon_footprint_kg !== "")   pts += 25;
        if (s.step4.water_usage_litres !== "")    pts += 20;
        if (s.step4.sustainability_claims.length) pts += 25;
        return Math.min(pts, 100);
      }
      case "certifications":
        return s.step5.certifications.length ? Math.min(s.step5.certifications.length * 40, 100) : 0;
      case "care":
        return s.step6.care_instructions.length ? Math.min(s.step6.care_instructions.length * 25, 100) : 0;
      case "story": {
        let pts = 0;
        if (s.step7.product_story)          pts += 50;
        if (s.step7.maker_story)            pts += 30;
        if (s.step7.brand_impact_statement) pts += 20;
        return Math.min(pts, 100);
      }
      case "circularity":
        return s.step6.circularity_actions.length ? Math.min(s.step6.circularity_actions.length * 30, 100) : 0;
      default:
        return 0;
    }
  });
}

interface Props {
  activeSection: BuilderSection;
}

export function BuilderLeftPanel({ activeSection }: Props) {
  const meta = SECTION_META[activeSection];
  const score = useSectionScore(activeSection);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset scroll position whenever section changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [activeSection]);

  return (
    <div className="w-[340px] shrink-0 bg-white border-r border-[#EBEBEA] flex flex-col overflow-hidden">
      {/* Section header */}
      <div className="shrink-0 px-5 pt-5 pb-4 border-b border-[#EBEBEA]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-[14px] font-semibold text-black leading-snug">{meta.title}</h2>
            <p className="text-[11px] text-[#8C8C8C] mt-0.5 leading-relaxed">{meta.description}</p>
          </div>
          <span className={`text-[10px] font-semibold shrink-0 mt-0.5 ${
            score === 100 ? "text-emerald-700" : score > 0 ? "text-[#525252]" : "text-[#BDBDBB]"
          }`}>
            {score}%
          </span>
        </div>
        {/* Section completion bar */}
        <div className="mt-2.5 h-1 rounded-full bg-[#F0F0EE] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${score === 100 ? "bg-emerald-500" : "bg-black"}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Form content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
        {activeSection === "product"        && <Step1ProductInfo />}
        {activeSection === "materials"      && <Step2Materials />}
        {activeSection === "supply_chain"   && <Step3SupplyChain />}
        {activeSection === "impact"         && <Step4Sustainability />}
        {activeSection === "certifications" && <Step5Certifications />}
        {activeSection === "care"           && <Step6Care />}
        {activeSection === "story"          && <Step7Story />}
        {activeSection === "circularity"    && <Step8Circularity />}
      </div>
    </div>
  );
}
