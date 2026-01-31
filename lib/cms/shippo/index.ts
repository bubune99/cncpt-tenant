/**
 * Shippo Shipping Service Layer
 *
 * Core integration with Shippo API for:
 * - Address validation
 * - Rate shopping (USPS, UPS, FedEx)
 * - Label generation (PDF/PNG)
 * - Tracking updates
 * - Refunds
 *
 * Configuration is read from:
 * 1. Database (settings table -> shipping group) - preferred
 * 2. Environment variables - fallback
 */

import { Shippo } from 'shippo'
import { prisma } from '../db'
import { safeDecrypt } from '../encryption'
import type {
  ShippingAddress,
  ValidatedAddress,
  Parcel,
  ShippingRate,
  CreateShipmentRequest,
  ShipmentResponse,
  PurchaseLabelRequest,
  LabelResponse,
  LabelFormat,
  TrackingStatus,
  RefundResponse,
  CarrierType,
  ShippingSettings,
} from './types'

// Cache for shipping settings to avoid repeated DB queries
let cachedSettings: ShippingSettings | null = null
let cacheExpiry: number = 0
const CACHE_TTL = 60000 // 1 minute cache

/**
 * Fetch shipping settings from the database
 * Falls back to environment variables if database settings are not available
 * API key always falls back to env var if not in database (for easier setup)
 */
export async function getShippingSettings(): Promise<ShippingSettings> {
  // Return cached settings if still valid
  if (cachedSettings && Date.now() < cacheExpiry) {
    return cachedSettings
  }

  // Start with env-based defaults
  const envApiKey = process.env.SHIPPO_API_KEY
  const envWebhookSecret = process.env.SHIPPO_WEBHOOK_SECRET

  try {
    // Fetch all shipping-related settings from the database
    const settings = await prisma.setting.findMany({
      where: { group: 'shipping' },
    })

    if (settings.length > 0) {
      // Build settings object from database records
      // Decrypt encrypted values
      const settingsMap: Record<string, string> = {}
      for (const setting of settings) {
        // Decrypt if marked as encrypted
        settingsMap[setting.key] = setting.encrypted
          ? safeDecrypt(setting.value)
          : setting.value
      }

      const dbSettings: ShippingSettings = {
        enabled: settingsMap['shipping.enabled'] === 'true',
        // Always fall back to env var for API key - makes setup easier
        shippoApiKey: settingsMap['shipping.shippoApiKey'] || envApiKey,
        shippoWebhookSecret: settingsMap['shipping.shippoWebhookSecret'] || envWebhookSecret,
        testMode: settingsMap['shipping.testMode'] === 'true',
        useElements: settingsMap['shipping.useElements'] !== 'false', // Default to true
        fromName: settingsMap['shipping.fromName'],
        fromCompany: settingsMap['shipping.fromCompany'],
        fromStreet1: settingsMap['shipping.fromStreet1'],
        fromStreet2: settingsMap['shipping.fromStreet2'],
        fromCity: settingsMap['shipping.fromCity'],
        fromState: settingsMap['shipping.fromState'],
        fromZip: settingsMap['shipping.fromZip'],
        fromCountry: settingsMap['shipping.fromCountry'] || 'US',
        fromPhone: settingsMap['shipping.fromPhone'],
        fromEmail: settingsMap['shipping.fromEmail'],
        enabledCarriers: settingsMap['shipping.enabledCarriers']
          ? JSON.parse(settingsMap['shipping.enabledCarriers'])
          : ['usps', 'ups', 'fedex'],
        defaultLabelFormat: settingsMap['shipping.defaultLabelFormat'] as LabelFormat || 'PDF',
        defaultPackageWeight: settingsMap['shipping.defaultPackageWeight']
          ? parseInt(settingsMap['shipping.defaultPackageWeight'])
          : 16,
        requireSignature: settingsMap['shipping.requireSignature'] === 'true',
      }

      // If shipping is enabled (either explicitly or API key present in env), use db settings
      // This allows using env var for API key while still customizing other settings in DB
      if (dbSettings.enabled || (dbSettings.shippoApiKey && settingsMap['shipping.enabled'] === undefined)) {
        // If enabled wasn't explicitly set but we have an API key, auto-enable
        if (settingsMap['shipping.enabled'] === undefined && dbSettings.shippoApiKey) {
          dbSettings.enabled = true
        }
        cachedSettings = dbSettings
        cacheExpiry = Date.now() + CACHE_TTL
        return dbSettings
      }
    }
  } catch (error) {
    console.warn('Could not fetch shipping settings from database, using env vars:', error)
  }

  // Fall back to environment variables entirely
  // Auto-enable if API key is present
  const envSettings: ShippingSettings = {
    enabled: !!envApiKey, // Auto-enable if API key exists
    shippoApiKey: envApiKey,
    shippoWebhookSecret: envWebhookSecret,
    testMode: process.env.NODE_ENV !== 'production',
    useElements: true, // Default to using Shippo Elements
    fromName: process.env.SHIP_FROM_NAME,
    fromCompany: process.env.SHIP_FROM_COMPANY,
    fromStreet1: process.env.SHIP_FROM_STREET,
    fromStreet2: process.env.SHIP_FROM_STREET2,
    fromCity: process.env.SHIP_FROM_CITY,
    fromState: process.env.SHIP_FROM_STATE,
    fromZip: process.env.SHIP_FROM_ZIP,
    fromCountry: process.env.SHIP_FROM_COUNTRY || 'US',
    fromPhone: process.env.SHIP_FROM_PHONE,
    fromEmail: process.env.SHIP_FROM_EMAIL,
    enabledCarriers: ['usps', 'ups', 'fedex'],
    defaultLabelFormat: 'PDF',
    defaultPackageWeight: 16,
    requireSignature: false,
  }

  cachedSettings = envSettings
  cacheExpiry = Date.now() + CACHE_TTL
  return envSettings
}

