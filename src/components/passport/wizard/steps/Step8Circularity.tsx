"use client";

import { useWizardStore } from "@/stores/wizardStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Wrench, RefreshCw, Package, Recycle, Heart } from "lucide-react";
import type { WizardCircularityAction } from "@/types/wizard";

const CIRCULARITY_TYPES: {
  value: WizardCircularityAction["type"];
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  { value: "repair",    label: "Repair",    icon: Wrench,    description: "Help customers fix damage and extend life" },
  { value: "resale",    label: "Resale",    icon: RefreshCw, description: "Link to a resale platform or marketplace" },
  { value: "take_back", label: "Take-back", icon: Package,   description: "Accept worn product back from customer" },
  { value: "recycle",   label: "Recycle",   icon: Recycle,   description: "Guide customers to a recycling partner" },
  { value: "donate",    label: "Donate",    icon: Heart,     description: "Connect customers to a donation scheme" },
];

export function Step8Circularity() {
  const { step6, setStep6 } = useWizardStore();

  function addAction(type: WizardCircularityAction["type"], label: string) {
    setStep6({
      circularity_actions: [
        ...step6.circularity_actions,
        { type, title: label, description: "", url: "" },
      ],
    });
  }

  function removeAction(idx: number) {
    setStep6({ circularity_actions: step6.circularity_actions.filter((_, i) => i !== idx) });
  }

  function updateAction(idx: number, field: keyof WizardCircularityAction, value: string) {
    setStep6({
      circularity_actions: step6.circularity_actions.map((a, i) =>
        i === idx ? { ...a, [field]: value } : a
      ),
    });
  }

  const activeTypes = new Set(step6.circularity_actions.map((a) => a.type));

  return (
    <div className="space-y-4">
      {/* Action type picker */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-[#8C8C8C] uppercase tracking-wider">Add circularity actions</p>
        <div className="grid grid-cols-1 gap-1.5">
          {CIRCULARITY_TYPES.map(({ value, label, icon: Icon, description }) => {
            const active = activeTypes.has(value);
            return (
              <button
                key={value}
                onClick={() => !active && addAction(value, label)}
                disabled={active}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                  active
                    ? "border-black/20 bg-[#F4F4F2] cursor-default"
                    : "border-dashed border-[#E8E8E6] hover:border-black/30 hover:bg-[#FAFAF8]"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${active ? "bg-black" : "bg-[#F0F0EE]"}`}>
                  <Icon className={`h-4 w-4 ${active ? "text-white" : "text-[#525252]"}`} strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] font-semibold ${active ? "text-black" : "text-[#444]"}`}>{label}</p>
                  <p className="text-[10px] text-[#8C8C8C]">{description}</p>
                </div>
                <span className="text-[10px] font-medium text-[#8C8C8C] shrink-0">
                  {active ? "Added ✓" : "+ Add"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Configured actions */}
      {step6.circularity_actions.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-[#8C8C8C] uppercase tracking-wider">Configure actions</p>
          {step6.circularity_actions.map((action, idx) => {
            const config = CIRCULARITY_TYPES.find((t) => t.value === action.type);
            const Icon = config?.icon ?? RefreshCw;
            return (
              <div key={idx} className="border border-[#E8E8E6] rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-[#525252]" strokeWidth={1.75} />
                    <span className="text-[10px] font-semibold text-[#525252] uppercase tracking-wide capitalize">
                      {action.type.replace("_", " ")}
                    </span>
                  </div>
                  <button
                    onClick={() => removeAction(idx)}
                    className="p-1 rounded hover:bg-red-50 text-[#8C8C8C] hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-[#8C8C8C]">Button label</Label>
                  <Input
                    className="h-8 text-[13px]"
                    placeholder={`e.g. ${action.type === "repair" ? "Get it repaired" : action.type === "resale" ? "Sell this item" : action.type === "take_back" ? "Return for recycling" : action.type === "recycle" ? "Find a recycling point" : "Donate this item"}`}
                    value={action.title}
                    onChange={(e) => updateAction(idx, "title", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-[#8C8C8C]">Link URL</Label>
                  <Input
                    className="h-8 text-[13px]"
                    type="url"
                    placeholder="https://..."
                    value={action.url}
                    onChange={(e) => updateAction(idx, "url", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-[#8C8C8C]">Short description <span className="font-normal text-[#BDBDBB]">Optional</span></Label>
                  <Input
                    className="h-8 text-[13px]"
                    placeholder="Brief description for the consumer"
                    value={action.description}
                    onChange={(e) => updateAction(idx, "description", e.target.value)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* End of life */}
      <div className="border-t border-[#F0F0EE] pt-4 space-y-3">
        <p className="text-[10px] font-semibold text-[#8C8C8C] uppercase tracking-wider">End of life</p>

        <div className="space-y-1">
          <Label className="text-[10px] font-medium text-[#8C8C8C]">Overall recyclability</Label>
          <Select
            value={step6.recyclability || ""}
            onValueChange={(v: string) => setStep6({ recyclability: v as typeof step6.recyclability })}
          >
            <SelectTrigger className="h-8 text-[13px]">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recyclable" className="text-[13px]">Recyclable</SelectItem>
              <SelectItem value="partially_recyclable" className="text-[13px]">Partially recyclable</SelectItem>
              <SelectItem value="not_recyclable" className="text-[13px]">Not currently recyclable</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] font-medium text-[#8C8C8C]">Recycling instructions <span className="font-normal text-[#BDBDBB]">Optional</span></Label>
          <Textarea
            className="text-[13px] resize-none"
            rows={2}
            placeholder="e.g. Remove all metal hardware before composting the natural fibre shell"
            value={step6.recycling_instructions}
            onChange={(e) => setStep6({ recycling_instructions: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] font-medium text-[#8C8C8C]">End of life guidance <span className="font-normal text-[#BDBDBB]">Optional</span></Label>
          <Textarea
            className="text-[13px] resize-none"
            rows={2}
            placeholder="What should a customer do when this product reaches end of life?"
            value={step6.end_of_life_guidance}
            onChange={(e) => setStep6({ end_of_life_guidance: e.target.value })}
          />
        </div>
      </div>

      {/* Quick add custom */}
      <Button variant="outline" size="sm" onClick={() => addAction("repair", "Repair")} className="w-full h-8 text-[12px]">
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Add another action
      </Button>
    </div>
  );
}
