/**
 * Settings › AI & Chat — embeds the existing AiSettings form.
 */
import AiSettings from '@/components/cms/admin/AiSettings';
import { PanelHeader } from '@/components/cms/admin/settings-hub/panel-header';

export const dynamic = 'force-dynamic';

export default function AiSettingsPage() {
  return (
    <div>
      <PanelHeader eyebrow="Integrations" title="AI & Chat" desc="Model provider, API keys, and the assistant configuration." />
      <AiSettings />
    </div>
  );
}
