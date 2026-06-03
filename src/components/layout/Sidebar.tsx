"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  QrCode,
  Upload,
  BarChart2,
  Plug,
  Settings,
  ChevronRight,
  Send,
  CreditCard,
  Timer,
  Zap,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrganisation } from "@/hooks/useOrganisation";
import { Logo } from "./Logo";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Passports", href: "/passports", icon: FileText },
  { label: "QR Codes", href: "/passports", icon: QrCode, sub: true, badge: null },
  { label: "Bulk Upload", href: "/bulk-upload", icon: Upload },
  { label: "Supply Chain Requests", href: "/supply-chain-requests", icon: Send },
  { label: "Analytics", href: "/analytics", icon: BarChart2 },
  { label: "Connections", href: "/data-connections", icon: Plug },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Settings", href: "/settings/brand", icon: Settings },
];

const mainNav = navItems.filter((i) => !i.sub);

interface UsageInfo {
  used: number;
  limit: number | null;
  isTrial: boolean;
  daysRemaining: number | null;
  trialEndDate: string | null;
}

interface SidebarProps {
  usageInfo?: UsageInfo | null;
  isSuperAdmin?: boolean;
}

export function Sidebar({ usageInfo, isSuperAdmin }: SidebarProps) {
  const pathname = usePathname();
  const { org } = useOrganisation();

  return (
    <aside className="hidden lg:flex lg:flex-col w-56 xl:w-64 h-screen sticky top-0 bg-[#F9F9F8] border-r border-[#E8E8E6] shrink-0">
      {/* Logo */}
      <div className="flex items-center px-5 h-14 border-b border-[#E8E8E6]">
        <Logo />
      </div>

      {/* Brand selector */}
      {org && (
        <div className="px-3 py-3 border-b border-[#E8E8E6]">
          <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white transition-colors group">
            <div className="w-6 h-6 rounded-md bg-black text-white text-xs flex items-center justify-center font-semibold shrink-0">
              {org.brandName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-medium text-black truncate">{org.brandName}</p>
              <p className="text-[11px] text-[#8C8C8C] capitalize">{org.role}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-[#8C8C8C] shrink-0" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors",
                active
                  ? "bg-white text-black shadow-[0_1px_3px_0_rgb(0_0_0/0.06)] border border-[#E8E8E6]"
                  : "text-[#525252] hover:text-black hover:bg-white/60"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-black" : "text-[#8C8C8C]"
                )}
              />
              {item.label}
            </Link>
          );
        })}

        {/* Super-admin only */}
        {isSuperAdmin && (
          <>
            <div className="my-2 h-px bg-[#E8E8E6]" />
            <Link
              href="/customer-management"
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors",
                pathname.startsWith("/customer-management")
                  ? "bg-white text-black shadow-[0_1px_3px_0_rgb(0_0_0/0.06)] border border-[#E8E8E6]"
                  : "text-[#525252] hover:text-black hover:bg-white/60"
              )}
            >
              <Shield className={cn("h-4 w-4 shrink-0", pathname.startsWith("/customer-management") ? "text-black" : "text-[#8C8C8C]")} />
              Customer Management
            </Link>
          </>
        )}
      </nav>

      {/* Trial / Passport allowance card */}
      {usageInfo && usageInfo.limit !== null && (
        <div className="px-3 pb-2">
          {usageInfo.isTrial ? (
            /* ── Trial card ── */
            <Link
              href="/billing"
              className="block px-3 py-3 rounded-xl bg-white border border-[#E8E8E6] hover:border-[#D0D0CE] transition-colors group space-y-3"
            >
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Timer className="h-3 w-3 text-[#8C8C8C]" />
                  <span className="text-[11px] font-semibold text-[#525252] group-hover:text-black transition-colors">
                    14-day trial
                  </span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full leading-none ${
                  usageInfo.daysRemaining !== null && usageInfo.daysRemaining <= 3
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : usageInfo.daysRemaining !== null && usageInfo.daysRemaining <= 7
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}>
                  {usageInfo.daysRemaining !== null
                    ? usageInfo.daysRemaining === 0 ? "Last day" : `${usageInfo.daysRemaining}d left`
                    : "Active"
                  }
                </span>
              </div>

              {/* Days progress bar */}
              {usageInfo.daysRemaining !== null && (
                <div>
                  <div className="h-1 bg-[#F0F0EE] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        usageInfo.daysRemaining <= 3 ? "bg-red-500" :
                        usageInfo.daysRemaining <= 7 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.max(0, Math.min((usageInfo.daysRemaining / 14) * 100, 100))}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Passport usage */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#8C8C8C]">Passports published</span>
                  <span className="text-[10px] font-semibold tabular-nums text-[#525252]">
                    {usageInfo.used} / {usageInfo.limit}
                  </span>
                </div>
                <div className="h-1 bg-[#F0F0EE] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      usageInfo.used >= usageInfo.limit ? "bg-red-500" : "bg-black"
                    }`}
                    style={{ width: `${Math.min((usageInfo.used / usageInfo.limit) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Upgrade nudge */}
              <div className="flex items-center gap-1 text-[10px] font-semibold text-[#0e6dea] group-hover:opacity-80 transition-opacity">
                <Zap className="h-2.5 w-2.5" />
                Upgrade to continue →
              </div>
            </Link>
          ) : (
            /* ── Regular allowance card ── */
            <Link
              href="/billing"
              className="block px-3 py-2.5 rounded-xl bg-white border border-[#E8E8E6] hover:border-[#D0D0CE] transition-colors group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-[#525252] group-hover:text-black transition-colors">
                  Passport allowance
                </span>
                <span className="text-[11px] font-semibold tabular-nums text-[#525252]">
                  {usageInfo.used.toLocaleString()} / {usageInfo.limit.toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 bg-[#F0F0EE] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    usageInfo.used >= usageInfo.limit
                      ? "bg-red-500"
                      : usageInfo.used / usageInfo.limit >= 0.9
                      ? "bg-orange-500"
                      : usageInfo.used / usageInfo.limit >= 0.7
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min((usageInfo.used / usageInfo.limit) * 100, 100)}%` }}
                />
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Bottom links */}
      <div className="px-3 py-3 border-t border-[#E8E8E6]">
        <Link
          href="/settings/brand"
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "bg-white text-black shadow-[0_1px_3px_0_rgb(0_0_0/0.06)] border border-[#E8E8E6]"
              : "text-[#525252] hover:text-black hover:bg-white/60"
          )}
        >
          <Settings className={cn("h-4 w-4 shrink-0", pathname.startsWith("/settings") ? "text-black" : "text-[#8C8C8C]")} />
          Settings
        </Link>
      </div>
    </aside>
  );
}
