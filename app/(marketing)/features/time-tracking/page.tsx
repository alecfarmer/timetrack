import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Check,
  MapPin,
  WifiOff,
  Camera,
  Fingerprint,
} from "lucide-react"

const features = [
  {
    title: "GPS-verified clock-in",
    description:
      "Employees clock in with a single tap. GPS coordinates are captured automatically to verify on-site presence — no badge readers, no hardware, no IT setup required.",
    icon: MapPin,
  },
  {
    title: "Offline-first architecture",
    description:
      "No signal at the job site? No problem. Clock events are stored locally in IndexedDB and auto-sync when connectivity returns. Exponential backoff ensures nothing is lost.",
    icon: WifiOff,
  },
  {
    title: "Photo verification",
    description:
      "Optional selfie capture at clock-in for identity verification. Photos are stored securely and visible only to admins — eliminating buddy punching without invasive biometrics.",
    icon: Camera,
  },
  {
    title: "Geofencing",
    description:
      "Define a radius around each work location. Employees can only clock in when they are physically within the geofence. Configurable per location with real-time boundary alerts.",
    icon: Fingerprint,
  },
]

const steps = [
  {
    number: "01",
    title: "Set up locations",
    description:
      "Add your work sites with addresses. KPR geocodes them automatically and sets a default geofence radius you can adjust.",
  },
  {
    number: "02",
    title: "Invite your team",
    description:
      "Send email invites or share a link. Employees download the app, sign in, and they are ready to clock in. No training needed.",
  },
  {
    number: "03",
    title: "Track attendance in real time",
    description:
      "See who is on-site, who clocked in late, and who is approaching overtime — all from a single admin dashboard that updates in real time.",
  },
]

const highlights = [
  "One-tap clock-in from any mobile device",
  "Sub-200ms API response times at any scale",
  "Works on iOS, Android, and desktop browsers",
  "Automatic timezone detection and UTC storage",
  "Real-time admin dashboard with live activity feed",
  "7-day offline queue with automatic retry",
]

export default function TimeTrackingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] mb-6">
            One tap. Verified. Done.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            GPS-verified time tracking that works everywhere — even offline.
            Replace badge readers, paper timesheets, and buddy punching with a
            single app your team already knows how to use.
          </p>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-24 sm:py-32 border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 block">
              Core capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Built for field teams, job sites, and distributed workforces.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-border rounded-xl overflow-hidden border border-border">
            {features.map((feature) => (
              <div key={feature.title} className="bg-card p-8 sm:p-10">
                <feature.icon className="h-6 w-6 text-foreground mb-5" />
                <h3 className="text-lg font-semibold mb-3 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 sm:py-32 border-t border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 block">
              How it works
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Up and running in under 10 minutes.
            </h2>
          </div>

          <div className="space-y-12">
            {steps.map((step) => (
              <div
                key={step.number}
                className="md:grid md:grid-cols-[80px_1fr] md:gap-8"
              >
                <div className="mb-3 md:mb-0">
                  <span className="text-3xl font-semibold text-muted-foreground/30">
                    {step.number}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-24 sm:py-32 border-t border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="md:grid md:grid-cols-2 md:gap-16">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
                Everything you need. Nothing you don&apos;t.
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                KPR replaces an entire stack of legacy tools with a single
                platform that works on any device, in any environment, at any
                scale.
              </p>
            </div>
            <ul className="space-y-4 mt-8 md:mt-0">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="h-4 w-4 shrink-0 mt-0.5 text-foreground" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 sm:py-32 border-t border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
            Start tracking attendance today.
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Free for up to 5 employees. No credit card required.
          </p>
          <Link href="/signup">
            <Button size="lg" className="gap-2 h-12 px-8 text-base">
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
