/**
 * Admin → Settings → Payments. Renders the Stripe settings form so a tenant can
 * enable checkout by entering their own Stripe keys (or use the platform account).
 */
import { StripeSettingsForm } from "@/components/cms/admin/StripeSettingsForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function PaymentsSettingsPage() {
  return (
    <div className="prod-editor-shell" style={{ padding: "40px 28px 24px" }}>
      <div className="crumbs" style={{ marginBottom: 6 }}>
        <Link href="/admin/settings">Settings</Link>
        <span className="sep">/</span>
        <span className="here">Payments</span>
      </div>
      <div style={{ paddingBottom: 12, borderBottom: "1px solid var(--ink)", marginBottom: 16 }}>
        <div className="eyebrow">Commerce</div>
        <h1 className="display" style={{ fontSize: 30, letterSpacing: "-0.02em", margin: "2px 0 0" }}>Payments</h1>
        <p className="fig" style={{ fontStyle: "italic", color: "var(--ink-soft)", fontSize: 13, marginTop: 4 }}>
          Connect Stripe to take card payments at checkout.
        </p>
      </div>
      <StripeSettingsForm />
    </div>
  );
}
