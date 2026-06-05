"use client";

import { useEffect, useRef, useState } from "react";
import { useWizardStore } from "@/stores/wizardStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import type { WizardCareInstruction } from "@/types/wizard";
import { CareSymbolIcon } from "@/components/shared/care-icons";

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

// ── Care instruction memory (localStorage, custom instructions only) ──────────

const CARE_MEMORY_KEY = "origins_care_memory_v1";

const PREDEFINED_INSTRUCTIONS = new Set(
  CARE_CHIPS.flatMap((g) => g.items.map((i) => i.instruction))
);

type CareMemoryEntry = { type: string; instruction: string };

function useCareMemory() {
  const [memory, setMemory] = useState<CareMemoryEntry[]>([]);
  // Track whether the initial localStorage load has completed
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CARE_MEMORY_KEY);
      if (raw) setMemory(JSON.parse(raw));
    } catch { /* ignore */ }
    loaded.current = true;
  }, []);

  function saveInstruction(entry: CareMemoryEntry) {
    if (!entry.instruction.trim() || PREDEFINED_INSTRUCTIONS.has(entry.instruction)) return;
    setMemory((prev) => {
      const deduped = prev.filter((m) => m.instruction !== entry.instruction);
      const updated = [entry, ...deduped].slice(0, 30);
      try { localStorage.setItem(CARE_MEMORY_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }

  return { memory, saveInstruction, loaded };
}

// ── Main component ────────────────────────────────────────────────────────────

export function Step6Care() {
  const { step6, setStep6 } = useWizardStore();
  const { memory, saveInstruction, loaded } = useCareMemory();

  // Persist custom instructions to memory whenever the list changes.
  // This catches saves that happen without a blur (e.g. navigating away,
  // clicking a quick-chip after typing, or the wizard auto-saving).
  // `loaded.current` guards against running before localStorage is read.
  useEffect(() => {
    if (!loaded.current) return;
    step6.care_instructions.forEach((c) => {
      if (c.instruction.trim() && !PREDEFINED_INSTRUCTIONS.has(c.instruction)) {
        saveInstruction({ type: c.type, instruction: c.instruction });
      }
    });
    // saveInstruction is stable (uses setMemory functional form); omitting from deps is safe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step6.care_instructions]);

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

  function moveUp(idx: number) {
    if (idx === 0) return;
    const list = [...step6.care_instructions];
    [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
    setStep6({ care_instructions: list });
  }

  function moveDown(idx: number) {
    if (idx === step6.care_instructions.length - 1) return;
    const list = [...step6.care_instructions];
    [list[idx], list[idx + 1]] = [list[idx + 1], list[idx]];
    setStep6({ care_instructions: list });
  }

  function addQuickCare(type: string, instruction: string) {
    if (step6.care_instructions.some((c) => c.instruction === instruction)) return;
    setStep6({
      care_instructions: [...step6.care_instructions, { type, instruction, icon_code: "" }],
    });
  }

  const total = step6.care_instructions.length;

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

      {/* Previously used custom instructions */}
      {memory.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-[#8C8C8C] uppercase tracking-wider mb-1.5">Previously used</p>
          <div className="flex flex-wrap gap-1.5">
            {memory.map((m, i) => {
              const added = step6.care_instructions.some((c) => c.instruction === m.instruction);
              return (
                <button
                  key={i}
                  onClick={() => addQuickCare(m.type, m.instruction)}
                  disabled={added}
                  className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                    added
                      ? "border-black/20 bg-[#F4F4F2] text-[#525252] cursor-default"
                      : "border-[#E8E8E6] text-[#525252] hover:border-black/30 hover:text-black"
                  }`}
                >
                  <CareSymbolIcon type={m.type} className="w-3 h-3" />
                  {added ? "✓ " : ""}{m.instruction}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Instruction list */}
      <div className="space-y-2">
        {total === 0 && (
          <p className="text-[11px] text-[#8C8C8C] text-center py-4">
            Use the quick-add buttons above or add a custom instruction below
          </p>
        )}
        {step6.care_instructions.map((care, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {/* Reorder */}
            <div className="flex flex-col shrink-0">
              <button
                type="button"
                onClick={() => moveUp(idx)}
                disabled={idx === 0}
                className="p-0.5 text-[#BDBDBB] hover:text-[#525252] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                aria-label="Move up"
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => moveDown(idx)}
                disabled={idx === total - 1}
                className="p-0.5 text-[#BDBDBB] hover:text-[#525252] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                aria-label="Move down"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>

            <Select
              value={care.type}
              onValueChange={(v) => updateCare(idx, "type", v ?? "wash")}
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
