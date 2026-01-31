/**
 * Email Preferences Page
 *
 * Allows users to manage their email subscription preferences.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

interface EmailPreference {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export default function EmailPreferencesPage() {
  const [preferences, setPreferences] = useState<EmailPreference[]>([
    {
      id: 'marketing',
      label: 'Marketing emails',
      description: 'Receive promotional offers, discounts, and new product announcements.',
      enabled: true,
    },
    {
      id: 'newsletter',
      label: 'Newsletter',
      description: 'Weekly or monthly newsletter with updates and content.',
      enabled: true,
    },
    {
      id: 'product',
      label: 'Product updates',
      description: 'Important updates about products you have purchased.',
      enabled: true,
    },
    {
      id: 'transactional',
      label: 'Order notifications',
      description: 'Order confirmations, shipping updates, and receipts.',
      enabled: true,
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const togglePreference = (id: string) => {
    setPreferences((prev) =>
      prev.map((pref) =>
        pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
      )
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Email Preferences
          </h1>
          <p className="text-gray-600 mb-8">
            Choose which emails you would like to receive from us.
          </p>

          <div className="space-y-6">
            {preferences.map((pref) => (
              <div
                key={pref.id}
                className="flex items-start justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{pref.label}</h3>
                  <p className="text-sm text-gray-500">{pref.description}</p>
                </div>
                <button
                  onClick={() => togglePreference(pref.id)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    pref.enabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={pref.enabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      pref.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <Link
              href="/email/unsubscribed"
              className="text-sm text-red-600 hover:text-red-700"
            >
              Unsubscribe from all emails
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
