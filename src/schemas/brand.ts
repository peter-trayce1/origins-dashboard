import { z } from "zod";

export const onboardingSchema = z.object({
  organisation_name:   z.string().min(2, "Organisation name is required"),
  brand_name:          z.string().min(2, "Brand name is required"),
  website_url:         z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  industry:            z.string().min(1, "Please select an industry"),
  product_category:    z.string().min(1, "Please select a product category"),
  country:             z.string().min(1, "Please select a country"),
  logo_url:            z.string().optional(),
  sustainability_story: z.string().optional(),
  default_theme:       z.string().default("origins_standard"),
  onboarding_method:   z.enum(["manual", "csv", "integration"]).default("manual"),
});

export const brandSettingsSchema = z.object({
  name: z.string().min(2, "Brand name is required"),
  website_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  contact_email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  country: z.string().optional(),
  sustainability_story: z.string().optional(),
  primary_colour: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Please enter a valid hex colour"),
  default_theme: z.string().default("origins_standard"),
  default_footer: z.string().optional(),
  social_links: z.object({
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    tiktok: z.string().optional(),
  }).optional(),
  default_cta_links: z.object({
    repair: z.string().optional(),
    resale: z.string().optional(),
    recycle: z.string().optional(),
    take_back: z.string().optional(),
  }).optional(),
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
export type BrandSettingsFormData = z.infer<typeof brandSettingsSchema>;
export type BrandSettingsInput = BrandSettingsFormData;
