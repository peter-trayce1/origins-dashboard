"use client";

import { createClient } from "@/lib/supabase/client";
import useSWR from "swr";
import { useOrganisation } from "./useOrganisation";

async function fetchPassports(brandId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("passports")
    .select(`
      id, product_name, sku, slug, status, completeness_score,
      primary_image_url, collection_name, category, wizard_step,
      created_at, updated_at, published_at,
      qr_codes(id, scan_count)
    `)
    .eq("brand_id", brandId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export function usePassports() {
  const { org } = useOrganisation();
  const { data, error, isLoading, mutate } = useSWR(
    org?.brandId ? `passports-${org.brandId}` : null,
    () => fetchPassports(org!.brandId)
  );

  return {
    passports: data ?? [],
    isLoading,
    isError: Boolean(error),
    refresh: mutate,
  };
}
