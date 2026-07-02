/**
 * Settings › API keys — embeds the existing MCP / API keys manager.
 */
import McpApiKeysSettings from '@/components/cms/admin/McpApiKeysSettings';
import { PanelHeader } from '@/components/cms/admin/settings-hub/panel-header';

export const dynamic = 'force-dynamic';

export default function ApiKeysSettingsPage() {
  return (
    <div>
      <PanelHeader eyebrow="Integrations" title="API keys" desc="MCP and external API credentials for programmatic access." />
      <McpApiKeysSettings />
    </div>
  );
}
