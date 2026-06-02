"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function SupabaseSetupBanner() {
  if (isSupabaseConfigured()) {
    return null;
  }

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-950">
      <AlertCircle />
      <AlertTitle>Supabase is not configured</AlertTitle>
      <AlertDescription>
        Sign-in will not work until you add real values to{" "}
        <code className="text-xs">.env.local</code>:{" "}
        <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> from your
        Supabase project (Settings → API). Restart the dev server after saving.
      </AlertDescription>
    </Alert>
  );
}
