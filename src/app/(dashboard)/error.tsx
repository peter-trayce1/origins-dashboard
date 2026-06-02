"use client";

export default function DashboardError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div className="p-8 space-y-3">
      <p className="text-sm font-semibold text-red-600">Page error</p>
      <p className="text-sm text-[#525252] font-mono break-all">{error.message}</p>
      {error.digest && (
        <p className="text-xs text-[#8C8C8C]">Digest: {error.digest}</p>
      )}
    </div>
  );
}
