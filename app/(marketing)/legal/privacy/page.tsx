export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen">
      <section className="pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] mb-4 text-center">
            Privacy Policy
          </h1>
          <p className="text-center text-muted-foreground mb-2">
            Last updated: February 1, 2026
          </p>
        </div>
      </section>

      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 prose-marketing">
          <h2>1. Introduction</h2>
          <p>
            KPR Technologies, Inc. (&ldquo;KPR,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is committed to protecting the privacy of our users. This Privacy Policy describes how we collect, use, disclose, and safeguard your personal information when you use our time and attendance platform, mobile applications, and related services (collectively, the &ldquo;Service&rdquo;).
          </p>
          <p>
            By using the Service, you agree to the collection and use of information in accordance with this policy. If you do not agree, please do not use the Service.
          </p>

          <h2>2. Information We Collect</h2>
          <h3>Account Information</h3>
          <p>
            When you create an account, we collect your name, email address, and password. If your employer sets up your account, they may provide this information on your behalf.
          </p>
          <h3>Location Data</h3>
          <p>
            When you clock in or out, we collect your GPS coordinates to verify your location against configured geofence zones. Location data is collected only at the moment of clock-in/out — we do not continuously track your location. You can review all location data collected about you in your account settings.
          </p>
          <h3>Time and Attendance Data</h3>
          <p>
            We collect clock-in/out timestamps, break durations, work hours, and related attendance records as part of the core Service functionality.
          </p>
          <h3>Device Information</h3>
          <p>
            We collect basic device information including device type, operating system version, and browser type for compatibility and support purposes.
          </p>
          <h3>Photos</h3>
          <p>
            If your organization enables photo verification, a selfie is captured at clock-in. Photos are stored securely and accessible only to your organization&apos;s administrators.
          </p>

          <h2>3. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul>
            <li>Provide, operate, and maintain the Service</li>
            <li>Verify employee attendance via GPS geofencing</li>
            <li>Generate reports and analytics for your organization</li>
            <li>Ensure compliance with applicable labor laws</li>
            <li>Process payroll integrations as configured by your organization</li>
            <li>Send service-related notifications</li>
            <li>Detect, prevent, and address technical issues and security threats</li>
            <li>Improve and develop new features</li>
          </ul>

          <h2>4. Data Sharing and Disclosure</h2>
          <p>We do not sell your personal information. We share data only as follows:</p>
          <ul>
            <li><strong>With your employer:</strong> Your attendance data, location data at clock-in/out, and any photos are shared with your organization&apos;s administrators.</li>
            <li><strong>Payroll providers:</strong> When configured, we export time data to payroll systems (Gusto, ADP, Paychex, QuickBooks) as directed by your organization.</li>
            <li><strong>Service providers:</strong> We use trusted third parties for hosting (AWS), authentication (Supabase), and analytics. These providers are bound by confidentiality obligations.</li>
            <li><strong>Legal requirements:</strong> We may disclose information when required by law, legal process, or government request.</li>
          </ul>

          <h2>5. Data Security</h2>
          <p>
            We implement industry-standard security measures including encryption at rest (AES-256) and in transit (TLS 1.3), regular security audits, and access controls.
          </p>

          <h2>6. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active or as needed to provide the Service. Attendance records are retained per your organization&apos;s configuration and applicable legal requirements. You may request deletion of your personal data at any time.
          </p>

          <h2>7. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate personal data</li>
            <li>Request deletion of your personal data</li>
            <li>Object to or restrict processing of your data</li>
            <li>Data portability — receive your data in a structured, machine-readable format</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p>
            To exercise these rights, contact us at <strong>privacy@kpr.app</strong>.
          </p>

          <h2>8. GDPR Compliance</h2>
          <p>
            For users in the European Economic Area (EEA), we process personal data in accordance with the General Data Protection Regulation (GDPR). Our legal bases for processing include: performance of a contract, legitimate interests, compliance with legal obligations, and consent.
          </p>

          <h2>9. Children&apos;s Privacy</h2>
          <p>
            The Service is not intended for individuals under the age of 16. We do not knowingly collect personal information from children.
          </p>

          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the &ldquo;Last updated&rdquo; date. Continued use of the Service after changes constitutes acceptance.
          </p>

          <h2>11. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, contact us at:
          </p>
          <ul>
            <li>Email: <strong>privacy@kpr.app</strong></li>
            <li>Address: KPR Technologies, Inc., San Francisco, CA</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
