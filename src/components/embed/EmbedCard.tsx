interface Props {
  passport: {
    product_name: string;
    primary_image_url: string | null;
    product_description: string | null;
    consumer_transparency_summary: string | null;
    completeness_score: number | null;
    brands: { name: string; logo_url: string | null } | null;
  };
  publicUrl: string;
  theme: string;
}

export function EmbedCard({ passport, publicUrl, theme }: Props) {
  const isDark = theme === "dark";
  const bg = isDark ? "#111" : "#ffffff";
  const text = isDark ? "#ffffff" : "#0A0A0A";
  const border = isDark ? "#222" : "#E8E8E6";
  const sub = isDark ? "#999" : "#525252";
  const brand = passport.brands as { name: string; logo_url: string | null } | null;
  const score = passport.completeness_score ?? 0;

  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 12,
      overflow: "hidden",
      fontFamily: "Inter, -apple-system, sans-serif",
      maxWidth: 320,
    }}>
      {passport.primary_image_url && (
        <img
          src={passport.primary_image_url}
          alt={passport.product_name}
          style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }}
        />
      )}
      <div style={{ padding: "16px" }}>
        {brand && (
          <div style={{ fontSize: 11, color: sub, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            {brand.name}
          </div>
        )}
        <div style={{ fontSize: 15, fontWeight: 600, color: text, marginBottom: 8 }}>
          {passport.product_name}
        </div>
        {(passport.consumer_transparency_summary || passport.product_description) && (
          <div style={{ fontSize: 12, color: sub, lineHeight: 1.5, marginBottom: 12 }}>
            {(passport.consumer_transparency_summary ?? passport.product_description ?? "").slice(0, 100)}
            {(passport.consumer_transparency_summary ?? passport.product_description ?? "").length > 100 ? "…" : ""}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: text,
              textDecoration: "none",
              background: isDark ? "#222" : "#F4F4F3",
              padding: "6px 12px",
              borderRadius: 6,
              border: `1px solid ${border}`,
            }}
          >
            View passport →
          </a>
          <div style={{ fontSize: 10, color: sub }}>
            <span style={{ fontWeight: 600, color: score >= 70 ? "#166534" : text }}>{score}%</span> complete
          </div>
        </div>
      </div>
    </div>
  );
}