/**
 * Clear the settings cache (useful after settings are updated)
 */
export function clearShippingSettingsCache(): void {
  cachedSettings = null
  cacheExpiry = 0
}

/**
 * Get the Shippo API key from database or environment
 */
async function getShippoApiKey(): Promise<string> {
  const settings = await getShippingSettings()
  const apiKey = settings.shippoApiKey || process.env.SHIPPO_API_KEY

  if (!apiKey) {
    throw new Error('Shippo API key is not configured. Set it in Settings > Shipping or SHIPPO_API_KEY env var.')
  }

  return apiKey
}

/**
 * Initialize Shippo client with API key from database or environment
 */
async function getShippoClientAsync(): Promise<Shippo> {
  const apiKey = await getShippoApiKey()
  return new Shippo({ apiKeyHeader: apiKey })
}

// Synchronous version for backwards compatibility (uses env var only)
const getShippoClient = (): Shippo => {
  const apiKey = process.env.SHIPPO_API_KEY
  if (!apiKey) {
    throw new Error('SHIPPO_API_KEY environment variable is not set')
  }
  return new Shippo({ apiKeyHeader: apiKey })
}

/**
 * Get default ship-from address from database or environment variables
 */
export async function getDefaultFromAddress(): Promise<ShippingAddress> {
  const settings = await getShippingSettings()

  return {
    name: settings.fromName || process.env.SHIP_FROM_NAME || '',
    company: settings.fromCompany || process.env.SHIP_FROM_COMPANY,
    street1: settings.fromStreet1 || process.env.SHIP_FROM_STREET || '',
    street2: settings.fromStreet2 || process.env.SHIP_FROM_STREET2,
    city: settings.fromCity || process.env.SHIP_FROM_CITY || '',
    state: settings.fromState || process.env.SHIP_FROM_STATE || '',
    zip: settings.fromZip || process.env.SHIP_FROM_ZIP || '',
    country: settings.fromCountry || process.env.SHIP_FROM_COUNTRY || 'US',
    phone: settings.fromPhone || process.env.SHIP_FROM_PHONE,
    email: settings.fromEmail || process.env.SHIP_FROM_EMAIL,
  }
}

