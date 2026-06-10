import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev network host to access Next.js dev resources (webpack HMR)
  // Add any other local hosts as needed, e.g. ['10.14.231.170']
  allowedDevOrigins: ['10.14.231.170'],
};

export default nextConfig;
