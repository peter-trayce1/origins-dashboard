"use client";

import Link from "next/link";
import { AlertTriangle, Zap } from "lucide-react";

interface Props {
  activeCount: number;
  limit: number | null;
}

export function BillingAlert({ activeCount, limit }: Props) {
  if (limit === null || activeCount < limit * 0.8) return null;

  const pct = Math.round((activeCount / limit) * 100);
  const atLimit = activeCount >= limit;

  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border text-sm ${
      atLimit
        ? "bg-red-50 border-red-200 text-red-800"
        : "bg-amber-50 border-amber-200 text-amber-800"
    }`}>
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <p className="flex-1">
        {atLimit
          ? "You've reached your annual Active Product Passport allowance. Upgrade to publish more passports."
          : `Your organisation has used ${pct}% of its annual Active Product Passport allowance.`
        }
      </p>
      <Link
        href="/billing"
        className={`shrink-0 inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-[12px] font-semibold transition-colors ${
          atLimit
            ? "bg-red-700 text-white hover:bg-red-800"
            : "bg-amber-700 text-white hover:bg-amber-800"
        }`}
      >
        {atLimit ? <><Zap className="h-3 w-3" />Upgrade plan</> : "View billing"}
      </Link>
    </div>
  );
}
