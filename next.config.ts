import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",  // ← Fix 1: naikkan limit upload
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rzofrnlylwvlfjvxfems.supabase.co",  // ← Fix 3: izinkan gambar dari Supabase
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
}

export default nextConfig