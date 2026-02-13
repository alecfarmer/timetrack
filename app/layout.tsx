import type { Metadata, Viewport } from "next"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { SWRProvider } from "@/components/swr-provider"
import { ToastContainer } from "@/components/notification-center"
import { TimezonePrompt } from "@/components/timezone-prompt"
import "./globals.css"

export const metadata: Metadata = {
  title: "KPR - Time & Attendance",
  description: "Personal time and attendance tracking for work location compliance",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KPR",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "KPR",
    title: "KPR - Time & Attendance",
    description: "Personal time and attendance tracking for work location compliance",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fa" },
    { media: "(prefers-color-scheme: dark)", color: "#101827" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="font-sans antialiased min-h-screen bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SWRProvider>
            <AuthProvider>
              {children}
              <ToastContainer />
              <TimezonePrompt />
            </AuthProvider>
          </SWRProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
