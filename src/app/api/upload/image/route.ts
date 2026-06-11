import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET_MEDIA ?? "originsid-media";

export async function POST(request: NextRequest) {
  // Verify auth via cookie client
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get org for namespacing the storage path
  const { data: member } = await supabase
    .from("organisation_members")
    .select("organisation_id")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .limit(1)
    .single();

  const orgId = member?.organisation_id ?? user.id;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "jpg";
  const uuid = crypto.randomUUID();
  const storagePath = `${orgId}/product_images/${uuid}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const service = createServiceClient();

  const ALLOWED_IMAGE_TYPES = [
    "image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml",
  ];

  // Create the bucket if it doesn't exist yet (idempotent — ignores "already exists")
  await service.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 10485760,
    allowedMimeTypes: ALLOWED_IMAGE_TYPES,
  });

  // createBucket is a no-op once the bucket exists, so update the allowed types
  // explicitly to make sure an existing bucket also accepts AVIF.
  await service.storage.updateBucket(BUCKET, {
    public: true,
    fileSizeLimit: 10485760,
    allowedMimeTypes: ALLOWED_IMAGE_TYPES,
  });

  const { error } = await service.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
  return NextResponse.json({ url: publicUrl });
}
