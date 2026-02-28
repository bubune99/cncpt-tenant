import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description:
    "Learn about our shipping methods, delivery timeframes, tracking, and international shipping options.",
};

export default function ShippingPolicyPage() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-2">Shipping Policy</h1>
      <p className="text-muted-foreground mb-8">
        Last updated: February 20, 2026
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Overview</h2>
        <p>
          This Shipping Policy outlines how we handle the shipment of products
          purchased through our online store. We are committed to delivering
          your orders in a timely and efficient manner.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          2. Order Processing Time
        </h2>
        <p>
          All orders are processed within <strong>1-3 business days</strong>{" "}
          (excluding weekends and holidays) after receiving your order
          confirmation email.
        </p>
        <ul className="list-disc pl-6 mt-4 space-y-2">
          <li>
            You will receive a shipping confirmation email with a tracking
            number once your order has shipped.
          </li>
          <li>
            Orders placed after 2:00 PM local time will be processed the next
            business day.
          </li>
          <li>
            During peak seasons (holidays, sales events), processing times may
            be extended by 1-2 additional business days.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          3. Domestic Shipping Options
        </h2>
        <div className="overflow-x-auto mt-4">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-4 py-3 text-left font-semibold">
                  Shipping Method
                </th>
                <th className="border border-border px-4 py-3 text-left font-semibold">
                  Estimated Delivery
                </th>
                <th className="border border-border px-4 py-3 text-left font-semibold">
                  Cost
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border px-4 py-3">
                  Standard Shipping
                </td>
                <td className="border border-border px-4 py-3">
                  5-7 business days
                </td>
                <td className="border border-border px-4 py-3">
                  Calculated at checkout
                </td>
              </tr>
              <tr className="bg-muted/50">
                <td className="border border-border px-4 py-3">
                  Expedited Shipping
                </td>
                <td className="border border-border px-4 py-3">
                  2-3 business days
                </td>
                <td className="border border-border px-4 py-3">
                  Calculated at checkout
                </td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-3">
                  Overnight Shipping
                </td>
                <td className="border border-border px-4 py-3">
                  1 business day
                </td>
                <td className="border border-border px-4 py-3">
                  Calculated at checkout
                </td>
              </tr>
              <tr className="bg-muted/50">
                <td className="border border-border px-4 py-3">
                  Free Shipping
                </td>
                <td className="border border-border px-4 py-3">
                  5-7 business days
                </td>
                <td className="border border-border px-4 py-3">
                  Free on orders over $50
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Delivery times are estimates and are not guaranteed. Actual delivery
          times may vary based on your location and carrier conditions.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          4. International Shipping
        </h2>
        <p>
          We ship to select international destinations. International shipping
          rates and delivery times vary depending on the destination country.
        </p>
        <ul className="list-disc pl-6 mt-4 space-y-2">
          <li>
            <strong>Estimated delivery:</strong> 7-21 business days, depending
            on destination and customs processing.
          </li>
          <li>
            <strong>Shipping cost:</strong> Calculated at checkout based on
            destination, weight, and dimensions.
          </li>
          <li>
            <strong>Customs and duties:</strong> International orders may be
            subject to import duties, taxes, and customs fees imposed by the
            destination country. These charges are the responsibility of the
            buyer and are not included in our shipping costs.
          </li>
          <li>
            <strong>Customs delays:</strong> We are not responsible for delays
            caused by customs processing in the destination country.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          5. Order Tracking
        </h2>
        <p>
          Once your order has shipped, you will receive a shipping confirmation
          email containing:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>A tracking number</li>
          <li>A link to track your package on the carrier&apos;s website</li>
          <li>Estimated delivery date</li>
        </ul>
        <p className="mt-4">
          You can also track your order status by logging into your account on
          our website. Please allow up to 24 hours after receiving your
          shipping confirmation for tracking information to become active.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          6. Shipping Restrictions
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            We currently do not ship to P.O. boxes for expedited or overnight
            shipping methods.
          </li>
          <li>
            Certain products may have shipping restrictions based on
            regulations in the destination country or region.
          </li>
          <li>
            We reserve the right to cancel orders shipped to addresses that our
            fraud detection system flags as potentially fraudulent.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          7. Lost, Stolen, or Damaged Packages
        </h2>

        <h3 className="text-xl font-medium mb-3">7.1 Lost Packages</h3>
        <p>
          If your package appears lost (tracking shows no updates for 7+
          business days for domestic or 21+ business days for international):
        </p>
        <ol className="list-decimal pl-6 mt-2 space-y-2">
          <li>
            Contact us at shipping@yourcompany.com with your order number.
          </li>
          <li>
            We will file a claim with the carrier and work to resolve the issue.
          </li>
          <li>
            If the package cannot be located, we will issue a replacement or
            full refund.
          </li>
        </ol>

        <h3 className="text-xl font-medium mb-3 mt-6">
          7.2 Damaged Packages
        </h3>
        <p>
          If your package arrives damaged, please contact us within 48 hours of
          delivery with:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>Your order number</li>
          <li>Photos of the damaged packaging and items</li>
          <li>A description of the damage</li>
        </ul>
        <p className="mt-4">
          We will arrange for a replacement or refund. Please do not discard the
          packaging or damaged items until instructed to do so, as the carrier
          may need to inspect them.
        </p>

        <h3 className="text-xl font-medium mb-3 mt-6">
          7.3 Stolen Packages
        </h3>
        <p>
          We are not responsible for packages that are confirmed as delivered by
          the carrier but are reported as stolen. We recommend:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>Using a secure delivery location</li>
          <li>Requesting signature confirmation at checkout (if available)</li>
          <li>Filing a report with your local law enforcement</li>
          <li>Contacting the carrier to file a claim</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          8. Address Accuracy
        </h2>
        <p>
          Please ensure your shipping address is complete and accurate when
          placing an order. We are not responsible for orders shipped to
          incorrect addresses provided by the customer.
        </p>
        <ul className="list-disc pl-6 mt-4 space-y-2">
          <li>
            If you realize you entered an incorrect address, contact us
            immediately. If the order has not yet shipped, we can update the
            address.
          </li>
          <li>
            If the order has already shipped to an incorrect address, additional
            shipping charges may apply for redelivery.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          9. Delivery Attempts
        </h2>
        <p>
          Carriers will typically make up to 3 delivery attempts. If all
          delivery attempts are unsuccessful, the package may be returned to us.
          In this case:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>
            We will contact you to arrange reshipment (additional shipping
            charges may apply).
          </li>
          <li>
            If you prefer, we can issue a refund minus the original shipping
            cost.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
        <p>
          If you have any questions about our Shipping Policy, please contact us
          at:
        </p>
        <ul className="list-none mt-4 space-y-1">
          <li>
            <strong>Email:</strong> shipping@yourcompany.com
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
        <Link href="/legal/terms" className="underline hover:text-foreground">
          Terms of Service
        </Link>
        {" | "}
        <Link href="/legal/refund" className="underline hover:text-foreground">
          Refund Policy
        </Link>
      </p>
    </>
  );
}
