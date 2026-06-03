import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Returns true if the given Supabase auth user ID has role = 'super_admin'. */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const { data } = await serviceClient()
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role === "super_admin";
}

/**
 * Reads the current session from cookies and returns whether the user is a
 * super admin. Returns false (not 403) if unauthenticated — callers redirect.
 */
export async function currentUserIsSuperAdmin(): Promise<boolean> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    return isSuperAdmin(user.id);
  } catch {
    return false;
  }
}
