import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Security Headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ]
  },

  // Logging untuk production
  logging: {
    fetches: { fullUrl: false },
  },

  // Compress output
  compress: true,

  // Power by header
  poweredByHeader: false,
}

export default nextConfig