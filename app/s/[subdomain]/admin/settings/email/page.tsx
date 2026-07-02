/**
 * Settings › Email — embeds the existing EmailProviderSettings form.
 */
import EmailProviderSettings from '@/components/cms/admin/EmailProviderSettings';
import { PanelHeader } from '@/components/cms/admin/settings-hub/panel-header';

export const dynamic = 'force-dynamic';

export default function EmailSettingsPage() {
  return (
    <div>
      <PanelHeader eyebrow="Integrations" title="Email" desc="Transactional email provider and sender identity." />
      <EmailProviderSettings />
    </div>
  );
}
