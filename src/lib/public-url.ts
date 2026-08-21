// Canonical public passport URLs.
//
// All consumer-facing passport links (QR targets, share/preview links) must use
// the PUBLIC PASSPORT domain (passport.knownobjects.io) — never the app /
// dashboard domain (app.knownobjects.io), which is not for public traffic and
// requires no public passport journey to pass through it. Keep this the single
// source of truth so the two domains can never drift.

const DEFAULT_PUBLIC_PASSPORT_URL = "https://passport.knownobjects.io";

// Base URL of the public passport domain, always HTTPS in production and never
// with a trailing slash.
export function publicPassportBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_PUBLIC_PASSPORT_URL || DEFAULT_PUBLIC_PASSPORT_URL;
  return raw.replace(/\/+$/, "");
}

// Smart scan-redirect entry for a passport code. The /c/:code route resolves
// published → public page, draft → holding page, and legacy ORI-/KO- codes.
export function qrTargetUrl(passportCode: string): string {
  return `${publicPassportBaseUrl()}/c/${passportCode}`;
}

// Direct public passport page for a slug.
export function publicPassportUrl(slug: string): string {
  return `${publicPassportBaseUrl()}/p/${slug}`;
}
