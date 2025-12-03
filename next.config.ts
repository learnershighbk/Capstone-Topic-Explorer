import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/ssr'],
  },
};

export default nextConfig;