/**
 * Validate a shipping address
 * Returns validated/standardized address with any messages
 */
export async function validateAddress(address: ShippingAddress): Promise<ValidatedAddress> {
  const shippo = await getShippoClientAsync()

  try {
    const response = await shippo.addresses.create({
      name: address.name,
      company: address.company,
      street1: address.street1,
      street2: address.street2,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      phone: address.phone,
      email: address.email,
      validate: true,
    })

    const isValid = response.validationResults?.isValid ?? false
    const messages = response.validationResults?.messages?.map((msg: { source?: string; code?: string; text?: string; type?: string }) => ({
      source: msg.source || 'shippo',
      code: msg.code || '',
      text: msg.text || '',
      type: (msg.type as 'error' | 'warning' | 'info') || 'info',
    })) || []

    return {
      ...address,
      name: response.name || address.name,
      street1: response.street1 || address.street1,
      street2: response.street2,
      city: response.city || address.city,
      state: response.state || address.state,
      zip: response.zip || address.zip,
      country: response.country || address.country,
      isValid,
      messages,
    }
  } catch (error) {
    console.error('Address validation error:', error)
    return {
      ...address,
      isValid: false,
      messages: [{
        source: 'shippo',
        code: 'VALIDATION_ERROR',
        text: error instanceof Error ? error.message : 'Address validation failed',
        type: 'error',
      }],
    }
  }
}

/**
 * Create a shipment and get rates from all carriers
 */
export async function createShipment(request: CreateShipmentRequest): Promise<ShipmentResponse> {
  const shippo = await getShippoClientAsync()

  try {
    const shipment = await shippo.shipments.create({
      addressFrom: {
        name: request.addressFrom.name,
        company: request.addressFrom.company,
        street1: request.addressFrom.street1,
        street2: request.addressFrom.street2,
        city: request.addressFrom.city,
        state: request.addressFrom.state,
        zip: request.addressFrom.zip,
        country: request.addressFrom.country,
        phone: request.addressFrom.phone,
        email: request.addressFrom.email,
      },
      addressTo: {
        name: request.addressTo.name,
        company: request.addressTo.company,
        street1: request.addressTo.street1,
        street2: request.addressTo.street2,
        city: request.addressTo.city,
        state: request.addressTo.state,
        zip: request.addressTo.zip,
        country: request.addressTo.country,
        phone: request.addressTo.phone,
        email: request.addressTo.email,
      },
      parcels: request.parcels.map((parcel) => ({
        length: String(parcel.length),
        width: String(parcel.width),
        height: String(parcel.height),
        weight: String(parcel.weight),
        massUnit: parcel.massUnit || 'oz',
        distanceUnit: parcel.distanceUnit || 'in',
      })),
      extra: request.extra ? {
        signatureConfirmation: request.extra.signature,
        insurance: request.extra.insurance ? {
          amount: request.extra.insurance.amount,
          currency: request.extra.insurance.currency,
          content: request.extra.insurance.content,
        } : undefined,
        reference1: request.extra.reference1,
        reference2: request.extra.reference2,
        saturdayDelivery: request.extra.saturdayDelivery,
      } : undefined,
      async: false,
    })

    // Map rates to our format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rates: ShippingRate[] = (shipment.rates || []).map((rate: any) => ({
      rateId: rate.objectId || '',
      carrier: mapCarrier(rate.provider || ''),
      carrierAccount: rate.carrierAccount || '',
      servicelevel: {
        name: rate.servicelevel?.name || '',
        token: rate.servicelevel?.token || '',
        terms: rate.servicelevel?.terms,
      },
      amount: rate.amount || '0',
      currency: rate.currency || 'USD',
      amountLocal: rate.amountLocal,
      currencyLocal: rate.currencyLocal,
      estimatedDays: rate.estimatedDays,
      durationTerms: rate.durationTerms,
      zone: rate.zone,
      attributes: rate.attributes,
      provider: rate.provider,
      arrivesBy: rate.arrivesBy,
    }))

    // Sort rates by price
    rates.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))

    return {
      shipmentId: shipment.objectId || '',
      status: (shipment.status as ShipmentResponse['status']) || 'ERROR',
      rates,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: shipment.messages?.map((msg: any) => ({
        source: msg.source || '',
        code: msg.code || '',
        text: msg.text || '',
      })),
    }
  } catch (error) {
    console.error('Create shipment error:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to create shipment')
  }
}

