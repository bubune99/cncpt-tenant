/**
 * Settings › Branding — embeds the existing BrandingSettings form inside the hub.
 */
import BrandingSettings from '@/components/cms/admin/BrandingSettings';
import { PanelHeader } from '@/components/cms/admin/settings-hub/panel-header';

export const dynamic = 'force-dynamic';

export default function BrandingSettingsPage() {
  return (
    <div>
      <PanelHeader eyebrow="Storefront" title="Branding" desc="Logo, colours, and the visual identity used across the storefront and admin." />
      <BrandingSettings />
    </div>
  );
}
