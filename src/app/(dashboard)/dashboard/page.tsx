import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FileText,
  CheckCircle,
  QrCode,
  Eye,
  Plus,
  Upload,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { BillingAlert } from "@/components/billing/BillingAlert";
import { getOrganisationBilling, getActivePassportCount } from "@/lib/billing";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CompletenessScore } from "@/components/shared/CompletenessScore";
import { formatRelativeDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

async function getDashboardData(brandId: string) {
  const supabase = await createClient();

  const [passportsRes, scansRes, qrRes] = await Promise.all([
    supabase
      .from("passports")
      .select("id, product_name, status, completeness_score, primary_image_url, passport_code, updated_at, slug")
      .eq("brand_id", brandId)
      .order("updated_at", { ascending: false })
      .limit(20),
    supabase
      .from("scans")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", brandId),
    supabase
      .from("qr_codes")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", brandId),
  ]);

  const passports = passportsRes.data ?? [];
  const totalPassports = passports.length;
  const publishedPassports = passports.filter((p) => p.status === "published").length;
  const draftPassports = passports.filter((p) => p.status === "draft").length;

  return {
    totalPassports,
    publishedPassports,
    draftPassports,
    totalScans: scansRes.count ?? 0,
    qrCodes: qrRes.count ?? 0,
    recentPassports: passports.slice(0, 6),
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("organisation_members")
    .select("organisation_id")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .limit(1)
    .single();

  if (!member) redirect("/onboarding");

  const { data: brand } = await supabase
    .from("brands")
    .select("id, name")
    .eq("organisation_id", member.organisation_id)
    .limit(1)
    .single();

  if (!brand) redirect("/onboarding");

  const [data, orgBilling, activePassportCount] = await Promise.all([
    getDashboardData(brand.id),
    getOrganisationBilling(member.organisation_id),
    getActivePassportCount(brand.id),
  ]);

  const stats = [
    {
      label: "Total passports",
      value: data.totalPassports,
      icon: FileText,
      href: "/passports",
    },
    {
      label: "Published",
      value: data.publishedPassports,
      icon: CheckCircle,
      href: "/passports?status=published",
      accent: true,
    },
    {
      label: "QR codes",
      value: data.qrCodes,
      icon: QrCode,
      href: "/passports",
    },
    {
      label: "Total scans",
      value: data.totalScans,
      icon: Eye,
      href: "/analytics",
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <PageHeader
        title={`Welcome back`}
        description={`Here's what's happening with ${brand.name}`}
        actions={
          <Link
            href="/passports/new"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-transparent bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New passport
          </Link>
        }
      />

      {/* Billing alert — shown at >= 80% usage */}
      <BillingAlert activeCount={activePassportCount} limit={orgBilling.passportLimit} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="border border-[#E8E8E6] shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] hover:shadow-[0_4px_6px_-1px_rgb(0_0_0/0.06)] transition-shadow cursor-pointer">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-[#8C8C8C] uppercase tracking-wide">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-black mt-1 tabular-nums">
                        {stat.value}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-[#F4F4F3] flex items-center justify-center">
                      <Icon className="h-4 w-4 text-[#525252]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-black mb-3">Quick actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Create new passport",
              description: "Add a new product passport manually",
              icon: Plus,
              href: "/passports/new",
              primary: true,
            },
            {
              label: "Bulk upload products",
              description: "Import products from a CSV file",
              icon: Upload,
              href: "/bulk-upload",
            },
            {
              label: "AI Passport Generator",
              description: "Generate passport content with AI",
              icon: Sparkles,
              href: "/ai-generator",
            },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <div className="flex items-start gap-3 p-4 rounded-xl border border-[#E8E8E6] bg-white hover:border-black/20 hover:shadow-[0_2px_8px_0_rgb(0_0_0/0.06)] transition-all cursor-pointer group">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${action.primary ? "bg-black" : "bg-[#F4F4F3]"}`}>
                    <Icon className={`h-4 w-4 ${action.primary ? "text-white" : "text-[#525252]"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-black">{action.label}</p>
                    <p className="text-xs text-[#525252] mt-0.5">{action.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#8C8C8C] shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent passports */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-black">Recent passports</h2>
          <Link
            href="/passports"
            className="text-xs text-[#525252] hover:text-black transition-colors flex items-center gap-1"
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {data.recentPassports.length === 0 ? (
          <div className="border border-[#E8E8E6] rounded-xl bg-white p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#F4F4F3] flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-[#8C8C8C]" />
            </div>
            <h3 className="text-sm font-semibold text-black mb-1">No passports yet</h3>
            <p className="text-sm text-[#525252] mb-4">
              Create your first Digital Product Passport to get started.
            </p>
            <Link
              href="/passports/new"
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-transparent bg-primary px-2.5 text-[0.8rem] font-medium text-primary-foreground transition-all hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              Create passport
            </Link>
          </div>
        ) : (
          <div className="border border-[#E8E8E6] rounded-xl bg-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E8E6]">
                  <th className="text-left text-xs font-medium text-[#8C8C8C] px-4 py-3">Product</th>
                  <th className="hidden sm:table-cell text-left text-xs font-medium text-[#8C8C8C] px-4 py-3">Passport ID</th>
                  <th className="text-left text-xs font-medium text-[#8C8C8C] px-4 py-3">Status</th>
                  <th className="hidden md:table-cell text-left text-xs font-medium text-[#8C8C8C] px-4 py-3">Complete</th>
                  <th className="hidden lg:table-cell text-left text-xs font-medium text-[#8C8C8C] px-4 py-3">Updated</th>
                  <th className="text-right text-xs font-medium text-[#8C8C8C] px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E6]">
                {data.recentPassports.map((passport) => (
                  <tr key={passport.id} className="hover:bg-[#F9F9F8] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#F4F4F3] overflow-hidden shrink-0 flex items-center justify-center">
                          {passport.primary_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={passport.primary_image_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText className="h-4 w-4 text-[#8C8C8C]" />
                          )}
                        </div>
                        <a
                          href={`/passports/${passport.id}`}
                          className="text-sm font-medium text-black hover:underline"
                        >
                          {passport.product_name || "Untitled passport"}
                        </a>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3">
                      {passport.passport_code ? (
                        <span className="font-mono text-xs text-[#525252] bg-[#F4F4F2] border border-[#E8E8E6] px-1.5 py-0.5 rounded">
                          {passport.passport_code}
                        </span>
                      ) : (
                        <span className="text-sm text-[#BDBDBB]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={passport.status as "draft" | "published" | "archived"} />
                    </td>
                    <td className="hidden md:table-cell px-4 py-3">
                      <CompletenessScore score={passport.completeness_score} size="sm" />
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3">
                      <span className="text-xs text-[#8C8C8C] flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeDate(passport.updated_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {passport.status === "published" && passport.slug && (
                          <a
                            href={`/p/${passport.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#525252] hover:text-black transition-colors flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </a>
                        )}
                        <Link
                          href={`/passports/${passport.id}`}
                          className="text-xs font-medium text-black hover:underline flex items-center gap-1"
                        >
                          <TrendingUp className="h-3 w-3" />
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
