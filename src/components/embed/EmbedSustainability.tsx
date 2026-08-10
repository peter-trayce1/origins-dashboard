interface ProductMaterial {
  material_name: string;
  percentage: number | null;
  recycled_content_pct: number | null;
}

interface ImpactMetric {
  metric_key: string;
  metric_value: string | null;
  metric_unit: string | null;
  label: string | null;
}

interface Props {
  passport: {
    product_name: string;
    sustainability_summary: string | null;
    product_materials: ProductMaterial[];
    impact_metrics: ImpactMetric[];
    brands: { name: string } | null;
  };
  publicUrl: string;
  theme: string;
}

export function EmbedSustainability({ passport, publicUrl, theme }: Props) {
  const isDark = theme === "dark";
  const bg = isDark ? "#111" : "#ffffff";
  const text = isDark ? "#ffffff" : "#0A0A0A";
  const border = isDark ? "#222" : "#E8E8E6";
  const sub = isDark ? "#999" : "#525252";
  const chipBg = isDark ? "#1a2e1a" : "#f0fdf4";
  const chipText = isDark ? "#86efac" : "#166534";

  const brand = passport.brands as { name: string } | null;

  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 12,
      padding: 16,
      fontFamily: "Inter, -apple-system, sans-serif",
      maxWidth: 360,
    }}>
      <div style={{ fontSize: 10, color: sub, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
        Sustainability snapshot — {brand?.name ?? ""}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: text, marginBottom: 10 }}>
        {passport.product_name}
      </div>

      {passport.sustainability_summary && (
        <div style={{ fontSize: 12, color: sub, lineHeight: 1.5, marginBottom: 12, padding: "10px", background: isDark ? "#1a1a1a" : "#F9F9F8", borderRadius: 8 }}>
          {passport.sustainability_summary}
        </div>
      )}

      {passport.product_materials.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: sub, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Materials</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {passport.product_materials.slice(0, 4).map((m, i) => (
              <span key={i} style={{ fontSize: 11, background: chipBg, color: chipText, padding: "3px 8px", borderRadius: 4, fontWeight: 500 }}>
                {m.percentage ? `${m.percentage}% ` : ""}{m.material_name}
                {m.recycled_content_pct ? ` (${m.recycled_content_pct}% recycled)` : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      {passport.impact_metrics.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: sub, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Impact data</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {passport.impact_metrics.slice(0, 4).map((m, i) => (
              <div key={i} style={{ background: isDark ? "#1a1a1a" : "#F9F9F8", borderRadius: 6, padding: "8px 10px" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: text }}>{m.metric_value}{m.metric_unit}</div>
                <div style={{ fontSize: 10, color: sub }}>{m.label ?? m.metric_key}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <a
        href={publicUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: 11, color: sub, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
      >
        Full product passport via knownobjects.io →
      </a>
    </div>
  );
}
