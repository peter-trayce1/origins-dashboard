"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { User, Building2, Palette, Users } from "lucide-react";

const tabs = [
  { href: "/settings/account", label: "Account", icon: User },
  { href: "/settings/organization", label: "Organization", icon: Building2 },
  { href: "/settings/brand", label: "Brand", icon: Palette },
  { href: "/settings/team", label: "Team", icon: Users },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Tab navigation */}
      <div className="border-b border-[#E8E8E6]">
        <div className="flex gap-1 overflow-x-auto pb-4 -mx-8 px-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-white text-black border border-[#E8E8E6] shadow-sm"
                    : "text-[#525252] hover:text-black"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div>{children}</div>
    </div>
  );
}
