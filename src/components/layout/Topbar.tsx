"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, LogOut, User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useOrganisation } from "@/hooks/useOrganisation";

export function Topbar() {
  const router = useRouter();
  const { org } = useOrganisation();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = org?.brandName
    ? org.brandName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <header className="h-14 border-b border-[#E8E8E6] bg-white/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6">
      {/* Mobile logo */}
      <div className="flex items-center lg:hidden">
        <Link href="/dashboard">
          <Image src="/logo-dark.png" alt="Origins" width={80} height={18} className="object-contain" style={{ height: 18, width: "auto" }} priority />
        </Link>
      </div>

      <div className="hidden lg:block" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <Link
          href="/passports/new"
          className="hidden sm:inline-flex h-7 items-center gap-1.5 rounded-lg border border-transparent bg-primary px-2.5 text-[0.8rem] font-medium text-primary-foreground transition-all hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          New passport
        </Link>

        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#525252]">
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg p-1 hover:bg-[#F4F4F3] transition-colors">
            <Avatar className="h-7 w-7">
              {org?.brandLogoUrl && <AvatarImage src={org.brandLogoUrl} className="object-contain" />}
              <AvatarFallback className="text-xs bg-black text-white font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <p className="font-medium text-black">{org?.brandName ?? "Your brand"}</p>
                <p className="text-xs text-[#8C8C8C] capitalize">{org?.role}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Link href="/settings/brand" className="flex items-center gap-2 w-full">
                  <User className="h-4 w-4" />
                  Brand settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
