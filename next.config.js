/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@clerk/nextjs'],
  },
}

module.exports = nextConfig
