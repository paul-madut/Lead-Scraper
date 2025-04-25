// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['http://localhost:3000'],
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
      },
    ];
  },
  serverRuntimeConfig: {
    // Will be available only on the server side
    // The serverless function timeout is 60 seconds by default
    // Increase it for Google Maps API requests
    functionTimeout: 90, // 90 seconds timeout
  },
};

module.exports = nextConfig;