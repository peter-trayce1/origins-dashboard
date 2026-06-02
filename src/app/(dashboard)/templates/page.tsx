import { PageHeader } from "@/components/layout/PageHeader";

const TEMPLATES = [
  {
    name: "Fashion Essential",
    description: "For everyday garments — tops, bottoms, dresses. Covers materials, care, and basic supply chain.",
    category: "Apparel",
    fields: ["Materials", "Care instructions", "Supply chain", "Product story"],
  },
  {
    name: "Premium Outerwear",
    description: "For coats, jackets, and performance wear. Includes technical specifications and durability claims.",
    category: "Apparel",
    fields: ["Materials", "Technical specs", "Certifications", "Repair services"],
  },
  {
    name: "Sustainable Hero",
    description: "For brands with strong sustainability credentials. Full environmental metrics and circular economy actions.",
    category: "Sustainability",
    fields: ["Impact metrics", "Certifications", "Circularity actions", "Full supply chain"],
  },
  {
    name: "Accessories",
    description: "For bags, shoes, jewellery, and small leather goods. Adapted for non-textile materials.",
    category: "Accessories",
    fields: ["Materials", "Provenance", "Care", "Authenticity"],
  },
  {
    name: "Sportswear",
    description: "For performance and activewear. Technical materials, performance claims, and recycling programmes.",
    category: "Sport",
    fields: ["Technical materials", "Performance data", "Recycling programme", "Certifications"],
  },
  {
    name: "Childrenswear",
    description: "For children's clothing. Focuses on safety certifications, non-toxic materials, and care instructions.",
    category: "Children",
    fields: ["Safety certifications", "Non-toxic materials", "Simple care", "Age guidance"],
  },
];

export default function TemplatesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Passport templates"
        description="Start from a template tailored to your product category. Templates pre-configure which sections and fields to prioritise."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((template) => (
          <div
            key={template.name}
            className="border border-[#E8E8E6] rounded-xl p-5 space-y-3 hover:border-black/30 transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs bg-[#F4F4F3] text-[#525252] px-2 py-0.5 rounded-full font-medium">
                  {template.category}
                </span>
                <h3 className="text-sm font-semibold text-black mt-2">{template.name}</h3>
              </div>
            </div>
            <p className="text-xs text-[#525252] leading-relaxed">{template.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {template.fields.map((f) => (
                <span key={f} className="text-xs bg-[#F9F9F8] border border-[#E8E8E6] text-[#525252] px-1.5 py-0.5 rounded">
                  {f}
                </span>
              ))}
            </div>
            <button className="text-xs font-medium text-black opacity-0 group-hover:opacity-100 transition-opacity">
              Use template →
            </button>
          </div>
        ))}
      </div>

      <div className="border border-[#E8E8E6] rounded-xl p-5 bg-[#F9F9F8] text-center">
        <p className="text-sm text-[#525252]">
          Custom templates and template sharing are coming soon for Pro and Enterprise plans.
        </p>
      </div>
    </div>
  );
}
