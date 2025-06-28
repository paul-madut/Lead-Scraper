/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['firebasestorage.googleapis.com','maps.googleapis.com'],
    unoptimized: true,
  },
  // Remove headers and rewrites - handle these in firebase.json and your code
};

module.exports = nextConfig;