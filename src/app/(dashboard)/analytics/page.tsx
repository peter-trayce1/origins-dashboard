import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

async function getAnalyticsData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("organisation_members")
    .select("organisation_id")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .single();
  if (!member) return null;

  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("organisation_id", member.organisation_id)
    .single();
  if (!brand) return null;

  // Last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [scansRes, passportsRes, topPassportsRes, publishedRes] = await Promise.all([
    supabase
      .from("scans")
      .select("scanned_at, device_type, country_code")
      .eq("brand_id", brand.id)
      .gte("scanned_at", thirtyDaysAgo.toISOString())
      .order("scanned_at", { ascending: true }),

    supabase
      .from("passports")
      .select("id, product_name, status, completeness_score")
      .eq("brand_id", brand.id),

    supabase
      .from("scans")
      .select("passport_id, passports(product_name)")
      .eq("brand_id", brand.id)
      .gte("scanned_at", thirtyDaysAgo.toISOString()),

    // Published passports with all-time scan counts via qr_codes trigger
    supabase
      .from("passports")
      .select("id, product_name, primary_image_url, slug, published_at, qr_codes(scan_count)")
      .eq("brand_id", brand.id)
      .eq("status", "published")
      .order("updated_at", { ascending: false }),
  ]);

  const scans = scansRes.data ?? [];
  const passports = passportsRes.data ?? [];

  // Group scans by date
  const scansByDate: Record<string, number> = {};
  for (const scan of scans) {
    const date = new Date(scan.scanned_at).toISOString().split("T")[0];
    scansByDate[date] = (scansByDate[date] ?? 0) + 1;
  }

  // Fill in missing dates for last 30 days
  const scanData: { date: string; scans: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    scanData.push({ date: dateStr, scans: scansByDate[dateStr] ?? 0 });
  }

  // 30-day scans grouped by passport
  const thirtyDaysByPassport: Record<string, number> = {};
  for (const scan of topPassportsRes.data ?? []) {
    thirtyDaysByPassport[scan.passport_id] = (thirtyDaysByPassport[scan.passport_id] ?? 0) + 1;
  }

  // Top passports by 30d scan count (for the chart card)
  const passportScanCounts: Record<string, { name: string; count: number }> = {};
  for (const scan of topPassportsRes.data ?? []) {
    const pid = scan.passport_id;
    const passport = scan.passports as unknown as { product_name: string } | null;
    if (!passportScanCounts[pid]) {
      passportScanCounts[pid] = { name: passport?.product_name ?? "Unknown", count: 0 };
    }
    passportScanCounts[pid].count++;
  }
  const topPassports = Object.entries(passportScanCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([, v]) => v);

  // Per-published-passport breakdown (all-time + 30d)
  const publishedPassportDetails = (publishedRes.data ?? []).map((p) => {
    const qrCodes = (p.qr_codes as unknown as { scan_count: number }[] | null) ?? [];
    const allTimeScans = qrCodes.reduce((sum, q) => sum + (q.scan_count ?? 0), 0);
    return {
      id: p.id,
      name: p.product_name || "Untitled",
      slug: p.slug as string | null,
      primaryImageUrl: p.primary_image_url as string | null,
      publishedAt: p.published_at as string | null,
      allTimeScans,
      thirtyDayScans: thirtyDaysByPassport[p.id] ?? 0,
    };
  }).sort((a, b) => b.allTimeScans - a.allTimeScans);

  // Device breakdown
  const deviceBreakdown: Record<string, number> = {};
  for (const scan of scans) {
    const device = scan.device_type ?? "unknown";
    deviceBreakdown[device] = (deviceBreakdown[device] ?? 0) + 1;
  }

  return {
    totalScans: scans.length,
    totalPassports: passports.length,
    publishedPassports: passports.filter((p) => p.status === "published").length,
    scanData,
    topPassports,
    deviceBreakdown: Object.entries(deviceBreakdown).map(([device, count]) => ({ device, count })),
    avgCompleteness: passports.length
      ? Math.round(passports.reduce((sum, p) => sum + (p.completeness_score ?? 0), 0) / passports.length)
      : 0,
    publishedPassportDetails,
  };
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="Track passport scans, consumer engagement, and portfolio health over the last 30 days."
      />
      <AnalyticsDashboard data={data} />
    </div>
  );
}
