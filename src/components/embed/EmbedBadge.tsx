interface Props {
  passport: { product_name: string; slug: string | null };
  publicUrl: string;
  theme: string;
}

export function EmbedBadge({ passport, publicUrl, theme }: Props) {
  const isDark = theme === "dark";
  const bg = isDark ? "#0A0A0A" : "#ffffff";
  const text = isDark ? "#ffffff" : "#0A0A0A";
  const border = isDark ? "#333" : "#E8E8E6";
  const sub = isDark ? "#8C8C8C" : "#525252";

  return (
    <a
      href={publicUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 8,
        textDecoration: "none",
        fontFamily: "Inter, -apple-system, sans-serif",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7.5" stroke={text} strokeWidth="1"/>
        <path d="M8 5v3.5l2 2" stroke={text} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: text, lineHeight: 1.2 }}>
          Digital Product Passport
        </div>
        <div style={{ fontSize: 10, color: sub, lineHeight: 1.2, marginTop: 1 }}>
          {passport.product_name}
        </div>
      </div>
    </a>
  );
}
