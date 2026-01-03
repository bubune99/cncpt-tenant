'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Mail, Save, Loader2 } from 'lucide-react'

interface Subscriber {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  status: string
  tags: string[]
  preferences: {
    marketing?: boolean
    transactional?: boolean
    productUpdates?: boolean
    newsletter?: boolean
    frequency?: 'daily' | 'weekly' | 'monthly'
  }
}

function PreferencesContent() {
  const searchParams = useSearchParams()
  const subscriberId = searchParams.get('s')
  const email = searchParams.get('email')

  const [subscriber, setSubscriber] = useState<Subscriber | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [preferences, setPreferences] = useState({
    firstName: '',
    lastName: '',
    marketing: true,
    productUpdates: true,
    newsletter: true,
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
  })

  useEffect(() => {
    async function loadPreferences() {
      if (!subscriberId && !email) {
        setError('Invalid link')
        setLoading(false)
        return
      }

      try {
        const params = new URLSearchParams()
        if (subscriberId) params.set('s', subscriberId)
        if (email) params.set('email', email)

        const response = await fetch(`/api/email/preferences?${params.toString()}`)
        const data = await response.json()

        if (!data.success) {
          setError(data.error || 'Failed to load preferences')
          setLoading(false)
          return
        }

        setSubscriber(data.subscriber)
        setPreferences({
          firstName: data.subscriber.firstName || '',
          lastName: data.subscriber.lastName || '',
          marketing: data.subscriber.preferences?.marketing ?? true,
          productUpdates: data.subscriber.preferences?.productUpdates ?? true,
          newsletter: data.subscriber.preferences?.newsletter ?? true,
          frequency: data.subscriber.preferences?.frequency || 'weekly',
        })
      } catch {
        setError('Failed to load preferences')
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [subscriberId, email])

  const handleSave = async () => {
    if (!subscriber) return

    setSaving(true)
    setSuccess(false)
    setError(null)

    try {
      const response = await fetch('/api/email/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriberId: subscriber.id,
          preferences: {
            firstName: preferences.firstName || undefined,
            lastName: preferences.lastName || undefined,
            emailPreferences: {
              marketing: preferences.marketing,
              productUpdates: preferences.productUpdates,
              newsletter: preferences.newsletter,
              frequency: preferences.frequency,
            },
          },
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to save preferences')
        return
      }

      setSuccess(true)
    } catch {
      setError('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error && !subscriber) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-6 mx-auto">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 text-center mb-2">
            Email Preferences
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Manage your email subscription settings
          </p>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
              Your preferences have been saved.
            </div>
          )}

          {error && subscriber && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={subscriber?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={preferences.firstName}
                  onChange={(e) => setPreferences({ ...preferences, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={preferences.lastName}
                  onChange={(e) => setPreferences({ ...preferences, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Email Types
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-700">Marketing & Promotions</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.productUpdates}
                    onChange={(e) => setPreferences({ ...preferences, productUpdates: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-700">Product Updates</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.newsletter}
                    onChange={(e) => setPreferences({ ...preferences, newsletter: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-700">Newsletter</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Frequency
              </label>
              <select
                value={preferences.frequency}
                onChange={(e) => setPreferences({ ...preferences, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Preferences
                </>
              )}
            </button>

            <div className="pt-4 border-t border-gray-200">
              <a
                href={`/api/email/unsubscribe?s=${subscriber?.id}`}
                className="text-sm text-gray-500 hover:text-red-600"
              >
                Unsubscribe from all emails
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PreferencesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <PreferencesContent />
    </Suspense>
  )
}
