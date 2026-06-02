interface Props {
  passport: {
    product_name: string;
    product_description: string | null;
    consumer_transparency_summary: string | null;
    primary_image_url: string | null;
    sustainability_summary: string | null;
    slug: string | null;
    brands: { name: string; logo_url: string | null } | null;
    product_materials: { material_name: string; percentage: number | null }[];
    care_instructions: { type: string; instruction: string }[];
    circularity_actions: { type: string; title: string; url: string | null }[];
  };
  publicUrl: string;
  theme: string;
}

export function EmbedFull({ passport, publicUrl, theme }: Props) {
  const isDark = theme === "dark";
  const bg = isDark ? "#111" : "#ffffff";
  const text = isDark ? "#ffffff" : "#0A0A0A";
  const border = isDark ? "#222" : "#E8E8E6";
  const sub = isDark ? "#999" : "#525252";
  const sectionBg = isDark ? "#1a1a1a" : "#F9F9F8";
  const brand = passport.brands as { name: string; logo_url: string | null } | null;

  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 12,
      overflow: "hidden",
      fontFamily: "Inter, -apple-system, sans-serif",
      maxWidth: 480,
    }}>
      {passport.primary_image_url && (
        <img src={passport.primary_image_url} alt={passport.product_name} style={{ width: "100%", height: 240, objectFit: "cover", display: "block" }} />
      )}

      <div style={{ padding: 20 }}>
        {brand && (
          <div style={{ fontSize: 11, color: sub, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
            {brand.name}
          </div>
        )}
        <div style={{ fontSize: 18, fontWeight: 700, color: text, marginBottom: 12 }}>
          {passport.product_name}
        </div>

        {passport.consumer_transparency_summary && (
          <div style={{ background: sectionBg, borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: sub, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Transparency</div>
            <div style={{ fontSize: 12, color: sub, lineHeight: 1.6 }}>{passport.consumer_transparency_summary}</div>
          </div>
        )}

        {passport.product_materials.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: sub, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Materials</div>
            {passport.product_materials.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: text, padding: "4px 0", borderBottom: i < passport.product_materials.length - 1 ? `1px solid ${border}` : "none" }}>
                <span>{m.material_name}</span>
                {m.percentage && <span style={{ color: sub }}>{m.percentage}%</span>}
              </div>
            ))}
          </div>
        )}

        {passport.care_instructions.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: sub, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Care</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {passport.care_instructions.map((c, i) => (
                <span key={i} style={{ fontSize: 11, background: sectionBg, color: sub, padding: "3px 8px", borderRadius: 4 }}>{c.instruction}</span>
              ))}
            </div>
          </div>
        )}

        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            textAlign: "center",
            fontSize: 13,
            fontWeight: 600,
            color: isDark ? "#000" : "#fff",
            background: isDark ? "#fff" : "#0A0A0A",
            padding: "10px 16px",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          View full product passport
        </a>
      </div>
    </div>
  );
}
