import { createClient } from "./supabase/server";

const MEDIA_BUCKET = process.env.SUPABASE_STORAGE_BUCKET_MEDIA ?? "originsid-media";
const DOCS_BUCKET = process.env.SUPABASE_STORAGE_BUCKET_DOCUMENTS ?? "originsid-documents";

export async function getUploadUrl(params: {
  organisationId: string;
  brandId: string;
  purpose: string;
  filename: string;
  mimeType: string;
}): Promise<{ uploadUrl: string; storagePath: string; publicUrl: string }> {
  const supabase = await createClient();
  const ext = params.filename.split(".").pop() ?? "bin";
  const uuid = crypto.randomUUID();
  const storagePath = `${params.organisationId}/${params.brandId}/${params.purpose}/${uuid}.${ext}`;
  const bucket = params.purpose === "cert_document" ? DOCS_BUCKET : MEDIA_BUCKET;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    throw new Error(`Failed to create upload URL: ${error?.message}`);
  }

  const publicUrl =
    params.purpose === "cert_document"
      ? data.signedUrl
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${storagePath}`;

  return { uploadUrl: data.signedUrl, storagePath, publicUrl };
}

export function getPublicUrl(storagePath: string, isDocument = false): string {
  const bucket = isDocument ? DOCS_BUCKET : MEDIA_BUCKET;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${storagePath}`;
}
