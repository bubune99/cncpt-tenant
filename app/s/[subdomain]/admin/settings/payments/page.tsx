/**
 * Admin → Settings → Payments. Renders the Stripe settings form so a tenant can
 * enable checkout by entering their own Stripe keys (or use the platform account).
 * Chrome (header + rail) comes from the settings hub layout.
 */
import { StripeSettingsForm } from "@/components/cms/admin/StripeSettingsForm";
import { PanelHeader } from "@/components/cms/admin/settings-hub/panel-header";

export const dynamic = "force-dynamic";

export default function PaymentsSettingsPage() {
  return (
    <div>
      <PanelHeader
        eyebrow="Commerce"
        title="Payments"
        desc="Connect Stripe to take card payments at checkout."
      />
      <StripeSettingsForm />
    </div>
  );
}
