import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // uncomment this line when you build this build,

  basePath: process.env.IGRP_APP_BASE_PATH || '',
  
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nosi.cv',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
  },
};

export default nextConfig;
