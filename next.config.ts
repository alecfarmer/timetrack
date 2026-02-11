import type { NextConfig } from "next"
import withPWAInit from "next-pwa"

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "supabase-cache",
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /\/api\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 5, // 5 minutes
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
})

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Use webpack for build (required for next-pwa)
  turbopack: {},
  async redirects() {
    return [
      // Old /app routes → new routes (no /app prefix)
      {
        source: "/app",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/app/:path*",
        destination: "/:path*",
        permanent: true,
      },
      // Old /landing route → root
      {
        source: "/landing",
        destination: "/",
        permanent: true,
      },
    ]
  },
}

export default withPWA(nextConfig)
