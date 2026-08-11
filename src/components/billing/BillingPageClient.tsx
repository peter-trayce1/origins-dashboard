"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check, Zap, ExternalLink, CreditCard, Calendar, ArrowRight,
  AlertTriangle, CheckCircle2, Package, Layers, RotateCcw, Timer,
} from "lucide-react";
import { toast } from "sonner";
import { PLAN_CONFIG } from "@/types/billing";
import type { BillingInfo, BillingInterval } from "@/types/billing";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function formatPrice(p: number | null, interval: "monthly" | "annual"): string {
  if (p === null) return "Custom";
  return interval === "monthly" ? `£${p.toLocaleString()}/month` : `£${p.toLocaleString()}/year`;
}

function usageColor(pct: number): string {
  if (pct >= 100) return "bg-red-500";
  if (pct >= 90)  return "bg-orange-500";
  if (pct >= 70)  return "bg-amber-500";
  return "bg-emerald-500";
}

function usageMessage(pct: number): { text: string; color: string } {
  if (pct >= 100) return {
    text: "You've reached your annual Active Product Passport allowance. Drafts are still available, but publishing new passports requires an upgrade or waits until your allowance resets.",
    color: "text-red-700",
  };
  if (pct >= 90) return {
    text: "You're close to your annual passport allowance. Upgrade to Growth or add a passport pack to keep publishing without interruption.",
    color: "text-orange-700",
  };
  if (pct >= 70) return {
    text: "You're approaching your annual passport allowance. You can continue creating drafts, but you may need to upgrade before publishing more passports this year.",
    color: "text-amber-700",
  };
  return { text: "You're comfortably within your annual allowance.", color: "text-emerald-700" };
}

const PLAN_LABELS: Record<string, string> = {
  none:       "No active plan",
  trial:      "14-day trial",
  essentials: "Essentials",
  growth:     "Growth",
  enterprise: "Enterprise",
};

const STATUS_LABELS: Record<string, string> = {
  none: "—",
  active: "Active",
  trialing: "Trial",
  past_due: "Payment due",
  cancelled: "Cancelled",
  unpaid: "Unpaid",
  incomplete: "Incomplete",
};

// ── Interval toggle ───────────────────────────────────────────────────────────

