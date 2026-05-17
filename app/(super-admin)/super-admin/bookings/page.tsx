"use client"

/**
 * Super-admin Bookings page — restyled with cncpt-admin Hybrid design.
 * Data wiring preserved from original: fetches /api/bookings, PATCH status.
 */

import { useState, useEffect } from "react"
import {
  Calendar,
  List,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react"
import "@/app/admin/cncpt-admin.css"

// ─── Types ────────────────────────────────────────────────────────────────────

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
  service?: { name: string }
  createdAt: string
}

type ViewMode = "list" | "calendar"
type StatusFilter =
  | "all"
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusPillClass(status: string): string {
  const map: Record<string, string> = {
    scheduled: "ca-pill--blue",
    confirmed: "ca-pill--green",
    completed: "ca-pill--slate",
    cancelled: "ca-pill--rose",
    no_show: "ca-pill--amber",
  }
  return map[status] ?? ""
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SuperAdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [notesValue, setNotesValue] = useState("")

  useEffect(() => {
    loadBookings()
  }, [statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadBookings(): Promise<void> {
    setLoading(true)
    try {
      const url =
        statusFilter === "all"
          ? "/api/bookings"
          : `/api/bookings?status=${statusFilter}`
      const res = await fetch(url)
      const data = (await res.json()) as { bookings?: Booking[] }
      setBookings(data.bookings ?? [])
    } catch {
      // Silent fail — empty state handles this gracefully in UI
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(bookingId: string, status: string): Promise<void> {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        await loadBookings()
        if (selectedBooking?.id === bookingId) {
          const data = (await res.json()) as { booking?: Booking }
          if (data.booking) setSelectedBooking(data.booking)
        }
      }
    } catch {
      // No-op — user can retry
    }
  }

  async function saveNotes(bookingId: string, adminNotes: string): Promise<void> {
    try {
      await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes }),
      })
    } catch {
      // No-op
    }
  }

  const upcomingBookings = bookings.filter(
    (b) =>
      new Date(b.scheduledAt) > new Date() &&
      ["scheduled", "confirmed"].includes(b.status)
  )

  const todayBookings = bookings.filter((b) => {
    const bookingDate = new Date(b.scheduledAt).toDateString()
    const today = new Date().toDateString()
    return (
      bookingDate === today && ["scheduled", "confirmed"].includes(b.status)
    )
  })

  const openBooking = (b: Booking): void => {
    setSelectedBooking(b)
    setNotesValue(b.adminNotes ?? "")
    setShowModal(true)
  }

  const STATUS_FILTERS: StatusFilter[] = [
    "all",
    "scheduled",
    "confirmed",
    "completed",
    "cancelled",
    "no_show",
  ]

  const filterLabel = (s: StatusFilter): string =>
    s === "all"
      ? "All"
      : s === "no_show"
      ? "No Show"
      : s.charAt(0).toUpperCase() + s.slice(1)

  if (loading) {
    return (
      <div
        className="cncpt-admin"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2
          size={28}
          style={{ animation: "spin 1s linear infinite", color: "var(--ca-text-soft)" }}
        />
      </div>
    )
  }

  return (
    <div className="cncpt-admin" style={{ minHeight: "100vh", padding: 24 }}>
      {/* Header */}
      <div className="ca-page-h" style={{ marginBottom: 20 }}>
        <div>
          <h1>Bookings</h1>
          <div className="sub">
            {upcomingBookings.length} upcoming · {todayBookings.length} today
          </div>
        </div>
        <div className="ca-row" style={{ gap: 6 }}>
          {/* View mode toggle */}
          <div
            className="ca-row"
            style={{
              background: "var(--ca-bg)",
              border: "1px solid var(--ca-border)",
              borderRadius: 7,
              padding: 2,
              gap: 2,
            }}
          >
            {(["list", "calendar"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                className="ca-btn ca-btn--xs"
                style={{
                  borderRadius: 5,
                  background: viewMode === mode ? "#fff" : "transparent",
                  boxShadow: viewMode === mode ? "var(--ca-shadow-sm)" : "none",
                  color:
                    viewMode === mode ? "var(--ca-text)" : "var(--ca-text-soft)",
                  border: "none",
                }}
                onClick={() => setViewMode(mode)}
              >
                {mode === "list" ? (
                  <List size={12} aria-hidden />
                ) : (
                  <Calendar size={12} aria-hidden />
                )}
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[
          { label: "Today", value: todayBookings.length, Icon: Clock },
          { label: "Upcoming", value: upcomingBookings.length, Icon: Calendar },
          {
            label: "Completed",
            value: bookings.filter((b) => b.status === "completed").length,
            Icon: CheckCircle2,
          },
          {
            label: "Cancelled",
            value: bookings.filter((b) => b.status === "cancelled").length,
            Icon: XCircle,
          },
        ].map(({ label, value, Icon }) => (
          <div className="ca-stat" key={label}>
            <div className="ca-stat__label">
              <Icon size={12} aria-hidden />
              {label}
            </div>
            <div className="ca-stat__value">{value}</div>
          </div>
        ))}
      </div>

      {/* Status filters */}
      <div className="ca-filter-bar" style={{ marginBottom: 12 }}>
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            className={`ca-filter-chip${statusFilter === s ? " is-on" : ""}`}
            onClick={() => setStatusFilter(s)}
          >
            {filterLabel(s)}
          </button>
        ))}
      </div>

      {/* List view */}
      {viewMode === "list" && (
        <div className="ca-card" style={{ overflow: "hidden" }}>
          {bookings.length === 0 ? (
            <div className="ca-empty">
              <div className="ca-empty__glyph">
                <Calendar size={28} aria-hidden />
              </div>
              <h3 className="ca-empty__h">No bookings found</h3>
              <p className="ca-empty__p">
                No bookings match the current filter. Try changing the status
                filter above.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="ca-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Service</th>
                    <th>Date &amp; Time</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th style={{ width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <div className="ca-col" style={{ gap: 1 }}>
                          <strong style={{ fontSize: 12.5 }}>{b.clientName}</strong>
                          <span className="ca-muted" style={{ fontSize: 11 }}>
                            {b.clientEmail}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span>{b.service?.name ?? "Consultation"}</span>
                      </td>
                      <td>
                        <div className="ca-col" style={{ gap: 1 }}>
                          <span style={{ fontWeight: 500 }}>
                            {formatDate(b.scheduledAt)}
                          </span>
                          <span className="ca-muted" style={{ fontSize: 11 }}>
                            {formatTime(b.scheduledAt)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="ca-muted">{b.durationMinutes} min</span>
                      </td>
                      <td>
                        <span className={`ca-pill ${statusPillClass(b.status)}`}>
                          {b.status.replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="ca-btn ca-btn--ghost ca-btn--xs"
                          onClick={() => openBooking(b)}
                        >
                          View <ChevronRight size={11} aria-hidden />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Calendar view placeholder */}
      {viewMode === "calendar" && (
        <div className="ca-card">
          <div className="ca-empty">
            <div className="ca-empty__glyph">
              <Calendar size={28} aria-hidden />
            </div>
            <h3 className="ca-empty__h">Calendar view coming soon</h3>
            <p className="ca-empty__p">Use list view to manage bookings for now.</p>
            <button
              type="button"
              className="ca-btn ca-btn--secondary"
              onClick={() => setViewMode("list")}
            >
              <List size={13} aria-hidden /> Switch to list
            </button>
          </div>
        </div>
      )}

      {/* Booking detail modal */}
      {showModal && selectedBooking && (
        <div className="ca-modal-wrap">
          <div className="ca-modal ca-modal--wide">
            <div className="ca-modal__head">
              <div className="ca-modal__icon ca-modal__icon--info">
                <Calendar size={18} aria-hidden />
              </div>
              <div className="ca-col" style={{ flex: 1, gap: 2 }}>
                <h3 className="ca-modal__title">Booking Details</h3>
                <p className="ca-modal__sub">
                  Booked {new Date(selectedBooking.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                className="ca-iconbtn ca-iconbtn--ghost"
                onClick={() => setShowModal(false)}
              >
                <X size={14} aria-hidden />
              </button>
            </div>

            <div className="ca-modal__body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Status */}
              <div className="ca-row ca-between">
                <span className={`ca-pill ${statusPillClass(selectedBooking.status)}`}>
                  {selectedBooking.status.replace("_", " ")}
                </span>
                <span className="ca-muted" style={{ fontSize: 11.5 }}>
                  Booked {new Date(selectedBooking.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Appointment */}
              <div
                style={{
                  background: "var(--ca-primary-50)",
                  borderRadius: 8,
                  padding: "12px 14px",
                  border: "1px solid #bfdbfe",
                }}
              >
                <div style={{ fontWeight: 600, color: "#1e3a8a", marginBottom: 4 }}>
                  Appointment
                </div>
                <div style={{ fontSize: 13.5, color: "#1e3a8a" }}>
                  {formatDateTime(selectedBooking.scheduledAt)}
                </div>
                <div className="ca-muted" style={{ fontSize: 12, marginTop: 4 }}>
                  {selectedBooking.service?.name ?? "Consultation"} ·{" "}
                  {selectedBooking.durationMinutes} minutes
                </div>
              </div>

              {/* Client info */}
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                  Client Information
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px 16px",
                    fontSize: 12.5,
                  }}
                >
                  <div className="ca-col" style={{ gap: 2 }}>
                    <span className="ca-muted">Name</span>
                    <strong>{selectedBooking.clientName}</strong>
                  </div>
                  <div className="ca-col" style={{ gap: 2 }}>
                    <span className="ca-muted">Email</span>
                    <a
                      href={`mailto:${selectedBooking.clientEmail}`}
                      style={{ color: "var(--ca-primary)", fontWeight: 500 }}
                    >
                      {selectedBooking.clientEmail}
                    </a>
                  </div>
                  {selectedBooking.clientPhone && (
                    <div className="ca-col" style={{ gap: 2 }}>
                      <span className="ca-muted">Phone</span>
                      <a
                        href={`tel:${selectedBooking.clientPhone}`}
                        style={{ color: "var(--ca-primary)", fontWeight: 500 }}
                      >
                        {selectedBooking.clientPhone}
                      </a>
                    </div>
                  )}
                  {selectedBooking.companyName && (
                    <div className="ca-col" style={{ gap: 2 }}>
                      <span className="ca-muted">Company</span>
                      <strong>{selectedBooking.companyName}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Project details */}
              {(selectedBooking.projectType ||
                selectedBooking.projectDescription ||
                selectedBooking.budgetRange) && (
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                    Project Details
                  </div>
                  <div className="ca-col" style={{ gap: 6, fontSize: 12.5 }}>
                    {selectedBooking.projectType && (
                      <div className="ca-col" style={{ gap: 2 }}>
                        <span className="ca-muted">Type</span>
                        <span>{selectedBooking.projectType}</span>
                      </div>
                    )}
                    {selectedBooking.budgetRange && (
                      <div className="ca-col" style={{ gap: 2 }}>
                        <span className="ca-muted">Budget</span>
                        <span>{selectedBooking.budgetRange}</span>
                      </div>
                    )}
                    {selectedBooking.projectDescription && (
                      <div className="ca-col" style={{ gap: 2 }}>
                        <span className="ca-muted">Description</span>
                        <span style={{ whiteSpace: "pre-wrap" }}>
                          {selectedBooking.projectDescription}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin notes */}
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Admin Notes
                </div>
                <textarea
                  className="ca-textarea"
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  onBlur={() => saveNotes(selectedBooking.id, notesValue)}
                  rows={3}
                  placeholder="Add notes about this booking…"
                />
              </div>
            </div>

            <div className="ca-modal__foot" style={{ justifyContent: "flex-start" }}>
              {selectedBooking.status === "scheduled" && (
                <button
                  type="button"
                  className="ca-btn ca-btn--primary ca-btn--sm"
                  onClick={() => updateStatus(selectedBooking.id, "confirmed")}
                >
                  <CheckCircle2 size={13} aria-hidden /> Confirm
                </button>
              )}
              {["scheduled", "confirmed"].includes(selectedBooking.status) && (
                <>
                  <button
                    type="button"
                    className="ca-btn ca-btn--secondary ca-btn--sm"
                    onClick={() => updateStatus(selectedBooking.id, "completed")}
                  >
                    Mark Completed
                  </button>
                  <button
                    type="button"
                    className="ca-btn ca-btn--secondary ca-btn--sm"
                    onClick={() => updateStatus(selectedBooking.id, "no_show")}
                  >
                    No Show
                  </button>
                  <button
                    type="button"
                    className="ca-btn ca-btn--danger ca-btn--sm"
                    onClick={() => updateStatus(selectedBooking.id, "cancelled")}
                  >
                    <XCircle size={13} aria-hidden /> Cancel
                  </button>
                </>
              )}
              <div style={{ flex: 1 }} />
              <button
                type="button"
                className="ca-btn ca-btn--ghost ca-btn--sm"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
