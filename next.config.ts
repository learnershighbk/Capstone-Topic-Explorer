import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: '**',
      },
    ],
  },
  serverExternalPackages: ['@supabase/ssr'],
};

export default nextConfig;
