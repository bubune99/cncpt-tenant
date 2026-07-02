/**
 * Settings › Features — embeds the existing FeatureSettings toggles.
 */
import FeatureSettings from '@/components/cms/admin/settings/feature-settings';
import { PanelHeader } from '@/components/cms/admin/settings-hub/panel-header';

export const dynamic = 'force-dynamic';

export default function FeatureSettingsPage() {
  return (
    <div>
      <PanelHeader eyebrow="Workspace" title="Features" desc="Enable or disable modules and capabilities per this workspace." />
      <FeatureSettings />
    </div>
  );
}
