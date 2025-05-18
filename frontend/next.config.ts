// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  allowedDevOrigins: ['http://localhost:3000'],
  images: {
    domains: ['firebasestorage.googleapis.com,','maps.googleapis.com'],

  },
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
  async rewrites() {
    return [
      {
        // Rewrite requests to /__/auth/* to the Firebase Auth domain
        source: '/__/auth/:path*',
        destination: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com/__/auth/:path*`,
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