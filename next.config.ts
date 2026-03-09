// next.config.js
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
   serverExternalPackages: ['jsdom'], // Add this to handle jsdom

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sheatwork.com',
        pathname: '/**',
      },
      {
        protocol: 'http',  // Add this for http URLs
        hostname: 'sheatwork.com',
        pathname: '/**',
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },

        {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
         protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
        pathname: "/**",
      }
    ],
  },
};

export default nextConfig;