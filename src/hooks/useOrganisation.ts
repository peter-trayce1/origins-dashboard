"use client";

import { createClient } from "@/lib/supabase/client";
import useSWR from "swr";

export interface OrgContext {
  organisationId: string;
  brandId: string;
  brandName: string;
  brandLogoUrl: string | null;
  role: string;
  userEmail: string | null;
}

async function fetchOrgContext(): Promise<OrgContext | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("organisation_members")
    .select("organisation_id, role")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .limit(1)
    .single();

  if (!member) return null;

  const { data: brand } = await supabase
    .from("brands")
    .select("id, name, logo_url")
    .eq("organisation_id", member.organisation_id)
    .limit(1)
    .single();

  if (!brand) return null;

  return {
    organisationId: member.organisation_id,
    brandId: brand.id,
    brandName: brand.name,
    brandLogoUrl: brand.logo_url,
    role: member.role,
    userEmail: user.email ?? null,
  };
}

export function useOrganisation() {
  const { data, error, isLoading, mutate } = useSWR("org-context", fetchOrgContext);
  return {
    org: data,
    isLoading,
    isError: Boolean(error),
    refresh: mutate,
  };
}
