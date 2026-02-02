'use client'

import { useState, useEffect } from 'react'

interface Booking {
  id: string
  clientName: string
  clientEmail: string
  clientPhone: string | null
  companyName: string | null
  scheduledAt: string
  endAt: string
  durationMinutes: number
  status: string
  projectType: string | null
  projectDescription: string | null
  budgetRange: string | null
  adminNotes: string | null
  service?: {
    name: string
  }
  createdAt: string
}

type ViewMode = 'list' | 'calendar'
type StatusFilter = 'all' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-yellow-100 text-yellow-800',
}

export default function SuperAdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadBookings()
  }, [statusFilter])

  async function loadBookings() {
    try {
      const url = statusFilter === 'all'
        ? '/api/bookings'
        : `/api/bookings?status=${statusFilter}`
      const res = await fetch(url)
      const data = await res.json()
      setBookings(data.bookings || [])
    } catch (error) {
      console.error('Failed to load bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(bookingId: string, status: string) {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        loadBookings()
        if (selectedBooking?.id === bookingId) {
          const data = await res.json()
          setSelectedBooking(data.booking)
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  async function updateNotes(bookingId: string, adminNotes: string) {
    try {
      await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes }),
      })
    } catch (error) {
      console.error('Failed to update notes:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const upcomingBookings = bookings.filter(
    (b) => new Date(b.scheduledAt) > new Date() && ['scheduled', 'confirmed'].includes(b.status)
  )

  const todayBookings = bookings.filter((b) => {
    const bookingDate = new Date(b.scheduledAt).toDateString()
    const today = new Date().toDateString()
    return bookingDate === today && ['scheduled', 'confirmed'].includes(b.status)
  })

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-600 mt-1">
            {upcomingBookings.length} upcoming · {todayBookings.length} today
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'calendar'
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Today</p>
          <p className="text-2xl font-bold text-gray-900">{todayBookings.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Upcoming</p>
          <p className="text-2xl font-bold text-gray-900">{upcomingBookings.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-gray-900">
            {bookings.filter((b) => b.status === 'completed').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Cancelled</p>
          <p className="text-2xl font-bold text-gray-900">
            {bookings.filter((b) => b.status === 'cancelled').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(['all', 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'] as StatusFilter[]).map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                statusFilter === status
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </button>
          )
        )}
      </div>

      {/* Bookings List */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {bookings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No bookings found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Client</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Service</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Date & Time</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{booking.clientName}</p>
                        <p className="text-sm text-gray-500">{booking.clientEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{booking.service?.name || 'Consultation'}</p>
                      <p className="text-sm text-gray-500">{booking.durationMinutes} min</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{formatDate(booking.scheduledAt)}</p>
                      <p className="text-sm text-gray-500">{formatTime(booking.scheduledAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {booking.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking)
                          setShowModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-gray-500 text-center py-8">
            Calendar view coming soon. Use list view for now.
          </p>
        </div>
      )}

      {/* Booking Detail Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    STATUS_COLORS[selectedBooking.status] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {selectedBooking.status.replace('_', ' ')}
                </span>
                <p className="text-sm text-gray-500">
                  Booked {new Date(selectedBooking.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Appointment Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Appointment</h3>
                <p className="text-blue-800">{formatDateTime(selectedBooking.scheduledAt)}</p>
                <p className="text-sm text-blue-700 mt-1">
                  {selectedBooking.service?.name || 'Consultation'} · {selectedBooking.durationMinutes} minutes
                </p>
              </div>

              {/* Client Info */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Client Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{selectedBooking.clientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <a
                      href={`mailto:${selectedBooking.clientEmail}`}
                      className="font-medium text-blue-600 hover:text-blue-700"
                    >
                      {selectedBooking.clientEmail}
                    </a>
                  </div>
                  {selectedBooking.clientPhone && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <a
                        href={`tel:${selectedBooking.clientPhone}`}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        {selectedBooking.clientPhone}
                      </a>
                    </div>
                  )}
                  {selectedBooking.companyName && (
                    <div>
                      <p className="text-sm text-gray-500">Company</p>
                      <p className="font-medium">{selectedBooking.companyName}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Project Details */}
              {(selectedBooking.projectType || selectedBooking.projectDescription || selectedBooking.budgetRange) && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Project Details</h3>
                  <div className="space-y-2">
                    {selectedBooking.projectType && (
                      <div>
                        <p className="text-sm text-gray-500">Type</p>
                        <p>{selectedBooking.projectType}</p>
                      </div>
                    )}
                    {selectedBooking.budgetRange && (
                      <div>
                        <p className="text-sm text-gray-500">Budget</p>
                        <p>{selectedBooking.budgetRange}</p>
                      </div>
                    )}
                    {selectedBooking.projectDescription && (
                      <div>
                        <p className="text-sm text-gray-500">Description</p>
                        <p className="whitespace-pre-wrap">{selectedBooking.projectDescription}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Admin Notes</h3>
                <textarea
                  defaultValue={selectedBooking.adminNotes || ''}
                  onBlur={(e) => updateNotes(selectedBooking.id, e.target.value)}
                  rows={3}
                  placeholder="Add notes about this booking..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                {selectedBooking.status === 'scheduled' && (
                  <button
                    onClick={() => updateStatus(selectedBooking.id, 'confirmed')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    Confirm
                  </button>
                )}
                {['scheduled', 'confirmed'].includes(selectedBooking.status) && (
                  <>
                    <button
                      onClick={() => updateStatus(selectedBooking.id, 'completed')}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
                    >
                      Mark Completed
                    </button>
                    <button
                      onClick={() => updateStatus(selectedBooking.id, 'no_show')}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700"
                    >
                      No Show
                    </button>
                    <button
                      onClick={() => updateStatus(selectedBooking.id, 'cancelled')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
