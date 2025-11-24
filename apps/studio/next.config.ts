import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  logging: false,
  compress: true,
  experimental: {
      typedEnv: true,
      authInterrupts: true,
      optimizeCss: true,
      optimizeServerReact: true,
  },
  images: {
    remotePatterns: [
        {
            protocol: 'https',
            hostname: '**',
        },
    ],
    unoptimized: true,
  },
  compiler: {
      removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  productionBrowserSourceMaps: process.env.NODE_ENV === 'production',
  devIndicators: false,
};

export default nextConfig;