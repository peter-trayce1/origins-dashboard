import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/super-admin";
import { CustomerManagementClient } from "./CustomerManagementClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Customer Management — Origins" };

export default async function CustomerManagementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!await isSuperAdmin(user.id)) redirect("/dashboard");

  return <CustomerManagementClient />;
}
