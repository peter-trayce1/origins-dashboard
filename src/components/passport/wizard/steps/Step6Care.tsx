"use client";

import { useWizardStore } from "@/stores/wizardStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type { WizardCareInstruction } from "@/types/wizard";

const CARE_TYPES = [
  { value: "wash",      label: "Washing" },
  { value: "dry",       label: "Drying" },
  { value: "iron",      label: "Ironing" },
  { value: "bleach",    label: "Bleaching" },
  { value: "dry_clean", label: "Dry cleaning" },
  { value: "storage",   label: "Storage" },
  { value: "warranty",  label: "Warranty" },
];

const CARE_CHIPS: { category: string; items: { type: string; instruction: string }[] }[] = [
  {
    category: "Washing",
    items: [
      { type: "wash", instruction: "Machine wash at 30°C gentle cycle" },
      { type: "wash", instruction: "Machine wash at 40°C" },
      { type: "wash", instruction: "Hand wash in cold water only" },
      { type: "wash", instruction: "Do not wash" },
    ],
  },
  {
    category: "Drying",
    items: [
      { type: "dry", instruction: "Line dry in shade" },
      { type: "dry", instruction: "Lay flat to dry" },
      { type: "dry", instruction: "Tumble dry low heat" },
      { type: "dry", instruction: "Do not tumble dry" },
    ],
  },
  {
    category: "Ironing & professional",
    items: [
      { type: "iron",      instruction: "Iron on low heat" },
      { type: "iron",      instruction: "Iron on medium heat with steam" },
      { type: "iron",      instruction: "Do not iron" },
      { type: "dry_clean", instruction: "Dry clean only" },
      { type: "dry_clean", instruction: "Do not dry clean" },
    ],
  },
];

export function Step6Care() {
  const { step6, setStep6 } = useWizardStore();

  function addCare() {
    setStep6({
      care_instructions: [...step6.care_instructions, { type: "wash", instruction: "", icon_code: "" }],
    });
  }

  function removeCare(idx: number) {
    setStep6({ care_instructions: step6.care_instructions.filter((_, i) => i !== idx) });
  }

  function updateCare(idx: number, field: keyof WizardCareInstruction, value: string) {
    setStep6({
      care_instructions: step6.care_instructions.map((c, i) => i === idx ? { ...c, [field]: value } : c),
    });
  }

  function addQuickCare(type: string, instruction: string) {
    const alreadyAdded = step6.care_instructions.some((c) => c.instruction === instruction);
    if (alreadyAdded) return;
    setStep6({
      care_instructions: [...step6.care_instructions, { type, instruction, icon_code: "" }],
    });
  }

  return (
    <div className="space-y-4">
      {/* Quick add — grouped by category */}
      <div className="space-y-3">
        {CARE_CHIPS.map((group) => (
          <div key={group.category}>
            <p className="text-[10px] font-semibold text-[#8C8C8C] uppercase tracking-wider mb-1.5">{group.category}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map((c) => {
                const added = step6.care_instructions.some((i) => i.instruction === c.instruction);
                return (
                  <button
                    key={c.instruction}
                    onClick={() => addQuickCare(c.type, c.instruction)}
                    disabled={added}
                    className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                      added
                        ? "border-black/20 bg-[#F4F4F2] text-[#525252] cursor-default"
                        : "border-[#E8E8E6] text-[#525252] hover:border-black/30 hover:text-black"
                    }`}
                  >
                    {added ? "✓ " : "+ "}{c.instruction}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Instruction list */}
      <div className="space-y-2">
        {step6.care_instructions.length === 0 && (
          <p className="text-[11px] text-[#8C8C8C] text-center py-4">
            Use the quick-add buttons above or add a custom instruction below
          </p>
        )}
        {step6.care_instructions.map((care, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Select
              value={care.type}
              onValueChange={(v: string) => updateCare(idx, "type", v ?? "wash")}
            >
              <SelectTrigger className="w-32 h-8 text-[12px] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-[12px]">{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="h-8 text-[13px] flex-1"
              placeholder="Instruction text"
              value={care.instruction}
              onChange={(e) => updateCare(idx, "instruction", e.target.value)}
            />
            <button
              onClick={() => removeCare(idx)}
              className="p-1.5 rounded hover:bg-red-50 text-[#8C8C8C] hover:text-red-600 transition-colors shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addCare} className="w-full h-8 text-[12px]">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add custom care instruction
        </Button>
      </div>

    </div>
  );
}
