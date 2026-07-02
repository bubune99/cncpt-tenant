/**
 * Settings › Storage — embeds the existing StorageSettings form.
 */
import StorageSettings from '@/components/cms/admin/StorageSettings';
import { PanelHeader } from '@/components/cms/admin/settings-hub/panel-header';

export const dynamic = 'force-dynamic';

export default function StorageSettingsPage() {
  return (
    <div>
      <PanelHeader eyebrow="Integrations" title="Storage" desc="Where uploaded media is stored — S3, Cloudflare R2, or local." />
      <StorageSettings />
    </div>
  );
}
