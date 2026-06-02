import { z } from "zod";

export const aiGenerateSchema = z.object({
  productDescription: z.string().min(10, "Please provide at least a brief product description"),
  brandContext: z.string().optional(),
  passportId: z.string().uuid().optional(),
  fieldsToGenerate: z.array(z.string()).optional(),
});

export type AIGenerateInput = z.infer<typeof aiGenerateSchema>;

export const aiSuggestSchema = z.object({
  passportId: z.string().uuid(),
  fieldKey: z.string(),
  currentValue: z.string().optional(),
  context: z.string().optional(),
});

export type AISuggestInput = z.infer<typeof aiSuggestSchema>;