/**
 * Get rates for an existing shipment
 */
export async function getRates(shipmentId: string): Promise<ShippingRate[]> {
  const shippo = await getShippoClientAsync()

  try {
    const shipment = await shippo.shipments.get(shipmentId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rates: ShippingRate[] = (shipment.rates || []).map((rate: any) => ({
      rateId: rate.objectId || '',
      carrier: mapCarrier(rate.provider || ''),
      carrierAccount: rate.carrierAccount || '',
      servicelevel: {
        name: rate.servicelevel?.name || '',
        token: rate.servicelevel?.token || '',
        terms: rate.servicelevel?.terms,
      },
      amount: rate.amount || '0',
      currency: rate.currency || 'USD',
      amountLocal: rate.amountLocal,
      currencyLocal: rate.currencyLocal,
      estimatedDays: rate.estimatedDays,
      durationTerms: rate.durationTerms,
      zone: rate.zone,
      attributes: rate.attributes,
      provider: rate.provider,
      arrivesBy: rate.arrivesBy,
    }))

    return rates.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))
  } catch (error) {
    console.error('Get rates error:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to get rates')
  }
}

/**
 * Purchase a shipping label
 */
export async function purchaseLabel(request: PurchaseLabelRequest): Promise<LabelResponse> {
  const shippo = await getShippoClientAsync()

  try {
    const transaction = await shippo.transactions.create({
      rate: request.rateId,
      labelFileType: mapLabelFormat(request.labelFormat || 'PDF'),
      async: request.async ?? false,
    })

    // Handle rate being either a string ID or CoreRate object
    const rateData = typeof transaction.rate === 'string'
      ? { objectId: transaction.rate }
      : transaction.rate

    return {
      transactionId: transaction.objectId || '',
      status: (transaction.status as LabelResponse['status']) || 'ERROR',
      rate: {
        rateId: rateData?.objectId || request.rateId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        carrier: mapCarrier((rateData as any)?.provider || ''),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        carrierAccount: (rateData as any)?.carrierAccount || '',
        servicelevel: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name: (rateData as any)?.servicelevel?.name || '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          token: (rateData as any)?.servicelevel?.token || '',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        amount: (rateData as any)?.amount || '0',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        currency: (rateData as any)?.currency || 'USD',
      },
      trackingNumber: transaction.trackingNumber || '',
      trackingUrl: transaction.trackingUrlProvider || '',
      labelUrl: transaction.labelUrl || '',
      commercialInvoiceUrl: transaction.commercialInvoiceUrl,
      eta: transaction.eta,
      messages: transaction.messages?.map((msg: { source?: string; code?: string; text?: string }) => ({
        source: msg.source || '',
        code: msg.code || '',
        text: msg.text || '',
      })),
    }
  } catch (error) {
    console.error('Purchase label error:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to purchase label')
  }
}

/**
 * Get tracking status for a shipment
 */
