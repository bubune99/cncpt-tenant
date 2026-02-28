import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read our terms of service governing the use of our website and services.",
};

export default function TermsOfServicePage() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-muted-foreground mb-8">
        Last updated: February 20, 2026
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
        <p>
          By accessing or using our website and services, you agree to be bound
          by these Terms of Service and all applicable laws and regulations. If
          you do not agree with any of these terms, you are prohibited from
          using or accessing this site. The materials contained in this website
          are protected by applicable copyright and trademark law.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Account Terms</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            You must be at least 16 years of age to use this service. By
            agreeing to these Terms, you represent that you are at least 16
            years old.
          </li>
          <li>
            You are responsible for maintaining the security of your account and
            password. We cannot and will not be liable for any loss or damage
            from your failure to comply with this security obligation.
          </li>
          <li>
            You are responsible for all content posted and activity that occurs
            under your account.
          </li>
          <li>
            You may not use our services for any illegal or unauthorized
            purpose. You must not, in the use of the service, violate any laws
            in your jurisdiction.
          </li>
          <li>
            Providing false contact information of any kind may result in the
            termination of your account.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          3. Products and Services
        </h2>
        <p>
          Certain products or services may be available exclusively online
          through the website. These products or services may have limited
          quantities and are subject to our{" "}
          <Link
            href="/legal/refund"
            className="underline hover:text-foreground"
          >
            Refund Policy
          </Link>
          .
        </p>
        <ul className="list-disc pl-6 mt-4 space-y-2">
          <li>
            We have made every effort to display as accurately as possible the
            colors and images of our products. We cannot guarantee that your
            computer monitor&apos;s display of any color will be accurate.
          </li>
          <li>
            We reserve the right to limit the sales of our products or services
            to any person, geographic region, or jurisdiction.
          </li>
          <li>
            We reserve the right to limit the quantities of any products or
            services that we offer.
          </li>
          <li>
            All descriptions of products or product pricing are subject to
            change at any time without notice, at our sole discretion.
          </li>
          <li>
            We reserve the right to discontinue any product at any time.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          4. Payment Terms
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            All payments are processed securely through Stripe. We do not store
            your credit card information on our servers.
          </li>
          <li>
            You agree to provide current, complete, and accurate purchase and
            account information for all purchases made on our site.
          </li>
          <li>
            You agree to promptly update your account and payment information,
            including email address, payment method, and card expiration date, so
            that we can complete your transactions and contact you as needed.
          </li>
          <li>
            Prices for our products are subject to change without notice. All
            prices are displayed in the currency indicated at checkout.
          </li>
          <li>
            We reserve the right to refuse any order you place with us. We may,
            in our sole discretion, limit or cancel quantities purchased per
            person, per household, or per order.
          </li>
          <li>
            Sales tax will be added where required by applicable law.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          5. Shipping and Delivery
        </h2>
        <p>
          For detailed information about shipping methods, timeframes, and
          policies, please refer to our{" "}
          <Link
            href="/legal/shipping"
            className="underline hover:text-foreground"
          >
            Shipping Policy
          </Link>
          .
        </p>
        <ul className="list-disc pl-6 mt-4 space-y-2">
          <li>
            Risk of loss and title for items purchased pass to you upon delivery
            to the carrier.
          </li>
          <li>
            We are not responsible for delays caused by shipping carriers,
            customs processing, or events beyond our control.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          6. Intellectual Property
        </h2>
        <p>
          All content included on this site, such as text, graphics, logos,
          images, audio clips, digital downloads, data compilations, and
          software, is the property of our company or its content suppliers and
          is protected by international copyright laws.
        </p>
        <ul className="list-disc pl-6 mt-4 space-y-2">
          <li>
            You may not reproduce, distribute, modify, create derivative works
            of, publicly display, publicly perform, republish, download, store,
            or transmit any of the material on our website without prior written
            consent.
          </li>
          <li>
            You may print or download one copy of a reasonable number of pages
            of the website for your own personal, non-commercial use and not for
            further reproduction, publication, or distribution.
          </li>
          <li>
            Our trademarks and trade dress may not be used in connection with
            any product or service without our prior written consent.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          7. User-Generated Content
        </h2>
        <p>
          If you submit, post, or display content on or through our services
          (such as reviews, comments, or other materials):
        </p>
        <ul className="list-disc pl-6 mt-4 space-y-2">
          <li>
            You grant us a non-exclusive, worldwide, royalty-free license to
            use, reproduce, modify, and display such content in connection with
            operating our services.
          </li>
          <li>
            You represent that you own or have the necessary rights to grant
            this license.
          </li>
          <li>
            You agree not to submit content that is unlawful, defamatory,
            obscene, or otherwise objectionable.
          </li>
          <li>
            We reserve the right to remove any content that violates these terms
            or that we find objectionable for any reason.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          8. Prohibited Activities
        </h2>
        <p>You agree not to:</p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>
            Use the site in any way that violates any applicable law or
            regulation
          </li>
          <li>
            Engage in any conduct that restricts or inhibits anyone&apos;s use
            or enjoyment of the site
          </li>
          <li>
            Use any automated system, including bots, spiders, or scrapers, to
            access the site
          </li>
          <li>
            Attempt to gain unauthorized access to any portion of the site or
            any systems or networks connected to the site
          </li>
          <li>
            Interfere with or disrupt the site or servers and networks connected
            to the site
          </li>
          <li>
            Impersonate or attempt to impersonate the company, an employee, or
            another user
          </li>
          <li>
            Use the site to transmit any advertising or promotional material
            without our prior written consent
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          9. Limitation of Liability
        </h2>
        <p>
          To the fullest extent permitted by applicable law, in no event shall
          we, our directors, employees, partners, agents, suppliers, or
          affiliates be liable for any indirect, incidental, special,
          consequential, or punitive damages, including without limitation, loss
          of profits, data, use, goodwill, or other intangible losses,
          resulting from:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>Your access to or use of (or inability to access or use) the service</li>
          <li>Any conduct or content of any third party on the service</li>
          <li>Any content obtained from the service</li>
          <li>
            Unauthorized access, use, or alteration of your transmissions or
            content
          </li>
        </ul>
        <p className="mt-4">
          Our total liability to you for all claims arising from your use of the
          service shall not exceed the amount you paid to us in the twelve (12)
          months preceding the claim.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          10. Disclaimer of Warranties
        </h2>
        <p>
          The service is provided on an &quot;AS IS&quot; and &quot;AS
          AVAILABLE&quot; basis. We expressly disclaim all warranties of any
          kind, whether express or implied, including but not limited to the
          implied warranties of merchantability, fitness for a particular
          purpose, and non-infringement.
        </p>
        <p className="mt-4">
          We do not warrant that the service will be uninterrupted, timely,
          secure, or error-free. We do not warrant that the results obtained
          from the use of the service will be accurate or reliable.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">11. Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless our company and its
          licensees and licensors, and their employees, contractors, agents,
          officers, and directors, from and against any and all claims, damages,
          obligations, losses, liabilities, costs or debt, and expenses
          (including but not limited to attorney&apos;s fees) arising from your
          use of and access to the service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
        <p>
          These Terms shall be governed and construed in accordance with the
          laws of [Your Jurisdiction], without regard to its conflict of law
          provisions. Our failure to enforce any right or provision of these
          Terms will not be considered a waiver of those rights.
        </p>
        <p className="mt-4">
          If any provision of these Terms is held to be invalid or
          unenforceable by a court, the remaining provisions will remain in
          effect. These Terms constitute the entire agreement between us
          regarding our service and supersede and replace any prior agreements.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">13. Termination</h2>
        <p>
          We may terminate or suspend your account and access to the service
          immediately, without prior notice or liability, for any reason
          whatsoever, including without limitation if you breach the Terms.
          Upon termination, your right to use the service will immediately
          cease.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">14. Changes to Terms</h2>
        <p>
          We reserve the right to modify or replace these Terms at any time. If
          a revision is material, we will provide at least 30 days&apos; notice
          prior to any new terms taking effect. What constitutes a material
          change will be determined at our sole discretion.
        </p>
        <p className="mt-4">
          By continuing to access or use our service after those revisions
          become effective, you agree to be bound by the revised terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">15. Contact Us</h2>
        <p>
          If you have any questions about these Terms of Service, please contact
          us at:
        </p>
        <ul className="list-none mt-4 space-y-1">
          <li>
            <strong>Email:</strong> legal@yourcompany.com
          </li>
          <li>
            <strong>Address:</strong> [Your Company Address]
          </li>
        </ul>
      </section>

      <hr className="my-8" />

      <p className="text-sm text-muted-foreground">
        See also:{" "}
        <Link
          href="/legal/privacy"
          className="underline hover:text-foreground"
        >
          Privacy Policy
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
