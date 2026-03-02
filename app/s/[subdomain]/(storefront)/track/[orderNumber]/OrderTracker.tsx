'use client'

import { useState } from 'react'
import { Check, Clock, Package, Truck, Home, AlertCircle } from 'lucide-react'

interface StageView {
  displayName: string
  icon?: string | null
  color?: string | null
  isCompleted: boolean
  isCurrent: boolean
  completedAt: Date | null
}

interface ProgressView {
  orderId: string
  orderNumber: string
  currentStage: {
    displayName: string
    customerMessage?: string | null
    icon?: string | null
    color?: string | null
    isTerminal: boolean
  } | null
  stages: StageView[]
  estimatedDelivery: Date | null
}

interface Shipment {
  id: string
  trackingNumber: string | null
  carrier: string | null
  status: string
}

interface OrderTrackerProps {
  orderNumber: string
  orderEmail: string
  orderStatus: string
  orderTotal: number
  orderDate: string
  itemCount: number
  shipment: Shipment | null
  progress: ProgressView | null
  requiresEmailVerification: boolean
  providedEmail?: string
}

// Map icons names to components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  package: Package,
  truck: Truck,
  home: Home,
  check: Check,
  clock: Clock,
}

function getIconComponent(iconName?: string | null) {
  if (!iconName) return Check
  return iconMap[iconName.toLowerCase()] || Check
}

