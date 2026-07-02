/**
 * Settings › Auth & SSO — embeds the existing AuthSettings form.
 */
import AuthSettings from '@/components/cms/admin/AuthSettings';
import { PanelHeader } from '@/components/cms/admin/settings-hub/panel-header';

export const dynamic = 'force-dynamic';

export default function AuthSettingsPage() {
  return (
    <div>
      <PanelHeader eyebrow="Advanced" title="Auth & SSO" desc="Login methods and single sign-on for this workspace." />
      <AuthSettings />
    </div>
  );
}
