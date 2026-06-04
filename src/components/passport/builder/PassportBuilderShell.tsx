"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useWizardStore } from "@/stores/wizardStore";
import { BuilderNavSidebar, type BuilderSection } from "./BuilderNavSidebar";
import { BuilderLeftPanel } from "./BuilderLeftPanel";
import { LivePassportPreview } from "./LivePassportPreview";
import { BuilderRightPanel } from "./BuilderRightPanel";
import { Loader2, CheckCircle, ArrowLeft, Globe, EyeOff, Save, Lock, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";

interface PassportBuilderShellProps {
  brandId: string;
  brandName: string;
  passportId?: string;
  brandStory?: string;
}

export function PassportBuilderShell({ brandId, brandName, passportId, brandStory }: PassportBuilderShellProps) {
  const router = useRouter();
  const [isInitialising, setIsInitialising] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [activeSection, setActiveSection] = useState<BuilderSection>("product");

  // Granular selectors — shell only re-renders when these specific fields change
  const isDirty = useWizardStore((s) => s.isDirty);
  const changeVersion = useWizardStore((s) => s.changeVersion);
  const passportIdInStore = useWizardStore((s) => s.passportId);
  const isSaving = useWizardStore((s) => s.isSaving);
  const lastSaved = useWizardStore((s) => s.lastSaved);
  const productName = useWizardStore((s) => s.step1.product_name);
  const passportCode = useWizardStore((s) => s.step1.passport_code);

  // Debounce the change counter, not a boolean — resets on every keystroke
  const debouncedVersion = useDebounce(changeVersion, 800);

  // Keep a stable reference to store actions (Zustand actions are stable across renders)
  const { reset, hydrate, setPassportId } = useWizardStore.getState();

  useEffect(() => {
    async function init() {
      reset();
      if (passportId) {
        const res = await fetch(`/api/passports/${passportId}`);
        if (res.ok) {
          const data = await res.json();
          hydrate(data);
          setStatus(data.status ?? "draft");
          // Pre-fill product_story from brand "Our Story" if still empty
          if (!data.product_story && brandStory) {
            useWizardStore.getState().setStep7({ product_story: brandStory });
          }
        }
      } else {
        const res = await fetch("/api/passports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brand_id: brandId }),
        });
        if (res.ok) {
          const data = await res.json();
          hydrate(data);
          setStatus(data.status ?? "draft");
          router.replace(`/passports/${data.id}`, { scroll: false });
          // Pre-fill product_story from brand "Our Story" for new passports
          if (brandStory) {
            useWizardStore.getState().setStep7({ product_story: brandStory });
          }
        } else {
          toast.error("Failed to create passport. Please try again.");
        }
      }
      setIsInitialising(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // save always reads fresh state — stable, never recreated.
  const save = useCallback(async (): Promise<boolean> => {
    const state = useWizardStore.getState();
    if (!state.passportId || !state.isDirty || state.isSaving) return true;
    const savedVersion = state.changeVersion;
    useWizardStore.getState().setSaving(true);
    try {
      const payload = buildPayload(state);
      const res = await fetch(`/api/passports/${state.passportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.slug && !useWizardStore.getState().step1.slug) {
          useWizardStore.getState().setSlugFromServer(data.slug);
        }
        useWizardStore.getState().markSaved(savedVersion);
        return true;
      }
      const errBody = await res.json().catch(() => ({}));
      console.error("[passport save] HTTP", res.status, errBody);
      return false;
    } catch (err) {
      console.error("[passport save] fetch threw", err);
      return false;
    } finally {
      useWizardStore.getState().setSaving(false);
    }
  }, []); // stable — never recreated

  // Primary: debounced save 800 ms after the last keystroke
  useEffect(() => {
    if (debouncedVersion > 0 && passportIdInStore) {
      save();
    }
  }, [debouncedVersion, passportIdInStore, save]);

  // Safety net: save every 3 s if there are still unsaved changes
  useEffect(() => {
    const interval = setInterval(() => {
      const { passportId, isDirty, isSaving } = useWizardStore.getState();
      if (passportId && isDirty && !isSaving) save();
    }, 3000);
    return () => clearInterval(interval);
  }, [save]);

  // Best-effort save when the user closes or navigates away
  useEffect(() => {
    const handleUnload = () => {
      const state = useWizardStore.getState();
      if (!state.passportId || !state.isDirty) return;
      const payload = buildPayload(state);
      fetch(`/api/passports/${state.passportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  // Trigger save when the user switches sections — a natural commit point
  function handleSectionChange(section: BuilderSection) {
    setActiveSection(section);
    save();
  }

  async function handleSave() {
    const wasDirty = useWizardStore.getState().isDirty;
    const ok = await save();
    if (!wasDirty) return; // nothing to save
    if (!ok) toast.error("Save failed — check your connection and try again");
    else toast.success("Progress saved");
  }

  async function handleDownloadPack() {
    if (!passportIdInStore) return;
    const a = document.createElement("a");
    a.href = `/api/passports/${passportIdInStore}/manufacturer-pack`;
    a.download = "";
    a.click();
  }

  async function handlePublish() {
    if (!passportIdInStore) return;
    await save();
    setIsPublishing(true);
    const newStatus = status === "published" ? "draft" : "published";
    const res = await fetch(`/api/passports/${passportIdInStore}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setIsPublishing(false);
    if (res.ok) {
      setStatus(newStatus);
      toast.success(newStatus === "published" ? "Passport published" : "Passport unpublished");
    } else {
      toast.error("Failed to update status");
    }
  }

  if (isInitialising) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#8C8C8C]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-14 border-b border-[#E8E8E6] shrink-0 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push("/passports")}
            className="p-1.5 rounded-lg hover:bg-[#F4F4F3] transition-colors text-[#525252] hover:text-black shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="text-xs text-[#8C8C8C] truncate">{brandName}</div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-black truncate leading-tight">
                {productName || "Untitled passport"}
              </div>
              {passportCode && (
                <span className="flex items-center gap-1 font-mono text-[10px] text-[#8C8C8C] bg-[#F4F4F2] border border-[#E8E8E6] px-1.5 py-0.5 rounded shrink-0">
                  {passportCode}
                  <Lock className="h-2.5 w-2.5" />
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isSaving ? (
            <span className="flex items-center gap-1.5 text-xs text-[#8C8C8C]">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving…
            </span>
          ) : lastSaved && !isDirty ? (
            <span className="flex items-center gap-1.5 text-xs text-[#8C8C8C]">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Saved
            </span>
          ) : null}

          {passportIdInStore && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadPack}
              className="text-xs"
              title="Download Manufacturer Pack (ZIP)"
            >
              <Package className="h-3.5 w-3.5 mr-1.5" />
              Manufacturer Pack
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="text-xs"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1.5" />
            )}
            Save
          </Button>

          <Button
            size="sm"
            variant={status === "published" ? "outline" : "default"}
            onClick={handlePublish}
            disabled={isPublishing}
            className="text-xs"
          >
            {isPublishing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : status === "published" ? (
              <EyeOff className="h-3.5 w-3.5 mr-1.5" />
            ) : (
              <Globe className="h-3.5 w-3.5 mr-1.5" />
            )}
            {status === "published" ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </header>

      {/* Body: 4-column layout */}
      <div className="flex flex-1 overflow-hidden">
        <BuilderNavSidebar active={activeSection} onChange={handleSectionChange} isDirty={isDirty} />
        <BuilderLeftPanel activeSection={activeSection} />
        <LivePassportPreview
          passportId={passportIdInStore ?? ""}
          status={status}
          brandName={brandName}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        <BuilderRightPanel passportId={passportIdInStore ?? ""} status={status} onNavigate={setActiveSection} />
      </div>
    </div>
  );
}

function buildPayload(store: ReturnType<typeof useWizardStore.getState>) {
  const s1 = store.step1;
  const s2 = store.step2;
  const s3 = store.step3;
  const s4 = store.step4;
  const s5 = store.step5;
  const s6 = store.step6;
  const s7 = store.step7;

  return {
    product_name: s1.product_name,
    sku: s1.sku || null,
    gtin: s1.gtin || null,
    batch_id: s1.batch_id || null,
    category: s1.category || null,
    gender: s1.gender || null,
    size_range: s1.size_range || null,
    colour: s1.colour || null,
    season: s1.season || null,
    collection_name: s1.collection_name || null,
    product_description: s1.product_description || null,
    product_url: s1.product_url || null,
    primary_image_url: s1.primary_image_url || null,
    additional_image_urls: s1.additional_image_urls,
    manufacturing_date: s1.manufacturing_date
      ? (s1.manufacturing_date.length === 7 ? `${s1.manufacturing_date}-01` : s1.manufacturing_date)
      : null,
    slug: s1.slug || null,
    country_of_origin: s1.country_of_origin || null,
    product_weight_g: s1.product_weight_g === "" ? null : s1.product_weight_g,
    product_lifetime_years: s1.product_lifetime_years === "" ? null : s1.product_lifetime_years,

    product_materials: s2.materials,
    passport_material_extras: {
      dyeing_notes: s2.dyeing_notes,
      finishing_notes: s2.finishing_notes,
      restricted_substances_ok: s2.restricted_substances_ok,
      animal_derived: s2.animal_derived,
      pfas_free: s2.pfas_free,
      trim_notes: s2.trim_notes,
    },

    product_facilities: s3.facilities,

    carbon_footprint_kg: s4.carbon_footprint_kg === "" ? null : s4.carbon_footprint_kg,
    carbon_meta: s4.carbon_meta,
    water_usage_litres: s4.water_usage_litres === "" ? null : s4.water_usage_litres,
    water_meta: s4.water_meta,
    energy_use_kwh: s4.energy_use_kwh === "" ? null : s4.energy_use_kwh,
    energy_unit: s4.energy_unit || "kWh",
    energy_meta: s4.energy_meta,
    sustainability_summary: s4.sustainability_summary || null,
    sustainability_claims: s4.sustainability_claims,
    claim_evidence_urls: s4.claim_evidence_urls,
    impact_data_source: s4.impact_data_source,

    product_certifications: s5.certifications,

    impact_metrics: s4.impact_metrics,

    care_instructions: s6.care_instructions,
    circularity_actions: s6.circularity_actions,
    warranty_info: s6.warranty_info || null,
    repairability_score: s6.repairability_score === "" ? null : s6.repairability_score,
    spare_parts_available: s6.spare_parts_available,
    repair_instructions: s6.repair_instructions || null,
    recyclability: s6.recyclability || null,
    recycling_instructions: s6.recycling_instructions || null,
    end_of_life_guidance: s6.end_of_life_guidance || null,

    product_story: s7.product_story || null,
    product_story_image_url: s7.product_story_image_url || null,
    maker_story: s7.maker_story || null,
    makers_image_url: s7.makers_image_url || null,
    design_notes: s7.design_notes || null,
    brand_impact_statement: s7.brand_impact_statement || null,
    consumer_transparency_summary: s7.consumer_transparency_summary || null,
    video_url: s7.video_url || null,
    designer_quote: s7.designer_quote || null,
    gallery_image_urls: s7.gallery_image_urls,
  };
}
