"use client";

import { useState } from "react";

interface UploadOptions {
  purpose: "product_image" | "cert_document" | "gallery" | "brand_logo" | "other";
  passportId?: string;
}

interface UploadResult {
  publicUrl: string;
  storagePath: string;
}

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function upload(file: File, options: UploadOptions): Promise<UploadResult> {
    setIsUploading(true);
    setProgress(0);

    try {
      // Get presigned URL
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          purpose: options.purpose,
          passportId: options.passportId,
        }),
      });

      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, storagePath, publicUrl } = await res.json();

      // Upload directly to Supabase Storage
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      setProgress(100);

      // Register file in DB
      await fetch("/api/upload/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storagePath,
          publicUrl,
          filename: file.name,
          mimeType: file.type,
          fileSize: file.size,
          purpose: options.purpose,
          passportId: options.passportId,
        }),
      });

      return { publicUrl, storagePath };
    } finally {
      setIsUploading(false);
    }
  }

  return { upload, isUploading, progress };
}
