export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen">
      <section className="pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] mb-4 text-center">
            Terms of Service
          </h1>
          <p className="text-center text-muted-foreground mb-2">
            Last updated: February 1, 2026
          </p>
        </div>
      </section>

      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 prose-marketing">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the KPR platform, mobile applications, and related services (the &ldquo;Service&rdquo;) provided by KPR Technologies, Inc. (&ldquo;KPR,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization to these Terms.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            KPR provides a cloud-based time and attendance platform that includes GPS-verified clock-in/out, compliance monitoring, payroll integration, team analytics, and employee engagement features. The Service is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo;
          </p>

          <h2>3. Account Registration</h2>
          <p>
            To use the Service, you must create an account with accurate and complete information. You are responsible for maintaining the security of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use.
          </p>

          <h2>4. Subscription Plans and Billing</h2>
          <p>
            KPR offers Free, Pro, and Enterprise subscription plans. Paid plans are billed monthly or annually in advance. Prices are subject to change with 30 days&apos; notice. You may upgrade, downgrade, or cancel at any time. No refunds are provided for partial billing periods except as required by law.
          </p>

          <h2>5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to the Service or related systems</li>
            <li>Interfere with or disrupt the Service or servers</li>
            <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
            <li>Use the Service to collect data in violation of applicable privacy laws</li>
            <li>Resell or redistribute the Service without authorization</li>
          </ul>

          <h2>6. Data Ownership</h2>
          <p>
            You retain all rights to the data you submit to the Service (&ldquo;Your Data&rdquo;). You grant KPR a limited license to use Your Data solely to provide, improve, and secure the Service. We will not access Your Data except as necessary to provide the Service, prevent fraud, or comply with law.
          </p>

          <h2>7. Privacy</h2>
          <p>
            Our collection and use of personal information is governed by our <a href="/legal/privacy">Privacy Policy</a>, which is incorporated into these Terms by reference.
          </p>

          <h2>8. Intellectual Property</h2>
          <p>
            The Service, including its design, features, code, and documentation, is owned by KPR and protected by intellectual property laws. These Terms do not grant you any rights to our trademarks, trade names, or logos.
          </p>

          <h2>9. Third-Party Integrations</h2>
          <p>
            The Service integrates with third-party payroll providers, identity providers, and other services. Your use of these integrations is subject to the respective third party&apos;s terms. KPR is not responsible for third-party services.
          </p>

          <h2>10. Service Availability and SLA</h2>
          <p>
            We target 99.9% uptime for the Service. Enterprise customers may negotiate specific SLA guarantees. We are not liable for downtime caused by factors outside our reasonable control, including internet outages, force majeure events, or scheduled maintenance (for which we provide advance notice).
          </p>

          <h2>11. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, KPR shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits, data loss, or business interruption, regardless of the theory of liability. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
          </p>

          <h2>12. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless KPR and its officers, directors, employees, and agents from any claims, liabilities, damages, and expenses (including reasonable attorney fees) arising from your use of the Service, violation of these Terms, or violation of any third-party rights.
          </p>

          <h2>13. Termination</h2>
          <p>
            Either party may terminate these Terms at any time. Upon termination, your right to use the Service ceases immediately. We will retain Your Data for 30 days after termination, during which you may export it. After 30 days, we will delete Your Data unless retention is required by law.
          </p>

          <h2>14. Modifications</h2>
          <p>
            We may modify these Terms at any time. Material changes will be communicated via email or in-app notice at least 30 days before taking effect. Continued use after changes constitutes acceptance.
          </p>

          <h2>15. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of California, without regard to conflict of law principles. Any disputes shall be resolved in the state or federal courts located in San Francisco County, California.
          </p>

          <h2>16. Contact</h2>
          <p>
            For questions about these Terms, contact us at:
          </p>
          <ul>
            <li>Email: <strong>legal@kpr.app</strong></li>
            <li>Address: KPR Technologies, Inc., San Francisco, CA</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
