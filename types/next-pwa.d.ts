declare module "next-pwa" {
  import { NextConfig } from "next"

  interface RuntimeCacheEntry {
    urlPattern: RegExp | string
    handler: "CacheFirst" | "CacheOnly" | "NetworkFirst" | "NetworkOnly" | "StaleWhileRevalidate"
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD"
    options?: {
      cacheName?: string
      networkTimeoutSeconds?: number
      expiration?: {
        maxEntries?: number
        maxAgeSeconds?: number
        purgeOnQuotaError?: boolean
      }
      cacheableResponse?: {
        statuses?: number[]
        headers?: Record<string, string>
      }
      matchOptions?: {
        ignoreSearch?: boolean
        ignoreMethod?: boolean
        ignoreVary?: boolean
      }
      fetchOptions?: RequestInit
      plugins?: unknown[]
    }
  }

  interface PWAConfig {
    dest?: string
    disable?: boolean
    register?: boolean
    scope?: string
    sw?: string
    skipWaiting?: boolean
    runtimeCaching?: RuntimeCacheEntry[]
    publicExcludes?: string[]
    buildExcludes?: (string | RegExp)[]
    cacheOnFrontEndNav?: boolean
    cacheStartUrl?: boolean
    dynamicStartUrl?: boolean
    dynamicStartUrlRedirect?: string
    fallbacks?: {
      document?: string
      image?: string
      audio?: string
      video?: string
      font?: string
    }
    reloadOnOnline?: boolean
    customWorkerDir?: string
    customWorkerSrc?: string
    customWorkerDest?: string
    customWorkerPrefix?: string
  }

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig

  export default withPWA
}