export async function getTracking(carrier: CarrierType, trackingNumber: string): Promise<TrackingStatus> {
  const shippo = await getShippoClientAsync()

  try {
    const tracking = await shippo.trackingStatus.get(carrier, trackingNumber)

    // Helper to convert Date to ISO string
    const toIsoString = (date: Date | string | undefined): string | undefined => {
      if (!date) return undefined
      return date instanceof Date ? date.toISOString() : date
    }

    return {
      carrier,
      trackingNumber: tracking.trackingNumber || trackingNumber,
      eta: toIsoString(tracking.eta),
      servicelevel: tracking.servicelevel ? {
        name: tracking.servicelevel.name || '',
        token: tracking.servicelevel.token || '',
      } : undefined,
      addressFrom: tracking.addressFrom ? {
        city: tracking.addressFrom.city,
        state: tracking.addressFrom.state,
        zip: tracking.addressFrom.zip,
        country: tracking.addressFrom.country,
      } : undefined,
      addressTo: tracking.addressTo ? {
        city: tracking.addressTo.city,
        state: tracking.addressTo.state,
        zip: tracking.addressTo.zip,
        country: tracking.addressTo.country,
      } : undefined,
      trackingStatus: {
        status: mapTrackingStatus(tracking.trackingStatus?.status || 'UNKNOWN'),
        statusDetails: tracking.trackingStatus?.statusDetails || '',
        statusDate: toIsoString(tracking.trackingStatus?.statusDate) || new Date().toISOString(),
        location: tracking.trackingStatus?.location ? {
          city: tracking.trackingStatus.location.city,
          state: tracking.trackingStatus.location.state,
          zip: tracking.trackingStatus.location.zip,
          country: tracking.trackingStatus.location.country,
        } : undefined,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trackingHistory: (tracking.trackingHistory || []).map((event: any) => ({
        status: mapTrackingStatus(event.status || 'UNKNOWN'),
        statusDetails: event.statusDetails || '',
        statusDate: toIsoString(event.statusDate) || '',
        location: event.location ? {
          city: event.location.city,
          state: event.location.state,
          zip: event.location.zip,
          country: event.location.country,
        } : undefined,
      })),
    }
  } catch (error) {
    console.error('Get tracking error:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to get tracking')
  }
}

/**
 * Request a refund for a label
 */
export async function refundLabel(transactionId: string): Promise<RefundResponse> {
  const shippo = await getShippoClientAsync()

  try {
    const refund = await shippo.refunds.create({
      transaction: transactionId,
    })

    return {
      transactionId,
      status: (refund.status as 'PENDING' | 'SUCCESS' | 'ERROR') || 'PENDING',
    }
  } catch (error) {
    console.error('Refund label error:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to refund label')
  }
}

/**
 * Register a webhook for tracking updates
 */
export async function registerTrackingWebhook(webhookUrl: string): Promise<void> {
  const apiKey = await getShippoApiKey()

  try {
    const response = await fetch('https://api.goshippo.com/webhooks/', {
      method: 'POST',
      headers: {
        'Authorization': `ShippoToken ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        event: 'track_updated',
        is_test: process.env.NODE_ENV !== 'production',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to register webhook: ${error}`)
    }
  } catch (error) {
    console.error('Register webhook error:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to register webhook')
  }
}

// Helper functions
function mapCarrier(provider: string): CarrierType {
  const lower = provider.toLowerCase()
  if (lower.includes('usps')) return 'usps'
  if (lower.includes('ups')) return 'ups'
  if (lower.includes('fedex')) return 'fedex'
  return 'usps' // Default
}

function mapLabelFormat(format: LabelFormat): 'PDF' | 'PNG' | 'ZPLII' {
  if (format.startsWith('PDF')) return 'PDF'
  if (format === 'PNG') return 'PNG'
  if (format === 'ZPLII') return 'ZPLII'
  return 'PDF'
}

function mapTrackingStatus(status: string): TrackingStatus['trackingStatus']['status'] {
  const statusMap: Record<string, TrackingStatus['trackingStatus']['status']> = {
    'UNKNOWN': 'UNKNOWN',
    'PRE_TRANSIT': 'PRE_TRANSIT',
    'TRANSIT': 'TRANSIT',
    'DELIVERED': 'DELIVERED',
    'RETURNED': 'RETURNED',
    'FAILURE': 'FAILURE',
  }
  return statusMap[status] || 'UNKNOWN'
}

// Export types
export * from './types'
