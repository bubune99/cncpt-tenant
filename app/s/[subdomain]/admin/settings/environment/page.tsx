/**
 * Settings › Environment — embeds the existing EnvManager.
 */
import EnvManager from '@/components/cms/admin/EnvManager';
import { PanelHeader } from '@/components/cms/admin/settings-hub/panel-header';

export const dynamic = 'force-dynamic';

export default function EnvironmentSettingsPage() {
  return (
    <div>
      <PanelHeader eyebrow="Advanced" title="Environment" desc="Runtime environment variables and their configuration status." />
      <EnvManager />
    </div>
  );
}
