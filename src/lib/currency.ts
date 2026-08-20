// Shared currency / region logic.
//
// This is the single source of truth for "which currency should this visitor
// see?". Both the pricing page (display) and the Stripe checkout endpoint
// (Price ID selection) import from here so the shown price and the charged
// price can never diverge. Do NOT duplicate country lists elsewhere.

export type Currency = "GBP" | "EUR";
export type CurrencyPlan = "essentials" | "growth";
export type CurrencyInterval = "monthly" | "annual";

// Cookie that stores a manual currency override chosen on the pricing page.
// When present it takes precedence over geolocation.
export const CURRENCY_COOKIE = "ko_currency";
// 1 year, in seconds.
export const CURRENCY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

// Countries billed in EUR. Includes the Eurozone plus European countries whose
// local currency is NOT the euro (Sweden/SEK, Denmark/DKK, etc.) — by product
// decision these all use the EUR price book. Everywhere else defaults to GBP.
const EUR_COUNTRIES = new Set<string>([
  // Eurozone
  "AT", "BE", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV",
  "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES",
  // European non-euro currencies → EUR price book
  "SE", // Sweden (SEK)
  "DK", // Denmark (DKK)
  "NO", // Norway (NOK)
  "IS", // Iceland (ISK)
  "CH", // Switzerland (CHF)
  "LI", // Liechtenstein (CHF)
  "PL", // Poland (PLN)
  "CZ", // Czechia (CZK)
  "HU", // Hungary (HUF)
  "RO", // Romania (RON)
  "BG", // Bulgaria (BGN)
  // Microstates that use the euro
  "MC", "SM", "VA", "AD",
]);

// Validate an untrusted string as a currency (e.g. cookie / request body).
export function parseCurrency(value: string | null | undefined): Currency | null {
  return value === "GBP" || value === "EUR" ? value : null;
}

// Country (ISO-3166 alpha-2) → currency.
//   GB → GBP · European countries → EUR · everywhere else → GBP.
export function currencyForCountry(country: string | null | undefined): Currency {
  if (!country) return "GBP";
  const c = country.toUpperCase();
  if (c === "GB") return "GBP";
  if (EUR_COUNTRIES.has(c)) return "EUR";
  return "GBP";
}

// Resolve the currency to use, in strict priority order:
//   1. Manual override cookie (GBP/EUR)
//   2. Vercel-detected country (x-vercel-ip-country)
//   3. Default GBP
export function resolveCurrency(opts: {
  cookie?: string | null;
  country?: string | null;
}): Currency {
  return parseCurrency(opts.cookie) ?? currencyForCountry(opts.country);
}

export const CURRENCY_SYMBOL: Record<Currency, string> = { GBP: "£", EUR: "€" };

// Fixed, hand-set prices. NO live FX conversion — these are the exact amounts
// shown on the pricing page and must match the amounts on the Stripe Prices.
export const PRICE_BOOK: Record<
  CurrencyPlan,
  Record<CurrencyInterval, Record<Currency, number>>
> = {
  essentials: {
    monthly: { GBP: 150, EUR: 200 },
    annual: { GBP: 1500, EUR: 2000 },
  },
  growth: {
    monthly: { GBP: 450, EUR: 550 },
    annual: { GBP: 4500, EUR: 5400 },
  },
};

// Formatted price string, e.g. "£150" / "€2,000".
export function formatPrice(
  plan: CurrencyPlan,
  interval: CurrencyInterval,
  currency: Currency
): string {
  const amount = PRICE_BOOK[plan][interval][currency];
  return `${CURRENCY_SYMBOL[currency]}${amount.toLocaleString()}`;
}