export function OrderTracker({
  orderNumber,
  orderEmail,
  orderStatus,
  orderTotal,
  orderDate,
  itemCount,
  shipment,
  progress,
  requiresEmailVerification,
  providedEmail,
}: OrderTrackerProps) {
  const [email, setEmail] = useState(providedEmail || '')
  const [isVerified, setIsVerified] = useState(!requiresEmailVerification || !!providedEmail)
  const [verificationError, setVerificationError] = useState('')

  const handleVerify = () => {
    if (email.toLowerCase() === orderEmail.toLowerCase()) {
      setIsVerified(true)
      setVerificationError('')
    } else {
      setVerificationError('The email address does not match our records for this order.')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Email verification gate
  if (!isVerified) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-3 sm:mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Track Order {orderNumber}</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Please enter your email address to view order details
          </p>
        </div>

        <div className="max-w-sm mx-auto space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="Enter your email"
            />
          </div>

          {verificationError && (
            <div className="flex items-start gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{verificationError}</span>
            </div>
          )}

          <button
            onClick={handleVerify}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View Order Status
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Order Header */}
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold">Order {orderNumber}</h1>
          <span
            className={`self-start px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
              orderStatus === 'DELIVERED'
                ? 'bg-green-100 text-green-800'
                : orderStatus === 'CANCELLED'
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {orderStatus}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm">Order Date</p>
            <p className="font-medium text-xs sm:text-sm">{formatDate(orderDate)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs sm:text-sm">Items</p>
            <p className="font-medium text-xs sm:text-sm">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs sm:text-sm">Total</p>
            <p className="font-medium text-xs sm:text-sm">{formatCurrency(orderTotal)}</p>
          </div>
          <div className="min-w-0">
            <p className="text-gray-500 text-xs sm:text-sm">Email</p>
            <p className="font-medium text-xs sm:text-sm truncate">{orderEmail}</p>
          </div>
        </div>
      </div>

      {/* Progress Tracker */}
      {progress && progress.stages.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Order Progress</h2>

          {/* Current Stage Message */}
          {progress.currentStage && (
            <div
              className="mb-6 sm:mb-8 p-3 sm:p-4 rounded-lg"
              style={{
                backgroundColor: progress.currentStage.color
                  ? `${progress.currentStage.color}20`
                  : '#EBF5FF',
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className="p-1.5 sm:p-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: progress.currentStage.color || '#3B82F6',
                  }}
                >
                  {(() => {
                    const Icon = getIconComponent(progress.currentStage.icon)
                    return <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  })()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm sm:text-base">{progress.currentStage.displayName}</p>
                  {progress.currentStage.customerMessage && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      {progress.currentStage.customerMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Progress Timeline - horizontal on desktop, vertical on mobile */}
          <div className="relative">
            {/* Desktop: Horizontal timeline */}
            <div className="hidden sm:flex items-start justify-between">
              {progress.stages.map((stage, index) => {
                const Icon = getIconComponent(stage.icon)
                const isLast = index === progress.stages.length - 1

                return (
                  <div
                    key={index}
                    className="flex flex-col items-center relative flex-1"
                  >
                    {/* Connector Line */}
                    {!isLast && (
                      <div
                        className={`absolute top-5 left-1/2 w-full h-0.5 ${
                          stage.isCompleted ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                        style={{ transform: 'translateX(50%)' }}
                      />
                    )}

                    {/* Stage Circle */}
                    <div
                      className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                        stage.isCurrent
                          ? 'ring-4 ring-blue-100'
                          : ''
                      }`}
                      style={{
                        backgroundColor: stage.isCompleted || stage.isCurrent
                          ? stage.color || '#22C55E'
                          : '#E5E7EB',
                      }}
                    >
                      {stage.isCompleted ? (
                        <Check className="h-5 w-5 text-white" />
                      ) : stage.isCurrent ? (
                        <Clock className="h-5 w-5 text-white animate-pulse" />
                      ) : (
                        <Icon className="h-5 w-5 text-gray-400" />
                      )}
                    </div>

                    {/* Stage Label */}
                    <div className="mt-3 text-center">
                      <p
                        className={`text-xs font-medium ${
                          stage.isCurrent || stage.isCompleted
                            ? 'text-gray-900'
                            : 'text-gray-400'
                        }`}
                      >
                        {stage.displayName}
                      </p>
                      {stage.completedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(stage.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Mobile: Vertical timeline */}
            <div className="sm:hidden space-y-0">
              {progress.stages.map((stage, index) => {
                const Icon = getIconComponent(stage.icon)
                const isLast = index === progress.stages.length - 1

                return (
                  <div key={index} className="flex items-start gap-3 relative">
                    {/* Vertical connector */}
                    {!isLast && (
                      <div
                        className={`absolute left-4 top-8 w-0.5 h-[calc(100%-0.5rem)] ${
                          stage.isCompleted ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )}

                    {/* Stage Circle */}
                    <div
                      className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-all ${
                        stage.isCurrent ? 'ring-4 ring-blue-100' : ''
                      }`}
                      style={{
                        backgroundColor: stage.isCompleted || stage.isCurrent
                          ? stage.color || '#22C55E'
                          : '#E5E7EB',
                      }}
                    >
                      {stage.isCompleted ? (
                        <Check className="h-4 w-4 text-white" />
                      ) : stage.isCurrent ? (
                        <Clock className="h-4 w-4 text-white animate-pulse" />
                      ) : (
                        <Icon className="h-4 w-4 text-gray-400" />
                      )}
                    </div>

                    {/* Stage Info */}
                    <div className="pb-6 pt-1">
                      <p
                        className={`text-sm font-medium ${
                          stage.isCurrent || stage.isCompleted
                            ? 'text-gray-900'
                            : 'text-gray-400'
                        }`}
                      >
                        {stage.displayName}
                      </p>
                      {stage.completedAt && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(stage.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Estimated Delivery */}
          {progress.estimatedDelivery && (
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t">
              <div className="flex items-center gap-2 text-gray-600 text-sm sm:text-base">
                <Truck className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span>
                  Estimated Delivery:{' '}
                  <strong>{formatDate(progress.estimatedDelivery.toISOString())}</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shipment Tracking */}
      {shipment && shipment.trackingNumber && (
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Shipment Details</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 text-sm">Carrier</span>
              <span className="font-medium text-sm">{shipment.carrier || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 text-sm shrink-0">Tracking Number</span>
              <span className="font-mono text-xs sm:text-sm truncate ml-2">{shipment.trackingNumber}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 text-sm">Status</span>
              <span className="font-medium text-sm">{shipment.status}</span>
            </div>
          </div>

          {/* Link to carrier tracking */}
          <a
            href={getCarrierTrackingUrl(shipment.carrier, shipment.trackingNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm sm:text-base py-1"
          >
            <Truck className="h-4 w-4" />
            Track on Carrier Website
          </a>
        </div>
      )}

      {/* No Progress Available */}
      {(!progress || progress.stages.length === 0) && (
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 text-center">
          <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-3 sm:mb-4" />
          <h2 className="text-base sm:text-lg font-semibold mb-2">Order Received</h2>
          <p className="text-sm sm:text-base text-gray-600">
            Your order is being processed. Check back later for detailed tracking updates.
          </p>
        </div>
      )}
    </div>
  )
}

function getCarrierTrackingUrl(carrier: string | null, trackingNumber: string): string {
  const trackingUrls: Record<string, string> = {
    'USPS': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
    'FEDEX': `https://www.fedex.com/fedextrack/?tracknumbers=${trackingNumber}`,
    'DHL': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
  }

  return trackingUrls[carrier?.toUpperCase() || ''] || '#'
}
