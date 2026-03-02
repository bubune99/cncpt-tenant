import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund & Return Policy",
  description:
    "Learn about our refund and return policies, including eligibility, timeframes, and the process for requesting a return.",
};

export default function RefundPolicyPage() {
  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">Refund &amp; Return Policy</h1>
      <p className="text-muted-foreground mb-8">
        Last updated: February 20, 2026
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Overview</h2>
        <p>
          We want you to be completely satisfied with your purchase. If you are
          not satisfied, we are happy to help you with a return or exchange. This
          Refund &amp; Return Policy outlines the terms and conditions for
          returning products purchased from our store.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          2. Return Eligibility
        </h2>
        <p>
          To be eligible for a return, the following conditions must be met:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>
            Items must be returned within <strong>30 days</strong> of the
            delivery date.
          </li>
          <li>
            Items must be unused, unworn, and in the same condition that you
            received them.
          </li>
          <li>Items must be in the original packaging.</li>
          <li>
            You must have a receipt or proof of purchase (order confirmation
            email is sufficient).
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          3. Non-Returnable Items
        </h2>
        <p>The following items are not eligible for return:</p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>Gift cards</li>
          <li>Downloadable or digital products</li>
          <li>Perishable goods (food, flowers, etc.)</li>
          <li>Personal care and hygiene products (if opened or used)</li>
          <li>Customized or personalized items</li>
          <li>Items marked as final sale or clearance</li>
          <li>
            Hazardous materials, flammable liquids, or gases
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          4. How to Initiate a Return
        </h2>
        <p>To start a return, follow these steps:</p>
        <ol className="list-decimal pl-6 mt-2 space-y-2">
          <li>
            <strong>Contact us</strong> at returns@yourcompany.com with your
            order number and reason for return.
          </li>
          <li>
            <strong>Receive return authorization</strong> - we will email you a
            Return Merchandise Authorization (RMA) number and return shipping
            instructions.
          </li>
          <li>
            <strong>Pack the item</strong> securely in its original packaging
            and include the RMA number on the outside of the package.
          </li>
          <li>
            <strong>Ship the item</strong> to the address provided in the return
            instructions.
          </li>
        </ol>
        <p className="mt-4">
          <strong>Important:</strong> Items sent back without first requesting a
          return will not be accepted.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          5. Return Shipping Costs
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Defective or incorrect items:</strong> We will cover the
            return shipping cost and provide a prepaid shipping label.
          </li>
          <li>
            <strong>Change of mind:</strong> The customer is responsible for
            return shipping costs.
          </li>
          <li>
            Original shipping charges are non-refundable unless the return is
            due to our error.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">6. Refund Process</h2>
        <p>
          Once we receive your returned item, we will inspect it and notify you
          of the status of your refund.
        </p>
        <ul className="list-disc pl-6 mt-4 space-y-2">
          <li>
            <strong>Inspection:</strong> Returns are inspected within 3 business
            days of receipt.
          </li>
          <li>
            <strong>Approval:</strong> If your return is approved, we will
            initiate a refund to your original payment method.
          </li>
          <li>
            <strong>Processing time:</strong> Refunds are typically processed
            within 5-10 business days. The time it takes for the refund to
            appear on your statement depends on your bank or credit card
            company.
          </li>
          <li>
            <strong>Partial refunds:</strong> In certain situations, only partial
            refunds may be granted (e.g., items with obvious signs of use, items
            not in original condition, or items returned more than 30 days after
            delivery).
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">7. Exchanges</h2>
        <p>
          We only replace items if they are defective or damaged. If you need
          to exchange an item for the same product (different size or color,
          where applicable), please contact us at returns@yourcompany.com.
        </p>
        <p className="mt-4">
          For exchanges of a different product, please return the original item
          for a refund and place a new order.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          8. Damaged or Defective Items
        </h2>
        <p>
          If you received a damaged or defective item, please contact us
          immediately at returns@yourcompany.com with:
        </p>
        <ul className="list-disc pl-6 mt-2 space-y-2">
          <li>Your order number</li>
          <li>A description of the issue</li>
          <li>Photos of the damaged or defective item</li>
        </ul>
        <p className="mt-4">
          We will arrange for a replacement or full refund, including any
          shipping costs, at no charge to you.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          9. Late or Missing Refunds
        </h2>
        <p>If you haven&apos;t received a refund yet:</p>
        <ol className="list-decimal pl-6 mt-2 space-y-2">
          <li>
            Check your bank account again &mdash; it may take time to process.
          </li>
          <li>
            Contact your credit card company, as it may take some time before
            your refund is officially posted.
          </li>
          <li>Contact your bank, as there is often processing time.</li>
          <li>
            If you have done all of this and still have not received your
            refund, please contact us at returns@yourcompany.com.
          </li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          10. Order Cancellations
        </h2>
        <p>
          Orders can be cancelled free of charge if they have not yet been
          shipped. Once an order has been shipped, it cannot be cancelled and
          must follow the standard return process.
        </p>
        <p className="mt-4">
          To cancel an order, contact us as soon as possible at
          returns@yourcompany.com with your order number.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
        <p>
          If you have any questions about our Refund &amp; Return Policy, please
          contact us at:
        </p>
        <ul className="list-none mt-4 space-y-1">
          <li>
            <strong>Email:</strong> returns@yourcompany.com
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
