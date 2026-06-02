export interface TemplateConfig {
  id: "quick" | "standard" | "advanced";
  label: string;
  badge?: string;
  description: string;
  recommended?: boolean;
  filename: string;
  csv: string;
}

const QUICK_CSV = `Product Name,Category,Country of Origin,Material Composition,Factory Name,Collection,Season,GTIN / Barcode
Organic Cotton Tee,Tops,India,"98% Organic Cotton; 2% Elastane",Textil Verde Factory,Spring Collection,SS26,5901234123457
Recycled Denim Jacket,Outerwear,Portugal,"80% Recycled Cotton; 20% Recycled Polyester",Teixeira & Silva,Spring Collection,SS26,
Linen Wide-Leg Trousers,Bottoms,Belgium,"100% European Flax Linen",Linificio Canapificio,Spring Collection,SS26,5901234123464`;

const STANDARD_CSV = `Product Name,Product Description,Category,Collection,Season,Country of Origin,Material Composition,Product Weight (g),Factory Name,Certifications,Care Instructions,Product Lifetime (Years),Product Story,Product URL,GTIN / Barcode,Internal Product Reference
Organic Cotton Tee,"A classic everyday tee made from GOTS-certified organic cotton grown without synthetic pesticides.",Tops,Spring Collection,SS26,India,"98% Organic Cotton; 2% Elastane",180,Textil Verde Factory,"GOTS; OEKO-TEX Standard 100","Machine wash 30°C; Do not tumble dry; Do not iron print",5,"Grown in the fertile Kutch region of India using centuries-old farming techniques.",https://brand.com/products/cotton-tee,5901234123457,INT-TEE-001
Recycled Denim Jacket,"Structured denim jacket made from 80% post-consumer recycled denim fibre.",Outerwear,Spring Collection,SS26,Portugal,"80% Recycled Cotton; 20% Recycled Polyester",620,Teixeira & Silva,"GRS","Machine wash cold; Hang to dry; Iron medium heat",8,"Each jacket repurposes the equivalent of two pairs of discarded jeans.",https://brand.com/products/denim-jacket,5901234123464,INT-JAC-002
Linen Wide-Leg Trousers,"Relaxed wide-leg trousers woven from 100% European Flax linen.",Bottoms,Spring Collection,SS26,Belgium,"100% European Flax Linen",310,Linificio Canapificio,"European Flax; OEKO-TEX Standard 100","Hand wash or machine wash 30°C; Lay flat to dry; Iron damp",10,"Our linen is grown in northern France without irrigation or pesticides — rain-fed and solar-dried.",https://brand.com/products/linen-trousers,,INT-TRS-003`;

const ADVANCED_CSV = `Product Name,Product Description,Category,Collection,Season,Country of Origin,Material Composition,Product Weight (g),Factory Name,Certifications,Care Instructions,Product Lifetime (Years),Product Story,Product URL,GTIN / Barcode,Internal Product Reference,Sustainability Summary,Carbon Footprint (kg CO₂e),Water Usage (litres),Primary Image URL,Gender,Colour,Size Range
Organic Cotton Tee,"A classic everyday tee made from GOTS-certified organic cotton.",Tops,Spring Collection,SS26,India,"98% Organic Cotton; 2% Elastane",180,Textil Verde Factory,"GOTS; OEKO-TEX Standard 100","Machine wash 30°C; Do not tumble dry",5,"Grown in Kutch, India.",https://brand.com/products/cotton-tee,5901234123457,INT-TEE-001,"Made from certified organic cotton grown without synthetic pesticides or fertilisers.",3.2,42,https://brand.com/images/cotton-tee.jpg,Unisex,White,"XS-XXL"
Recycled Denim Jacket,"Structured jacket from post-consumer recycled denim.",Outerwear,Spring Collection,SS26,Portugal,"80% Recycled Cotton; 20% Recycled Polyester",620,Teixeira & Silva,"GRS","Machine wash cold; Hang to dry",8,"Repurposes two discarded pairs of jeans.",https://brand.com/products/denim-jacket,5901234123464,INT-JAC-002,"80% of materials are post-consumer recycled, diverting waste from landfill.",8.7,65,,Unisex,Indigo,"XS-XL"`;

export const TEMPLATES: TemplateConfig[] = [
  {
    id: "quick",
    label: "Quick Start",
    description: "8 essential fields. Get passports created in minutes.",
    filename: "originsid-quick-start.csv",
    csv: QUICK_CSV,
  },
  {
    id: "standard",
    label: "Standard",
    badge: "Recommended",
    description: "16 fields covering the full product story. The best starting point for most brands.",
    recommended: true,
    filename: "originsid-standard.csv",
    csv: STANDARD_CSV,
  },
  {
    id: "advanced",
    label: "Advanced",
    description: "All supported fields including impact metrics, imagery, and sizing.",
    filename: "originsid-advanced.csv",
    csv: ADVANCED_CSV,
  },
];

export function downloadTemplate(id: TemplateConfig["id"]) {
  const tpl = TEMPLATES.find((t) => t.id === id);
  if (!tpl) return;
  const blob = new Blob([tpl.csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = tpl.filename;
  a.click();
  URL.revokeObjectURL(url);
}
