/**
 * Settings › GitHub — embeds the existing GitHubSettings connection manager.
 */
import GitHubSettings from '@/components/cms/admin/GitHubSettings';
import { PanelHeader } from '@/components/cms/admin/settings-hub/panel-header';

export const dynamic = 'force-dynamic';

export default function GitHubSettingsPage() {
  return (
    <div>
      <PanelHeader eyebrow="Integrations" title="GitHub" desc="Connect a repository to sync content and configuration." />
      <GitHubSettings />
    </div>
  );
}
