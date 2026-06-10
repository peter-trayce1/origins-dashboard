"use client";

import { useEffect, useRef, useState } from "react";
import { useWizardStore } from "@/stores/wizardStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react";
import type { WizardCareInstruction } from "@/types/wizard";
import { CareSymbolIcon } from "@/components/shared/care-icons";
import { useBrandMemory } from "@/hooks/useBrandMemory";

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
      { type: "iron",      instruction: "Do not iron over print" },
      { type: "dry_clean", instruction: "Dry clean only" },
      { type: "dry_clean", instruction: "Do not dry clean" },
    ],
  },
];

// ── Care instruction memory (server-side, scoped per brand) ──────────────────
// Stored in the database keyed by brand_id, so it is strictly isolated per
// account and follows the brand across devices.

const PREDEFINED_INSTRUCTIONS = new Set(
  CARE_CHIPS.flatMap((g) => g.items.map((i) => i.instruction))
);

type CareMemoryEntry = { type: string; instruction: string };

function useCareMemory() {
  const { items: memory, persist } = useBrandMemory<CareMemoryEntry>("care_instructions");

  function saveInstruction(entry: CareMemoryEntry) {
    if (!entry.instruction.trim() || PREDEFINED_INSTRUCTIONS.has(entry.instruction)) return;
    persist((prev) => {
      const deduped = prev.filter((m) => m.instruction !== entry.instruction);
      return [entry, ...deduped].slice(0, 30);
    });
  }

  function deleteFromMemory(instruction: string) {
    persist((prev) => prev.filter((m) => m.instruction !== instruction));
  }

  return { memory, saveInstruction, deleteFromMemory };
}

// ── Main component ────────────────────────────────────────────────────────────

export function Step6Care() {
  const { step6, setStep6 } = useWizardStore();
  const { memory, saveInstruction, deleteFromMemory } = useCareMemory();

  // 20-second debounce: reset the timer on every change to care_instructions.
  // When the timer fires (20s after the last keystroke) read fresh state from the
  // store so we always get the complete, final instruction text — never partial strings.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const instructions = useWizardStore.getState().step6.care_instructions;
      instructions.forEach((c) => {
        if (c.instruction.trim() && !PREDEFINED_INSTRUCTIONS.has(c.instruction)) {
          saveInstruction({ type: c.type, instruction: c.instruction });
        }
      });
    }, 20000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
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
                <div
                  key={i}
                  className={`flex items-center gap-1 text-[10px] pl-2 pr-1 py-1 rounded-full border transition-colors ${
                    added
                      ? "border-black/20 bg-[#F4F4F2] text-[#525252]"
                      : "border-[#E8E8E6] text-[#525252]"
                  }`}
                >
                  {/* Click the label/icon area to add */}
                  <button
                    type="button"
                    onClick={() => addQuickCare(m.type, m.instruction)}
                    disabled={added}
                    className="flex items-center gap-1.5 disabled:cursor-default hover:text-black transition-colors"
                  >
                    <CareSymbolIcon type={m.type} className="w-3 h-3 shrink-0" />
                    {added ? "✓ " : ""}{m.instruction}
                  </button>
                  {/* Delete from memory */}
                  <button
                    type="button"
                    onClick={() => deleteFromMemory(m.instruction)}
                    className="ml-0.5 p-0.5 rounded-full text-[#BDBDBB] hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                    aria-label="Remove from previously used"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
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
