"use client";

import { useWizardStore } from "@/stores/wizardStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import type { WizardMaterial } from "@/types/wizard";

const CONFIDENCE_LEVELS = [
  { value: "brand_declared",    label: "Brand declared" },
  { value: "supplier_declared", label: "Supplier declared" },
  { value: "verified",          label: "Third-party verified" },
] as const;

const COMMON_MATERIALS = [
  // Natural cellulosic
  "Cotton", "Organic Cotton", "Recycled Cotton", "Denim", "Linen", "Hemp",
  "Ramie", "Jute", "Bamboo", "Cork",
  // Protein fibres
  "Wool", "Merino Wool", "Recycled Wool", "Cashmere", "Mohair", "Alpaca",
  "Angora", "Silk", "Down", "Leather", "Suede",
  // Man-made cellulosic
  "Viscose", "Modal", "Lyocell (Tencel)", "Cupro", "Acetate",
  // Synthetic
  "Polyester", "Recycled Polyester", "Nylon", "Recycled Nylon", "Econyl",
  "Acrylic", "Elastane", "Spandex", "Polypropylene", "Polylactic Acid (PLA)",
  // Alternative / vegan
  "Vegan Leather", "Piñatex", "Mylo (Mushroom Leather)",
  // Blended / other
  "Fleece", "Polar Fleece",
];

const MATERIAL_COLOURS = [
  "#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6",
  "#06B6D4","#F97316","#EC4899","#84CC16","#14B8A6",
];

function defaultMaterial(): WizardMaterial {
  return {
    material_name: "",
    percentage: 100,
    recycled_content_pct: 0,
    bio_based_pct: 0,
    fibre_origin: "",
    supplier_name: "",
    confidence_level: "brand_declared",
  };
}

function MaterialBar({ materials }: { materials: WizardMaterial[] }) {
  const total = materials.reduce((s, m) => s + (Number(m.percentage) || 0), 0);
  if (!materials.length) return null;
  const isOver = total > 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {materials.map((m, i) => (
            <span key={i} className="flex items-center gap-1 text-[10px] text-[#525252]">
              <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: MATERIAL_COLOURS[i % MATERIAL_COLOURS.length] }} />
              {m.material_name || `Material ${i + 1}`}
            </span>
          ))}
        </div>
        <span className={`text-[11px] font-semibold shrink-0 ml-2 ${isOver ? "text-red-600" : total === 100 ? "text-emerald-700" : "text-[#8C8C8C]"}`}>
          {total}%{total === 100 ? " ✓" : isOver ? " ↑" : ""}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden flex bg-[#F0F0EE]">
        {materials.map((m, i) => {
          const w = (Math.min(Number(m.percentage) || 0, 100) / 100) * 100;
          return (
            <div
              key={i}
              style={{ width: `${w}%`, background: MATERIAL_COLOURS[i % MATERIAL_COLOURS.length], flexShrink: 0 }}
              title={`${m.material_name}: ${m.percentage}%`}
            />
          );
        })}
      </div>
      {isOver && (
        <p className="text-[10px] text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> Percentages exceed 100% — please adjust
        </p>
      )}
    </div>
  );
}

