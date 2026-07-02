'use client';

/**
 * Settings › General — store profile + regional formats.
 *
 * The General panel of the Grainy settings hub. Reads and writes the `general`
 * settings group via /api/cms/settings (GET all, PUT { group, settings }),
 * exactly as the platform expects. Layout chrome (header + rail) comes from the
 * hub layout; this file is just the panel body.
 */

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Btn } from '@/components/cms/admin/grainy-ui';
import { PanelHeader } from '@/components/cms/admin/settings-hub/panel-header';
import { SetCard, SetField, SetSelect } from '@/components/cms/admin/settings-hub/set-card';

interface GeneralForm {
  siteName: string;
  siteUrl: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  locale: string;
  timezone: string;
}

const EMPTY: GeneralForm = {
  siteName: '',
  siteUrl: '',
  supportEmail: '',
  supportPhone: '',
  currency: 'USD',
  locale: 'en-US',
  timezone: 'America/New_York',
};

const CURRENCIES = [
  { value: 'USD', label: 'USD $' },
  { value: 'EUR', label: 'EUR €' },
  { value: 'GBP', label: 'GBP £' },
  { value: 'CAD', label: 'CAD $' },
  { value: 'AUD', label: 'AUD $' },
  { value: 'GHS', label: 'GHS ₵' },
] as const;

const LOCALES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'fr-FR', label: 'French (France)' },
  { value: 'es-ES', label: 'Spanish (Spain)' },
  { value: 'de-DE', label: 'German (Germany)' },
] as const;

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time · New York' },
  { value: 'America/Chicago', label: 'Central Time · Chicago' },
  { value: 'America/Los_Angeles', label: 'Pacific Time · Los Angeles' },
  { value: 'Europe/London', label: 'UK Time · London' },
  { value: 'Africa/Accra', label: 'GMT · Accra' },
] as const;

export default function GeneralSettingsPage() {
  const [form, setForm] = useState<GeneralForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/cms/settings?group=general');
        if (res.ok) {
          const data = (await res.json()) as { general?: Partial<GeneralForm> };
          if (data.general) setForm({ ...EMPTY, ...data.general });
        }
      } catch {
        // non-fatal — fall back to defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = <K extends keyof GeneralForm>(key: K, value: GeneralForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/cms/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group: 'general', settings: form }),
      });
      if (!res.ok) throw new Error('save failed');
      toast.success('General settings saved');
    } catch {
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '32px 0' }}>
        <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--text-muted)' }} />
        <span className="gr-eyebrow">Loading…</span>
      </div>
    );
  }

  return (
    <div>
      <PanelHeader
        eyebrow="General"
        title="Workspace basics"
        desc="Identity shown across the storefront, invoices, and emails."
        action={
          <Btn kind="primary" onClick={() => void handleSave()} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Btn>
        }
      />

      <SetCard title="Store profile" desc="The basics customers and receipts see.">
        <div className="set-grid">
          <SetField label="Store name" value={form.siteName} onChange={(v) => set('siteName', v)} half placeholder="Atlas" />
          <SetField label="Store URL" value={form.siteUrl} onChange={(v) => set('siteUrl', v)} half placeholder="https://atlas.shop" />
          <SetField label="Support email" value={form.supportEmail} onChange={(v) => set('supportEmail', v)} half placeholder="hello@atlas.shop" type="email" />
          <SetField label="Support phone" value={form.supportPhone} onChange={(v) => set('supportPhone', v)} half placeholder="+1 (212) 555-0142" type="tel" />
        </div>
      </SetCard>

      <SetCard title="Regional" desc="Formats applied to prices, dates, and language.">
        <div className="set-grid">
          <SetSelect label="Currency" value={form.currency} onChange={(v) => set('currency', v)} options={CURRENCIES} half />
          <SetSelect label="Locale" value={form.locale} onChange={(v) => set('locale', v)} options={LOCALES} half />
          <SetSelect label="Timezone" value={form.timezone} onChange={(v) => set('timezone', v)} options={TIMEZONES} half />
        </div>
      </SetCard>
    </div>
  );
}
