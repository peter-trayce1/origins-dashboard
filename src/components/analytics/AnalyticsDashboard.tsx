"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart2, QrCode, Globe, Star } from "lucide-react";

interface AnalyticsData {
  totalScans: number;
  totalPassports: number;
  publishedPassports: number;
  scanData: { date: string; scans: number }[];
  topPassports: { name: string; count: number }[];
  deviceBreakdown: { device: string; count: number }[];
  avgCompleteness: number;
}

interface Props {
  data: AnalyticsData | null;
}

const SUMMARY_CARDS = (data: AnalyticsData) => [
  { label: "Total scans (30d)", value: data.totalScans, icon: QrCode },
  { label: "Published passports", value: data.publishedPassports, icon: Globe },
  { label: "Total passports", value: data.totalPassports, icon: BarChart2 },
  { label: "Avg. completeness", value: `${data.avgCompleteness}%`, icon: Star },
];

export function AnalyticsDashboard({ data }: Props) {
  if (!data) {
    return (
      <div className="border border-[#E8E8E6] rounded-xl p-8 text-center">
        <p className="text-sm text-[#525252]">Unable to load analytics. Please try again.</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SUMMARY_CARDS(data).map(({ label, value, icon: Icon }) => (
          <div key={label} className="border border-[#E8E8E6] rounded-xl p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#525252]">{label}</p>
              <Icon className="h-4 w-4 text-[#8C8C8C]" />
            </div>
            <p className="text-2xl font-semibold text-black">{value}</p>
          </div>
        ))}
      </div>

      {/* Scan chart */}
      <div className="border border-[#E8E8E6] rounded-xl p-5">
        <p className="text-sm font-semibold text-black mb-4">Scans over last 30 days</p>
        {data.totalScans === 0 ? (
          <div className="h-40 flex items-center justify-center">
            <p className="text-sm text-[#8C8C8C]">No scans yet. Publish a passport and share the QR code to start tracking.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.scanData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0A0A0A" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#0A0A0A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E6" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: "#8C8C8C" }}
                interval={6}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#8C8C8C" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{ border: "1px solid #E8E8E6", borderRadius: 8, fontSize: 12 }}
                labelFormatter={(v) => formatDate(String(v))}
                formatter={(v) => [v, "Scans"]}
              />
              <Area
                type="monotone"
                dataKey="scans"
                stroke="#0A0A0A"
                strokeWidth={2}
                fill="url(#scanGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top passports */}
        <div className="border border-[#E8E8E6] rounded-xl p-5">
          <p className="text-sm font-semibold text-black mb-4">Top passports by scans</p>
          {data.topPassports.length === 0 ? (
            <p className="text-sm text-[#8C8C8C]">No scan data yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topPassports.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs text-[#8C8C8C] w-4 shrink-0">{i + 1}</span>
                    <span className="text-sm text-black truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="h-1.5 rounded-full bg-[#0A0A0A]" style={{ width: `${Math.max(8, (p.count / data.topPassports[0].count) * 80)}px` }} />
                    <span className="text-xs text-[#525252] w-8 text-right">{p.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Device breakdown */}
        <div className="border border-[#E8E8E6] rounded-xl p-5">
          <p className="text-sm font-semibold text-black mb-4">Device types</p>
          {data.deviceBreakdown.length === 0 ? (
            <p className="text-sm text-[#8C8C8C]">No scan data yet.</p>
          ) : (
            <div className="space-y-3">
              {data.deviceBreakdown.map(({ device, count }) => (
                <div key={device} className="flex items-center justify-between">
                  <span className="text-sm text-black capitalize">{device}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 rounded-full bg-[#0A0A0A]"
                      style={{ width: `${Math.max(8, (count / data.totalScans) * 100)}px` }} />
                    <span className="text-xs text-[#525252] w-16 text-right">
                      {count} ({Math.round((count / data.totalScans) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
