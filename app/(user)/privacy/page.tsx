'use client'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen w-full bg-black px-8 py-12 text-white md:px-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold uppercase leading-[1.05] tracking-tight md:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-[13px] uppercase leading-relaxed tracking-wide text-gray-500">
          Last updated: July 11, 2026
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-2xl space-y-10 text-sm leading-relaxed text-gray-400">
        <section className="space-y-3">
          <h2 className="text-base font-semibold uppercase tracking-wide text-white">
            1. Information We Collect
          </h2>
          <p>
            When you make a reservation, we collect your name, phone number, and
            email address. We also collect usage data such as pages visited,
            device type, and interaction patterns to improve the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold uppercase tracking-wide text-white">
            2. How We Use Your Information
          </h2>
          <p>
            We use your information to process reservations, communicate booking
            confirmations, send QR codes for check-in, and improve our services.
            We do not sell or rent your personal data to third parties.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold uppercase tracking-wide text-white">
            3. Data Sharing
          </h2>
          <p>
            Your reservation details are shared with the venue you book at so
            they can prepare your table. We may share anonymized, aggregated
            analytics with partners. No personally identifiable information is
            included in these reports.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold uppercase tracking-wide text-white">
            4. Data Retention
          </h2>
          <p>
            We retain your reservation data for as long as necessary to provide
            our services and comply with legal obligations. You may request
            deletion of your data by contacting support@otuscebu.com.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold uppercase tracking-wide text-white">
            5. Security
          </h2>
          <p>
            We implement industry-standard security measures to protect your
            data, including encryption in transit and at rest. However, no
            method of electronic transmission is 100% secure, and we cannot
            guarantee absolute security.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold uppercase tracking-wide text-white">
            6. Cookies and Tracking
          </h2>
          <p>
            We use essential cookies to operate the platform and optional
            analytics cookies to understand usage patterns. You can manage
            cookie preferences through your browser settings.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold uppercase tracking-wide text-white">
            7. Changes to This Policy
          </h2>
          <p>
            We may update this privacy policy from time to time. Changes will
            be posted on this page with an updated effective date. Continued use
            of the platform after changes constitutes acceptance of the revised
            policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold uppercase tracking-wide text-white">
            8. Contact Us
          </h2>
          <p>
            For questions about this policy or to exercise your data rights,
            contact us at support@otuscebu.com.
          </p>
        </section>
      </div>
    </div>
  )
}
