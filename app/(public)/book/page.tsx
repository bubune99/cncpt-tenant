'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Service {
  id: string
  name: string
  slug: string
  description: string | null
  durationMinutes: number
  priceCents: number
}

interface TimeSlot {
  time: string
  datetime: string
  available: boolean
}

interface AvailableDate {
  date: string
  dayOfWeek: number
  slots: TimeSlot[]
}

interface Settings {
  timezone: string
  bookingPageTitle: string
  bookingPageDescription: string
  cancellationPolicy: string
}

type Step = 'service' | 'datetime' | 'details' | 'confirm'

const PROJECT_TYPES = [
  'Business Website',
  'E-commerce Store',
  'Blog / Content Site',
  'Portfolio',
  'Landing Page',
  'Web Application',
  'Other',
]

const BUDGET_RANGES = [
  'Under $1,000',
  '$1,000 - $2,500',
  '$2,500 - $5,000',
  '$5,000 - $10,000',
  '$10,000+',
  'Not sure yet',
]

const HOW_DID_YOU_HEAR = [
  'Google Search',
  'Social Media',
  'Referral',
  'Advertisement',
  'Other',
]

export default function BookingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('service')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Data
  const [services, setServices] = useState<Service[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [availability, setAvailability] = useState<AvailableDate[]>([])

  // Selection
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  // Form data
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    companyName: '',
    websiteUrl: '',
    projectType: '',
    projectDescription: '',
    budgetRange: '',
    howDidYouHear: '',
  })

  // Load services on mount
  useEffect(() => {
    async function loadServices() {
      try {
        const res = await fetch('/api/bookings/availability')
        const data = await res.json()
        setServices(data.services || [])
        setSettings(data.settings || null)

        // Auto-select if only one service
        if (data.services?.length === 1) {
          setSelectedService(data.services[0])
          setStep('datetime')
        }
      } catch (err) {
        console.error('Failed to load services:', err)
        setError('Failed to load booking options')
      } finally {
        setLoading(false)
      }
    }
    loadServices()
  }, [])

  // Load availability when service is selected
  useEffect(() => {
    if (!selectedService) return

    async function loadAvailability() {
      try {
        const res = await fetch(`/api/bookings/availability?serviceId=${selectedService.id}`)
        const data = await res.json()
        setAvailability(data.availability || [])
      } catch (err) {
        console.error('Failed to load availability:', err)
      }
    }
    loadAvailability()
  }, [selectedService])

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setStep('datetime')
  }

  const handleSlotSelect = (date: string, slot: TimeSlot) => {
    setSelectedDate(date)
    setSelectedSlot(slot)
    setStep('details')
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.clientName || !formData.clientEmail) {
      setError('Please fill in required fields')
      return
    }
    setError(null)
    setStep('confirm')
  }

  const handleBookingSubmit = async () => {
    if (!selectedService || !selectedSlot) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          scheduledAt: selectedSlot.datetime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          ...formData,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to book appointment')
      }

      router.push(`/book/success?id=${data.booking.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book appointment')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (time: string) => {
    const [hours, mins] = time.split(':').map(Number)
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {settings?.bookingPageTitle || 'Book a Consultation'}
          </h1>
          {settings?.bookingPageDescription && (
            <p className="mt-2 text-gray-600">{settings.bookingPageDescription}</p>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {['service', 'datetime', 'details', 'confirm'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === s
                      ? 'bg-blue-600 text-white'
                      : ['service', 'datetime', 'details', 'confirm'].indexOf(step) > i
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {i + 1}
                </div>
                {i < 3 && <div className="w-8 h-0.5 bg-gray-200 ml-2"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Step 1: Service Selection */}
          {step === 'service' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Select a Service</h2>
              <div className="space-y-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{service.name}</h3>
                        {service.description && (
                          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{service.durationMinutes} min</p>
                        <p className="font-medium text-gray-900">
                          {service.priceCents === 0 ? 'Free' : `$${service.priceCents / 100}`}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Date & Time Selection */}
          {step === 'datetime' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Select Date & Time</h2>
                <button
                  onClick={() => setStep('service')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Change service
                </button>
              </div>

              {availability.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No available slots. Please check back later.</p>
              ) : (
                <div className="space-y-4">
                  {availability.slice(0, 14).map((day) => (
                    <div key={day.date} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">{formatDate(day.date)}</h3>
                      <div className="flex flex-wrap gap-2">
                        {day.slots.filter((s) => s.available).map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => handleSlotSelect(day.date, slot)}
                            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                          >
                            {formatTime(slot.time)}
                          </button>
                        ))}
                        {day.slots.filter((s) => s.available).length === 0 && (
                          <p className="text-sm text-gray-400">No slots available</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Details */}
          {step === 'details' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Your Details</h2>
                <button
                  onClick={() => setStep('datetime')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Change time
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">
                  <strong>{selectedService?.name}</strong> on{' '}
                  <strong>{selectedDate && formatDate(selectedDate)}</strong> at{' '}
                  <strong>{selectedSlot && formatTime(selectedSlot.time)}</strong>
                </p>
              </div>

              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="clientEmail"
                      value={formData.clientEmail}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="clientPhone"
                      value={formData.clientPhone}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Website (if any)</label>
                  <input
                    type="url"
                    name="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={handleFormChange}
                    placeholder="https://"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                  <select
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select type...</option>
                    {PROJECT_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
                  <select
                    name="budgetRange"
                    value={formData.budgetRange}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select budget...</option>
                    {BUDGET_RANGES.map((range) => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tell us about your project
                  </label>
                  <textarea
                    name="projectDescription"
                    value={formData.projectDescription}
                    onChange={handleFormChange}
                    rows={4}
                    placeholder="What are you looking to build? Any specific features or requirements?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">How did you hear about us?</label>
                  <select
                    name="howDidYouHear"
                    value={formData.howDidYouHear}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select...</option>
                    {HOW_DID_YOU_HEAR.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              </form>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 'confirm' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Confirm Your Booking</h2>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service</span>
                  <span className="font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date</span>
                  <span className="font-medium">{selectedDate && formatDate(selectedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time</span>
                  <span className="font-medium">{selectedSlot && formatTime(selectedSlot.time)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{selectedService?.durationMinutes} minutes</span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between">
                  <span className="text-gray-600">Name</span>
                  <span className="font-medium">{formData.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email</span>
                  <span className="font-medium">{formData.clientEmail}</span>
                </div>
              </div>

              {settings?.cancellationPolicy && (
                <p className="text-sm text-gray-500 mb-6">{settings.cancellationPolicy}</p>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('details')}
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleBookingSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
