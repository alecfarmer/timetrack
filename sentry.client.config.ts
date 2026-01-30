// Sentry client-side configuration
// To enable: npm install @sentry/nextjs && set SENTRY_DSN env var

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

if (SENTRY_DSN) {
  import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    })
  })
}