function IntervalToggle({ interval, onChange }: { interval: BillingInterval; onChange: (v: BillingInterval) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center bg-[#F4F4F3] rounded-xl p-1 gap-1">
        {(["monthly", "annual"] as BillingInterval[]).map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
              interval === v ? "bg-white text-black shadow-sm" : "text-[#525252] hover:text-black"
            }`}
          >
            {v === "monthly" ? "Monthly" : "Annual"}
          </button>
        ))}
      </div>
      {interval === "annual" && (
        <span className="text-[12px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
          Save 17%
        </span>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  billing: BillingInfo;
  success?: boolean;
  cancelled?: boolean;
}

export function BillingPageClient({ billing, success, cancelled }: Props) {
  const [interval, setInterval] = useState<BillingInterval>(billing.billingInterval ?? "monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const { activePassportCount, passportLimit, billingPlan, billingStatus, billingInterval, currentPeriodEnd, trialEndDate, trialDaysRemaining } = billing;
  const isTrial = billingPlan === "trial";
  const limit = isTrial ? (passportLimit ?? 3) : passportLimit;
  const pct = limit ? Math.min(Math.round((activePassportCount / limit) * 100), 100) : 0;
  const usageMsg = usageMessage(pct);
  const planLabel = PLAN_LABELS[billingPlan] ?? billingPlan;
  // Use the actual subscription interval from the DB, not the pricing toggle state
  const activeInterval = billingInterval ?? "monthly";
  const nextInvoiceAmt = billingPlan === "essentials"
    ? (activeInterval === "monthly" ? "£150" : "£1,500")
    : billingPlan === "growth"
      ? (activeInterval === "monthly" ? "£450" : "£4,500")
      : null;

  async function handleCheckout(plan: "essentials" | "growth") {
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to start checkout");
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handlePortal() {
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/billing/create-portal-session", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to open billing portal");
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoadingPortal(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Success / cancelled banners */}
      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-800">
            Your subscription is now active. Welcome to Known Objects — your passport limit has been updated.
          </p>
        </div>
      )}
      {cancelled && (
        <div className="flex items-center gap-3 bg-[#F9F9F8] border border-[#E8E8E6] rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-[#8C8C8C] shrink-0" />
          <p className="text-sm text-[#525252]">Checkout was cancelled. No changes were made.</p>
        </div>
      )}

      {/* ── Trial banner ── */}
      {isTrial && (
        <div className="rounded-2xl border border-[#E8E8E6] bg-white p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <Timer className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap mb-1">
                <p className="text-[15px] font-semibold text-black">14-day free trial</p>
                {trialDaysRemaining != null && (
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    trialDaysRemaining <= 3
                      ? "bg-red-50 text-red-700 border-red-200"
                      : trialDaysRemaining <= 7
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {trialDaysRemaining === 0 ? "Last day" : `${trialDaysRemaining} day${trialDaysRemaining !== 1 ? "s" : ""} remaining`}
                  </span>
                )}
              </div>
              <p className="text-[13px] text-[#525252]">
                {trialEndDate
                  ? `Your trial runs until ${formatDate(trialEndDate)}. Upgrade to keep publishing passports after your trial ends.`
                  : "Upgrade to a paid plan to keep publishing passports after your trial ends."
                }
              </p>
              {trialDaysRemaining != null && (
                <div className="mt-2.5 h-1.5 bg-[#F0F0EE] rounded-full overflow-hidden max-w-xs">
                  <div
                    className={`h-full rounded-full transition-all ${
                      trialDaysRemaining <= 3 ? "bg-red-500" :
                      trialDaysRemaining <= 7 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.max(0, Math.min((trialDaysRemaining / 14) * 100, 100))}%` }}
                  />
                </div>
              )}
            </div>
            <button
              onClick={() => handleCheckout("essentials")}
              disabled={!!loadingPlan}
              className="shrink-0 h-9 px-4 rounded-xl bg-black text-white text-[13px] font-semibold hover:bg-[#1C1C1E] transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Zap className="h-3.5 w-3.5" />
              {loadingPlan ? "Loading…" : "Upgrade now"}
            </button>
          </div>

          {/* Trial features */}
          <div className="mt-5 pt-4 border-t border-[#F0F0EE] grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4">
            {[
              "14-day trial",
              "Publish up to 3 passports",
              "QR code generation",
              "Public passport pages",
              "Full passport builder",
              "No credit card required",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-[12px] text-[#525252]">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 1. Current Plan ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-[#E8E8E6] rounded-2xl bg-white p-5 space-y-4">
          <p className="text-[10px] font-semibold text-[#8C8C8C] uppercase tracking-widest">Current Plan</p>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xl font-bold text-black">{planLabel}</p>
              {billingStatus !== "none" && billingStatus !== "cancelled" && (
                <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  billingStatus === "active" ? "bg-emerald-50 text-emerald-700"
                  : billingStatus === "trialing" ? "bg-blue-50 text-blue-700"
                  : "bg-amber-50 text-amber-700"
                }`}>
                  {STATUS_LABELS[billingStatus]}
                </span>
              )}
              {billingPlan === "none" && (
                <p className="text-[12px] text-[#525252] mt-1">Choose a plan to start publishing passports.</p>
              )}
            </div>
            {billingPlan !== "none" && (
              <div className="text-right shrink-0">
                <p className="text-[13px] font-semibold text-black">
                  {billingPlan !== "enterprise" ? (activeInterval === "monthly" ? (billingPlan === "essentials" ? "£150/mo" : "£450/mo") : (billingPlan === "essentials" ? "£1,500/yr" : "£4,500/yr")) : "Custom"}
                </p>
                <p className="text-[11px] text-[#8C8C8C] capitalize">{billing.billingInterval ?? ""} billing</p>
              </div>
            )}
          </div>

          {billingPlan !== "none" && (
            <div className="space-y-2 border-t border-[#F0F0EE] pt-3">
              {limit && (
                <div className="flex items-center gap-2 text-[12px] text-[#525252]">
                  <span className="text-black font-semibold">{limit.toLocaleString()} passports / year</span>
                  included in this plan
                </div>
              )}
              {currentPeriodEnd && nextInvoiceAmt && (
                <div className="flex items-center gap-2 text-[12px] text-[#525252]">
                  <Calendar className="h-3.5 w-3.5 text-[#8C8C8C] shrink-0" />
                  Next invoice: <span className="text-black font-medium">{nextInvoiceAmt} on {formatDate(currentPeriodEnd)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-[12px] text-[#525252]">
                <CreditCard className="h-3.5 w-3.5 text-[#8C8C8C] shrink-0" />
                <button onClick={handlePortal} className="text-[#0e6dea] hover:opacity-80 transition-opacity">
                  View payment details →
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            {billing.stripeCustomerId ? (
              <button
                onClick={handlePortal}
                disabled={loadingPortal}
                className="w-full h-8 rounded-xl border border-[#E8E8E6] text-[12px] font-medium text-black hover:bg-[#F7F6F4] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {loadingPortal ? "Opening…" : "Manage billing"}
              </button>
            ) : null}
            {billingPlan !== "enterprise" && (
              <button
                onClick={() => handleCheckout(billingPlan === "essentials" ? "growth" : "essentials")}
                disabled={!!loadingPlan}
                className="w-full h-8 rounded-xl bg-black text-white text-[12px] font-medium hover:bg-[#1C1C1E] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Zap className="h-3.5 w-3.5" />
                {loadingPlan ? "Loading…" : billingPlan === "none" ? "Choose a plan" : billingPlan === "growth" ? "Manage plan" : "Upgrade to Growth"}
              </button>
            )}
          </div>
        </div>

        {/* ── 2. Passport Usage ── */}
        <div className="border border-[#E8E8E6] rounded-2xl bg-white p-5 space-y-4">
          <div>
            <p className="text-[10px] font-semibold text-[#8C8C8C] uppercase tracking-widest mb-1">
              Annual Passport Usage
            </p>
            <p className="text-[11px] text-[#525252]">
              Each plan includes a number of published passports <strong className="text-black font-medium">per subscription year</strong>. QR labels printed and scan volume never count.
            </p>
          </div>

          {limit !== null && limit > 0 ? (
            <>
              <div>
                <div className="flex items-end justify-between mb-1">
                  <div>
                    <p className="text-2xl font-bold text-black tabular-nums leading-none">
                      {activePassportCount.toLocaleString()}
                      <span className="text-base font-normal text-[#8C8C8C]"> / {limit.toLocaleString()}</span>
                    </p>
                    <p className="text-[11px] text-[#8C8C8C] mt-0.5">Active Product Passports used this year</p>
                  </div>
                  <span className="text-[13px] font-semibold text-[#525252] self-start">{pct}%</span>
                </div>
                <div className="h-2 bg-[#F4F4F3] rounded-full overflow-hidden mt-3">
                  <div
                    className={`h-full rounded-full transition-all ${usageColor(pct)}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                {currentPeriodEnd && (
                  <p className="text-[11px] text-[#8C8C8C] mt-1.5">
                    Allowance resets on <span className="text-black font-medium">{formatDate(currentPeriodEnd)}</span>
                  </p>
                )}
              </div>
              <p className={`text-[12px] leading-relaxed ${usageMsg.color}`}>{usageMsg.text}</p>
              <p className="text-[11px] text-[#8C8C8C]">Draft and archived passports are free to create and do not count towards your annual allowance.</p>
            </>
          ) : billingPlan === "enterprise" ? (
            <div className="flex items-center gap-2 text-[13px] text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Unlimited Active Product Passports per year
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[13px] text-[#525252]">No active plan. Choose a plan to set your annual passport allowance.</p>
              <p className="text-[11px] text-[#8C8C8C]">You can create unlimited drafts on any plan.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. What counts ── */}
      <div className="border border-[#E8E8E6] rounded-2xl bg-white p-5 space-y-4">
        <div>
          <p className="text-[13px] font-semibold text-black">What counts as an Active Product Passport?</p>
          <p className="text-[12px] text-[#525252] mt-0.5">
            Each plan includes a fixed number of Active Product Passports <strong className="text-black font-medium">per subscription year</strong>. An Active Product Passport is a published product style with a live QR-linked public passport page.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              icon: Package,
              text: "1 organic cotton t-shirt style published in Known Objects",
              result: "= 1 Active Product Passport used",
              accent: false,
            },
            {
              icon: Layers,
              text: "10,000 QR labels printed for that same t-shirt",
              result: "= still only 1 passport used",
              accent: false,
            },
            {
              icon: CheckCircle2,
              text: "Draft, archived or unpublished passports",
              result: "= do not count. Free to create.",
              accent: true,
            },
            {
              icon: RotateCcw,
              text: "Your passport allowance resets every year when your subscription renews",
              result: "= start fresh each year",
              accent: true,
            },
          ].map(({ icon: Icon, text, result, accent }) => (
            <div key={text} className="flex flex-col gap-2 p-4 bg-[#F9F9F8] rounded-xl border border-[#F0F0EE]">
              <Icon className={`h-5 w-5 ${accent ? "text-emerald-600" : "text-[#525252]"}`} />
              <p className="text-[12px] text-[#525252] leading-relaxed">{text}</p>
              <p className={`text-[12px] font-semibold ${accent ? "text-emerald-700" : "text-black"}`}>{result}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Pricing cards ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-[13px] font-semibold text-black">
            {isTrial ? "Continue after your trial" : "Plans"}
          </p>
          <IntervalToggle interval={interval} onChange={setInterval} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Essentials */}
          {(["essentials", "growth", "enterprise"] as const).map((planKey) => {
            const cfg = PLAN_CONFIG[planKey];
            const isCurrent = billingPlan === planKey;
            const isHighlighted = cfg.highlighted;

            return (
              <div
                key={planKey}
                className={`relative flex flex-col rounded-2xl border p-5 ${
                  isHighlighted
                    ? "border-black shadow-[0_4px_24px_0_rgb(0_0_0/0.10)] bg-white"
                    : "border-[#E8E8E6] bg-white"
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-[11px] font-semibold bg-black text-white px-3 py-1 rounded-full">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="space-y-1 mb-4">
                  <p className="text-[13px] font-semibold text-black">{cfg.label}</p>
                  {cfg.monthlyPrice !== null ? (
                    <div>
                      <p className="text-2xl font-bold text-black">
                        {interval === "monthly"
                          ? `£${cfg.monthlyPrice}`
                          : `£${cfg.annualPrice?.toLocaleString()}`}
                      </p>
                      <p className="text-[11px] text-[#8C8C8C]">
                        {interval === "monthly" ? "per month" : "per year · billed annually"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-black">Custom</p>
                  )}
                </div>

                <p className="text-[11px] font-semibold text-[#8C8C8C] mb-2">
                  {cfg.passportLimit
                    ? `Up to ${cfg.passportLimit.toLocaleString()} Active Product Passports per year`
                    : "Unlimited Active Product Passports per year"
                  }
                </p>

                <ul className="space-y-1.5 mb-5 flex-1">
                  {cfg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[12px] text-[#525252]">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {planKey === "enterprise" ? (
                  <a
                    href="mailto:hello@knownobjects.io?subject=Enterprise%20enquiry"
                    className="w-full h-9 rounded-xl border border-[#E8E8E6] text-[13px] font-medium text-black hover:bg-[#F7F6F4] transition-colors flex items-center justify-center gap-1.5"
                  >
                    Talk to us
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                ) : isCurrent ? (
                  <div className="w-full h-9 rounded-xl bg-[#F4F4F3] text-[13px] font-medium text-[#8C8C8C] flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Current plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleCheckout(planKey as "essentials" | "growth")}
                    disabled={!!loadingPlan}
                    className={`w-full h-9 rounded-xl text-[13px] font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                      isHighlighted
                        ? "bg-black text-white hover:bg-[#1C1C1E]"
                        : "border border-[#E8E8E6] text-black hover:bg-[#F7F6F4]"
                    }`}
                  >
                    {loadingPlan === planKey ? "Loading…" : `Choose ${cfg.label}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 5. Expansion packs ── */}
      <div className="border border-[#E8E8E6] rounded-2xl bg-white p-5 space-y-3">
        <div>
          <p className="text-[13px] font-semibold text-black">Passport expansion packs</p>
          <p className="text-[12px] text-[#525252] mt-0.5">
            Need a few more passports without changing your plan? Add extra capacity for your current subscription year.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { label: "+100 Active Product Passports", price: "£100/month", priceKey: "pack100" },
            { label: "+250 Active Product Passports", price: "£200/month", priceKey: "pack250" },
          ].map((pack) => (
            <div key={pack.priceKey} className="flex items-center justify-between p-3.5 rounded-xl border border-[#E8E8E6] bg-[#F9F9F8]">
              <div>
                <p className="text-[13px] font-medium text-black">{pack.label}</p>
                <p className="text-[12px] text-[#525252]">{pack.price} · added to your subscription</p>
              </div>
              <button
                onClick={() => toast.info("Passport packs — contact us to add to your plan")}
                className="h-8 px-3 rounded-lg border border-[#E8E8E6] bg-white text-[12px] font-medium text-black hover:bg-[#F7F6F4] transition-colors shrink-0"
              >
                Add pack
              </button>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-[#8C8C8C]">
          Expansion packs are available on Essentials and Growth plans. Contact us to add a pack to your existing subscription.
        </p>
      </div>

      {/* ── 6. Invoice management CTA ── */}
      {billing.stripeCustomerId && (
        <div className="flex items-center justify-between gap-4 border border-[#E8E8E6] rounded-2xl bg-white p-5">
          <div>
            <p className="text-[13px] font-semibold text-black">Invoices & payment details</p>
            <p className="text-[12px] text-[#525252] mt-0.5">
              View and download invoices, update your payment method, and manage your subscription through the Stripe billing portal.
            </p>
          </div>
          <button
            onClick={handlePortal}
            disabled={loadingPortal}
            className="shrink-0 inline-flex h-8 items-center gap-1.5 px-3 rounded-xl border border-[#E8E8E6] text-[12px] font-medium text-black hover:bg-[#F7F6F4] transition-colors disabled:opacity-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {loadingPortal ? "Opening…" : "Open billing portal"}
          </button>
        </div>
      )}

      {/* Bottom note */}
      <p className="text-[11px] text-[#8C8C8C] text-center pb-4">
        All prices in GBP. Subscriptions renew automatically. Cancel anytime through the billing portal.{" "}
        <a href="mailto:hello@knownobjects.io" className="underline hover:text-black">Contact us</a> with any billing questions.
      </p>
    </div>
  );
}
