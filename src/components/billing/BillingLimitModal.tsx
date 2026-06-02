"use client";

import { useRouter } from "next/navigation";
import { X, Zap } from "lucide-react";
import type { BillingPlan } from "@/types/billing";

interface Props {
  open: boolean;
  onClose: () => void;
  plan: BillingPlan;
  limit: number | null;
}

export function BillingLimitModal({ open, onClose, plan, limit }: Props) {
  const router = useRouter();
  if (!open) return null;

  const isGrowth = plan === "growth";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8C8C8C] hover:text-black transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-amber-600" />
          </div>
          <h2 className="text-[15px] font-semibold text-black leading-tight">
            You've reached your Active Product Passport limit
          </h2>
        </div>

        <p className="text-[13px] text-[#525252] leading-relaxed">
          {isGrowth
            ? `Your Growth plan includes up to ${limit ?? 750} Active Product Passports per year. For higher volumes or custom integrations, talk to us about an Enterprise plan.`
            : `Your current plan includes up to ${limit ?? 250} Active Product Passports per year. Drafts are still available, but publishing new passports requires upgrading your plan or waiting until your annual allowance resets.`
          }
        </p>

        <p className="text-[11px] text-[#8C8C8C]">
          Draft and archived passports are free to create and do not count towards your annual allowance.
        </p>

        <div className="flex gap-2 pt-1">
          {isGrowth ? (
            <a
              href="mailto:hello@originsid.com?subject=Enterprise%20enquiry"
              className="flex-1 h-9 rounded-xl bg-black text-white text-[13px] font-medium hover:bg-[#1C1C1E] transition-colors flex items-center justify-center"
            >
              Talk to us
            </a>
          ) : (
            <button
              onClick={() => { onClose(); router.push("/billing"); }}
              className="flex-1 h-9 rounded-xl bg-black text-white text-[13px] font-medium hover:bg-[#1C1C1E] transition-colors flex items-center justify-center gap-1.5"
            >
              <Zap className="h-3.5 w-3.5" />
              Upgrade plan
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 h-9 rounded-xl border border-[#E8E8E6] text-[13px] font-medium text-[#525252] hover:bg-[#F7F6F4] transition-colors"
          >
            Keep as draft
          </button>
        </div>
      </div>
    </div>
  );
}
