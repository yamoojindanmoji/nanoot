import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'i.pravatar.cc' },
      { hostname: 'images.unsplash.com' },
      { hostname: '*.supabase.co' },
      { hostname: 'www.coupang.com' },
      { hostname: '*.coupangcdn.com' },
    ],
  },
};

export default nextConfig;