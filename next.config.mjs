import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  }
};

/** @type {import('next').NextConfig} */
export default function nextConfig(phase) {
  return {
    ...baseConfig,
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next'
  };
}
