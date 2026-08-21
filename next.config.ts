import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "*.supabase.co" },
      { hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/embed/:path*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
  // Rebrand: existing printed QR codes point at the old origins-id.com domains.
  // Keep the QR codes unchanged and redirect those hosts to the Known Objects
  // equivalents, preserving the path (all these paths already serve on
  // knownobjects.io). Requires passport.origins-id.com and app.origins-id.com
  // to be attached to this Vercel project so requests reach the app.
  async redirects() {
    return [
      // Public passport scan entry must live on the public passport domain, not
      // the app/dashboard domain. Bounce any /c/ hit on the app host over to the
      // passport host so existing/printed app-domain QR codes keep working.
      {
        source: "/c/:code*",
        has: [{ type: "host", value: "app.knownobjects.io" }],
        destination: "https://passport.knownobjects.io/c/:code*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "passport.origins-id.com" }],
        destination: "https://passport.knownobjects.io/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "app.origins-id.com" }],
        destination: "https://app.knownobjects.io/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
