// Sentry edge runtime configuration
// To enable: npm install @sentry/nextjs && set SENTRY_DSN env var

const SENTRY_DSN = process.env.SENTRY_DSN

if (SENTRY_DSN) {
  import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 0.1,
    })
  })
}
