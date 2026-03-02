import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how we collect, use, and protect your personal information when you use our services.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">
        Last updated: February 20, 2026
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
        <p>
          Welcome to our Privacy Policy. This document explains how we collect,
          use, disclose, and safeguard your information when you visit our
          website and use our services. Please read this policy carefully. If you
          do not agree with the terms of this privacy policy, please do not
          access the site.
        </p>
        <p className="mt-4">
          We reserve the right to make changes to this Privacy Policy at any
          time and for any reason. We will alert you about any changes by
          updating the &quot;Last updated&quot; date of this Privacy Policy. You
          are encouraged to periodically review this Privacy Policy to stay
          informed of updates.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          2. Information We Collect
        </h2>

        <h3 className="text-xl font-medium mb-3">
          2.1 Personal Data You Provide
        </h3>
        <p>
          We may collect personally identifiable information that you voluntarily
          provide when you:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Register for an account</li>
          <li>Place an order or make a purchase</li>
          <li>Subscribe to our newsletter</li>
          <li>Fill out a contact form</li>
          <li>Participate in promotions or surveys</li>
          <li>Interact with our customer support</li>
        </ul>
        <p className="mt-4">This information may include:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Name and email address</li>
          <li>Billing and shipping address</li>
          <li>Phone number</li>
          <li>Payment information (processed securely by Stripe)</li>
          <li>Account credentials</li>
          <li>Order history and preferences</li>
        </ul>

        <h3 className="text-xl font-medium mb-3 mt-6">
          2.2 Automatically Collected Data
        </h3>
        <p>
          When you access our website, we may automatically collect certain
          information, including:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>IP address and browser type</li>
          <li>Device type and operating system</li>
          <li>Pages visited and time spent on each page</li>
          <li>Referring website or source</li>
          <li>Click patterns and navigation paths</li>
          <li>Date and time of your visit</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          3. How We Use Your Information
        </h2>
        <p>We use the information we collect for various purposes, including:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Processing and fulfilling your orders</li>
          <li>Managing your account and providing customer support</li>
          <li>Sending transactional emails (order confirmations, shipping updates)</li>
          <li>Sending marketing communications (with your consent)</li>
          <li>Improving our website, products, and services</li>
          <li>Analyzing usage trends and site performance</li>
          <li>Detecting and preventing fraud or abuse</li>
          <li>Complying with legal obligations</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          4. Cookies and Tracking Technologies
        </h2>
        <p>
          We use cookies and similar tracking technologies to track activity on
          our website and store certain information. Cookies are small data files
          placed on your device. You can instruct your browser to refuse all
          cookies or to indicate when a cookie is being sent.
        </p>

        <h3 className="text-xl font-medium mb-3 mt-6">
          Types of Cookies We Use
        </h3>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>
            <strong>Essential Cookies:</strong> Required for the website to
            function properly (e.g., session management, shopping cart, authentication).
          </li>
          <li>
            <strong>Analytics Cookies:</strong> Help us understand how visitors
            interact with our website so we can improve it.
          </li>
          <li>
            <strong>Marketing Cookies:</strong> Used to deliver relevant
            advertisements and track campaign performance.
          </li>
          <li>
            <strong>Preference Cookies:</strong> Remember your settings and
            preferences for a better experience.
          </li>
        </ul>
        <p className="mt-4">
          For more information about our use of cookies, please see our cookie
          consent settings available on the site.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          5. Third-Party Services
        </h2>
        <p>
          We use trusted third-party services to operate our business. These
          services may have access to your personal information only to perform
          specific tasks on our behalf and are obligated not to disclose or use
          it for any other purpose.
        </p>

        <h3 className="text-xl font-medium mb-3 mt-6">
          5.1 Payment Processing
        </h3>
        <p>
          We use <strong>Stripe</strong> to process payments. Your payment card
          details are sent directly to Stripe and are not stored on our servers.
          Stripe&apos;s privacy policy governs their use of your information.
        </p>

        <h3 className="text-xl font-medium mb-3 mt-6">
          5.2 Shipping Services
        </h3>
        <p>
          We use shipping carriers to deliver your orders. Your name and
          shipping address will be shared with the carrier to fulfill your
          delivery.
        </p>

        <h3 className="text-xl font-medium mb-3 mt-6">
          5.3 Email Communications
        </h3>
        <p>
          We use third-party email service providers to send transactional and
          marketing emails. Your email address and name may be shared with these
          providers for the purpose of delivering communications.
        </p>

        <h3 className="text-xl font-medium mb-3 mt-6">5.4 Analytics</h3>
        <p>
          We use analytics tools to collect and analyze information about the use
          of our website. This helps us improve our services and understand user
          behavior.
        </p>

        <h3 className="text-xl font-medium mb-3 mt-6">
          5.5 Authentication
        </h3>
        <p>
          We use a third-party authentication service to manage user accounts
          and login sessions securely.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
        <p>
          We retain your personal information only for as long as necessary to
          fulfill the purposes for which it was collected, including to satisfy
          legal, accounting, or reporting requirements. For order data, we
          retain records for the period required by applicable tax and commercial
          law. Account information is retained until you delete your account.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">7. Data Security</h2>
        <p>
          We implement appropriate technical and organizational security
          measures to protect your personal information against unauthorized
          access, alteration, disclosure, or destruction. These measures include:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Encryption of data in transit (TLS/SSL)</li>
          <li>Encryption of sensitive data at rest</li>
          <li>Regular security assessments</li>
          <li>Access controls and authentication requirements</li>
          <li>Secure payment processing through PCI-compliant providers</li>
        </ul>
        <p className="mt-4">
          However, no method of transmission over the Internet or electronic
          storage is 100% secure. While we strive to use commercially acceptable
          means to protect your personal information, we cannot guarantee its
          absolute security.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">8. Your Rights</h2>
        <p>
          Depending on your location, you may have the following rights
          regarding your personal data:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>
            <strong>Access:</strong> Request a copy of the personal data we hold
            about you.
          </li>
          <li>
            <strong>Rectification:</strong> Request correction of inaccurate or
            incomplete data.
          </li>
          <li>
            <strong>Erasure:</strong> Request deletion of your personal data
            (subject to legal retention requirements).
          </li>
          <li>
            <strong>Portability:</strong> Request a machine-readable copy of
            your data.
          </li>
          <li>
            <strong>Restriction:</strong> Request that we restrict processing of
            your data.
          </li>
          <li>
            <strong>Objection:</strong> Object to processing of your data for
            certain purposes.
          </li>
          <li>
            <strong>Withdraw Consent:</strong> Withdraw consent for marketing
            communications at any time.
          </li>
        </ul>
        <p className="mt-4">
          You can exercise your data portability and erasure rights directly
          from your{" "}
          <Link
            href="/account/settings"
            className="underline hover:text-foreground"
          >
            Account Settings
          </Link>{" "}
          page, where you can:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>
            <strong>Download My Data:</strong> Export all personal data we hold
            about you as a machine-readable JSON file.
          </li>
          <li>
            <strong>Delete My Account:</strong> Permanently anonymize your
            personal data. Order records are retained in anonymized form for
            legal and accounting purposes.
          </li>
        </ul>
        <p className="mt-4">
          For any other data rights requests, please contact us using the
          information in the Contact section below.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          9. Children&apos;s Privacy
        </h2>
        <p>
          Our services are not intended for individuals under the age of 16. We
          do not knowingly collect personal information from children under 16.
          If we become aware that a child under 16 has provided us with personal
          information, we will take steps to delete such information.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          10. International Data Transfers
        </h2>
        <p>
          Your information may be transferred to and maintained on servers
          located outside of your state, province, country, or other
          governmental jurisdiction where data protection laws may differ from
          those in your jurisdiction. By using our services, you consent to
          such transfers.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
        <p>
          If you have questions or concerns about this Privacy Policy or our
          data practices, please contact us at:
        </p>
        <ul className="list-none mt-4 space-y-1">
          <li>
            <strong>Email:</strong> privacy@yourcompany.com
          </li>
          <li>
            <strong>Address:</strong> [Your Company Address]
          </li>
        </ul>
      </section>

      <hr className="my-8" />

      <p className="text-sm text-muted-foreground">
        See also:{" "}
        <Link href="/legal/terms" className="underline hover:text-foreground">
          Terms of Service
        </Link>
        {" | "}
        <Link href="/legal/refund" className="underline hover:text-foreground">
          Refund Policy
        </Link>
        {" | "}
        <Link
          href="/legal/shipping"
          className="underline hover:text-foreground"
        >
          Shipping Policy
        </Link>
      </p>
    </>
  );
}
