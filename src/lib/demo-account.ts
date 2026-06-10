// Accounts allowed to override the brand name + logo per passport (demo accounts).
// NEXT_PUBLIC_ so it is available on both client and server. Comma-separated.
const DEMO_EMAILS = (process.env.NEXT_PUBLIC_DEMO_EMAILS ?? "demo@origins-id.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isDemoEmail(email: string | null | undefined): boolean {
  return !!email && DEMO_EMAILS.includes(email.toLowerCase());
}
