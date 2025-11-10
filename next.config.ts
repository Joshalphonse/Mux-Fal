import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    MUX_PLAYBACK_ID: process.env.MUX_PLAYBACK_ID,
    DEMO_MODE: process.env.DEMO_MODE,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.mux.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  /* config options here */
};  

export default nextConfig;
