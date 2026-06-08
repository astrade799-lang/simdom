import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 0, // disable router cache untuk halaman dinamis
    },
  },
}

export default nextConfig