export function Step2Materials() {
  const { step2, setStep2 } = useWizardStore();
  const materials = step2.materials;

  function addMaterial() {
    const remaining = Math.max(0, 100 - materials.reduce((s, m) => s + (Number(m.percentage) || 0), 0));
    setStep2({ materials: [...materials, { ...defaultMaterial(), percentage: remaining }] });
  }

  function removeMaterial(idx: number) {
    setStep2({ materials: materials.filter((_, i) => i !== idx) });
  }

  function updateMaterial(idx: number, field: keyof WizardMaterial, value: unknown) {
    setStep2({ materials: materials.map((m, i) => i === idx ? { ...m, [field]: value } : m) });
  }

  return (
    <div className="space-y-4">
      {/* Live composition bar */}
      <MaterialBar materials={materials} />

      {/* Material rows */}
      <div className="space-y-2">
        {materials.length === 0 && (
          <div className="border border-dashed border-[#E8E8E6] rounded-xl p-6 text-center">
            <p className="text-[13px] text-[#525252]">No materials added yet</p>
            <p className="text-[11px] text-[#8C8C8C] mt-0.5">Add at least one material — percentages must total 100%</p>
          </div>
        )}

        {materials.map((material, idx) => (
          <div key={idx} className="border border-[#E8E8E6] rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: MATERIAL_COLOURS[idx % MATERIAL_COLOURS.length] }} />
                <span className="text-[10px] font-semibold text-[#525252] uppercase tracking-wide">Material {idx + 1}</span>
              </div>
              <button
                onClick={() => removeMaterial(idx)}
                className="p-1 rounded hover:bg-red-50 text-[#8C8C8C] hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Name + % */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <Label className="text-[10px] font-medium text-[#8C8C8C]">Material name *</Label>
                <div className="relative">
                  <Input
                    className="h-8 text-[13px]"
                    placeholder="e.g. Organic Cotton"
                    value={material.material_name}
                    onChange={(e) => updateMaterial(idx, "material_name", e.target.value)}
                    list={`mat-list-${idx}`}
                  />
                  <datalist id={`mat-list-${idx}`}>
                    {COMMON_MATERIALS.map((m) => <option key={m} value={m} />)}
                  </datalist>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-[#8C8C8C]">% of product</Label>
                <Input
                  className="h-8 text-[13px]"
                  type="number" min={0} max={100}
                  value={material.percentage}
                  onChange={(e) => updateMaterial(idx, "percentage", Number(e.target.value))}
                />
              </div>
            </div>

            {/* Content percentages */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-[#8C8C8C]">Recycled content %</Label>
                <Input
                  className="h-8 text-[13px]"
                  type="number" min={0} max={100} placeholder="0"
                  value={material.recycled_content_pct}
                  onChange={(e) => updateMaterial(idx, "recycled_content_pct", Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-[#8C8C8C]">Bio-based %</Label>
                <Input
                  className="h-8 text-[13px]"
                  type="number" min={0} max={100} placeholder="0"
                  value={material.bio_based_pct}
                  onChange={(e) => updateMaterial(idx, "bio_based_pct", Number(e.target.value))}
                />
              </div>
            </div>

            {/* Origin + supplier */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-[#8C8C8C]">Fibre origin (country)</Label>
                <Input
                  className="h-8 text-[13px]"
                  placeholder="e.g. India, Belgium"
                  value={material.fibre_origin}
                  onChange={(e) => updateMaterial(idx, "fibre_origin", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-[#8C8C8C]">Supplier / mill name</Label>
                <Input
                  className="h-8 text-[13px]"
                  placeholder="e.g. Albini Group"
                  value={material.supplier_name}
                  onChange={(e) => updateMaterial(idx, "supplier_name", e.target.value)}
                />
              </div>
            </div>

            {/* Confidence */}
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-[#8C8C8C]">Data confidence</Label>
              <Select
                value={material.confidence_level}
                onValueChange={(v) => updateMaterial(idx, "confidence_level", v)}
              >
                <SelectTrigger className="h-8 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONFIDENCE_LEVELS.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="text-[13px]">{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={addMaterial} className="w-full h-8 text-[12px]">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add material
        </Button>
      </div>

      {/* Trims & finishing */}
      <div className="border-t border-[#F0F0EE] pt-4 space-y-3">
        <p className="text-[10px] font-semibold text-[#8C8C8C] uppercase tracking-wider">Trims & finishing</p>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] font-medium text-[#8C8C8C]">Buttons / fastenings</Label>
            <Input className="h-8 text-[13px]" placeholder="e.g. Natural horn" value={step2.trim_notes.buttons} onChange={(e) => setStep2({ trim_notes: { ...step2.trim_notes, buttons: e.target.value } })} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-medium text-[#8C8C8C]">Zips</Label>
            <Input className="h-8 text-[13px]" placeholder="e.g. YKK brass" value={step2.trim_notes.zips} onChange={(e) => setStep2({ trim_notes: { ...step2.trim_notes, zips: e.target.value } })} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-medium text-[#8C8C8C]">Labels</Label>
            <Input className="h-8 text-[13px]" placeholder="e.g. Organic cotton woven" value={step2.trim_notes.labels} onChange={(e) => setStep2({ trim_notes: { ...step2.trim_notes, labels: e.target.value } })} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-medium text-[#8C8C8C]">Packaging</Label>
            <Input className="h-8 text-[13px]" placeholder="e.g. Recycled card, no plastic" value={step2.trim_notes.packaging} onChange={(e) => setStep2({ trim_notes: { ...step2.trim_notes, packaging: e.target.value } })} />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] font-medium text-[#8C8C8C]">Dyeing & finishing notes</Label>
          <Textarea
            className="text-[13px] resize-none"
            rows={2}
            placeholder="e.g. Low-impact reactive dyes, no fluorocarbon finishes"
            value={step2.dyeing_notes}
            onChange={(e) => setStep2({ dyeing_notes: e.target.value })}
          />
        </div>
      </div>

      {/* Chemical compliance */}
      <div className="border-t border-[#F0F0EE] pt-4 space-y-2.5">
        <p className="text-[10px] font-semibold text-[#8C8C8C] uppercase tracking-wider">Chemical compliance</p>

        <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[#E8E8E6] cursor-pointer hover:border-black/20 transition-colors">
          <input
            type="checkbox"
            className="mt-0.5 rounded w-4 h-4 shrink-0"
            checked={step2.restricted_substances_ok === true}
            onChange={(e) => setStep2({ restricted_substances_ok: e.target.checked ? true : null })}
          />
          <div>
            <p className="text-[12px] font-medium text-black">REACH / restricted substances compliant</p>
            <p className="text-[10px] text-[#8C8C8C]">No substances of very high concern (SVHCs) above threshold</p>
          </div>
        </label>

        <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[#E8E8E6] cursor-pointer hover:border-black/20 transition-colors">
          <input
            type="checkbox"
            className="mt-0.5 rounded w-4 h-4 shrink-0"
            checked={step2.pfas_free === true}
            onChange={(e) => setStep2({ pfas_free: e.target.checked ? true : null })}
          />
          <div>
            <p className="text-[12px] font-medium text-black">No PFAS / fluorochemical treatments</p>
            <p className="text-[10px] text-[#8C8C8C]">No DWR or other per- and polyfluoroalkyl substance treatments used</p>
          </div>
        </label>

        <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[#E8E8E6] cursor-pointer hover:border-black/20 transition-colors">
          <input
            type="checkbox"
            className="mt-0.5 rounded w-4 h-4 shrink-0"
            checked={step2.animal_derived}
            onChange={(e) => setStep2({ animal_derived: e.target.checked })}
          />
          <div>
            <p className="text-[12px] font-medium text-black">Contains animal-derived materials</p>
            <p className="text-[10px] text-[#8C8C8C]">Wool, leather, silk, cashmere, down, etc.</p>
          </div>
        </label>
      </div>
    </div>
  );
}
