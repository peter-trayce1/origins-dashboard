import { PageHeader } from "@/components/layout/PageHeader";

const CONNECTIONS = [
  {
    name: "Shopify",
    description: "Sync products from your Shopify store. Automatically create passport drafts for new products.",
    logo: "🛍️",
    status: "coming_soon",
  },
  {
    name: "GOTS / Textile Exchange",
    description: "Import certification data directly from GOTS and Textile Exchange databases.",
    logo: "🌿",
    status: "coming_soon",
  },
  {
    name: "EcoVadis",
    description: "Pull supplier sustainability ratings and evidence directly into your supply chain data.",
    logo: "📊",
    status: "coming_soon",
  },
  {
    name: "Seguno / Klaviyo",
    description: "Embed passport QR codes in email campaigns and product marketing.",
    logo: "📧",
    status: "coming_soon",
  },
  {
    name: "WooCommerce",
    description: "Connect your WooCommerce store to sync product data automatically.",
    logo: "🛒",
    status: "coming_soon",
  },
  {
    name: "REST API",
    description: "Use the OriginsID API to push data from any system — PLM, ERP, or custom platforms.",
    logo: "⚡",
    status: "available",
  },
];

export default function DataConnectionsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Data connections"
        description="Connect OriginsID to your existing systems to keep passport data fresh automatically."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CONNECTIONS.map((conn) => (
          <div
            key={conn.name}
            className="border border-[#E8E8E6] rounded-xl p-5 flex gap-4"
          >
            <div className="text-2xl shrink-0">{conn.logo}</div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-black">{conn.name}</p>
                {conn.status === "coming_soon" ? (
                  <span className="text-xs bg-[#F4F4F3] text-[#8C8C8C] px-2 py-0.5 rounded-full">Coming soon</span>
                ) : (
                  <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">Available</span>
                )}
              </div>
              <p className="text-xs text-[#525252] leading-relaxed">{conn.description}</p>
              {conn.status === "available" && (
                <button className="text-xs font-medium text-black hover:underline">
                  View API docs →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border border-[#E8E8E6] rounded-xl p-5 bg-[#F9F9F8]">
        <p className="text-sm font-medium text-black mb-1">Request an integration</p>
        <p className="text-xs text-[#525252]">
          Need a specific integration? Let us know at{" "}
          <a href="mailto:integrations@originsid.com" className="underline hover:text-black">
            integrations@originsid.com
          </a>
        </p>
      </div>
    </div>
  );
}
