/**
 * Shippo Integration Types
 *
 * TypeScript interfaces for working with Shippo shipping API.
 */

// Address Types
export interface ShippingAddress {
  name: string
  company?: string
  street1: string
  street2?: string
  city: string
  state: string
  zip: string
  country: string
  phone?: string
  email?: string
  isResidential?: boolean
}

export interface ValidatedAddress extends ShippingAddress {
  isValid: boolean
  messages?: AddressValidationMessage[]
  suggestedAddress?: ShippingAddress
}

export interface AddressValidationMessage {
  source: string
  code: string
  text: string
  type: 'error' | 'warning' | 'info'
}

// Parcel Types
export interface Parcel {
  length: number // inches
  width: number // inches
  height: number // inches
  weight: number // ounces
  massUnit?: 'oz' | 'lb' | 'g' | 'kg'
  distanceUnit?: 'in' | 'cm'
}

export interface ParcelTemplate {
  name: string
  carrier: CarrierType
  token: string // Shippo parcel template token
  dimensions: {
    length: number
    width: number
    height: number
  }
}

// Rate Types
export interface ShippingRate {
  rateId: string
  carrier: CarrierType
  carrierAccount: string
  servicelevel: {
    name: string
    token: string
    terms?: string
  }
  amount: string
  currency: string
  amountLocal?: string
  currencyLocal?: string
  estimatedDays?: number
  durationTerms?: string
  zone?: string
  attributes?: string[]
  provider?: string
  arrivesBy?: string
}

// Carrier Types
export type CarrierType = 'usps' | 'ups' | 'fedex'

export interface CarrierAccount {
  id: string
  carrier: CarrierType
  accountId: string
  isActive: boolean
  test: boolean
}

// Shipment Types
export interface CreateShipmentRequest {
  addressFrom: ShippingAddress
  addressTo: ShippingAddress
  parcels: Parcel[]
  customsDeclaration?: CustomsDeclaration
  extra?: ShipmentExtras
}

export interface ShipmentExtras {
  signature?: 'STANDARD' | 'ADULT' | 'CERTIFIED' | 'INDIRECT' | 'CARRIER_CONFIRMATION'
  insurance?: {
    amount: string
    currency: string
    content?: string
  }
  reference1?: string
  reference2?: string
  containsAlcohol?: boolean
  saturdayDelivery?: boolean
}

export interface CustomsDeclaration {
  contentsType: 'DOCUMENTS' | 'GIFT' | 'SAMPLE' | 'MERCHANDISE' | 'HUMANITARIAN_DONATION' | 'RETURN_MERCHANDISE' | 'OTHER'
  contentsExplanation?: string
  items: CustomsItem[]
  nonDeliveryOption?: 'ABANDON' | 'RETURN'
  certify?: boolean
  certifySigner?: string
  incoterm?: 'DDP' | 'DDU'
}

export interface CustomsItem {
  description: string
  quantity: number
  netWeight: string
  massUnit: 'oz' | 'lb' | 'g' | 'kg'
  valueAmount: string
  valueCurrency: string
  originCountry: string
  tariffNumber?: string
}

export interface ShipmentResponse {
  shipmentId: string
  status: 'QUEUED' | 'WAITING' | 'SUCCESS' | 'ERROR'
  rates: ShippingRate[]
  messages?: ShipmentMessage[]
}

export interface ShipmentMessage {
  source: string
  code: string
  text: string
}

// Transaction (Label) Types
export type LabelFormat = 'PDF' | 'PNG' | 'PDF_4x6' | 'PDF_A4' | 'PDF_A6' | 'PNG_2.3x7.5' | 'ZPLII'

export interface PurchaseLabelRequest {
  rateId: string
  labelFormat?: LabelFormat
  labelFileType?: 'PDF' | 'PNG' | 'ZPLII'
  async?: boolean
}

export interface LabelResponse {
  transactionId: string
  status: 'QUEUED' | 'WAITING' | 'SUCCESS' | 'ERROR' | 'REFUNDED' | 'REFUNDPENDING' | 'REFUNDREJECTED'
  rate: ShippingRate
  trackingNumber: string
  trackingUrl: string
  labelUrl: string
  commercialInvoiceUrl?: string
  eta?: string
  messages?: ShipmentMessage[]
}

// Tracking Types
export interface TrackingStatus {
  carrier: CarrierType
  trackingNumber: string
  eta?: string
  servicelevel?: {
    name: string
    token: string
  }
  addressFrom?: Partial<ShippingAddress>
  addressTo?: Partial<ShippingAddress>
  trackingStatus: TrackingEvent
  trackingHistory: TrackingEvent[]
}

export interface TrackingEvent {
  status: TrackingStatusType
  statusDetails: string
  statusDate: string
  location?: {
    city?: string
    state?: string
    zip?: string
    country?: string
  }
  substatus?: {
    code: string
    text: string
    actionRequired: boolean
  }
}

export type TrackingStatusType =
  | 'UNKNOWN'
  | 'PRE_TRANSIT'
  | 'TRANSIT'
  | 'DELIVERED'
  | 'RETURNED'
  | 'FAILURE'

// Refund Types
export interface RefundRequest {
  transactionId: string
}

export interface RefundResponse {
  transactionId: string
  status: 'PENDING' | 'SUCCESS' | 'ERROR'
}

// Webhook Types
export interface ShippoWebhookPayload {
  event: string
  test: boolean
  data: {
    carrier: string
    tracking_number: string
    tracking_status: TrackingEvent
    tracking_history: TrackingEvent[]
  }
}

// Configuration Types
export interface ShippoConfig {
  apiKey: string
  webhookSecret?: string
  defaultFromAddress: ShippingAddress
  carriers: CarrierType[]
  testMode: boolean
}

export interface ShippingSettings {
  enabled?: boolean
  shippoApiKey?: string
  shippoWebhookSecret?: string
  testMode?: boolean
  /** Use Shippo Shipping Elements (embedded widget) instead of custom API integration */
  useElements?: boolean
  fromName?: string
  fromCompany?: string
  fromStreet1?: string
  fromStreet2?: string
  fromCity?: string
  fromState?: string
  fromZip?: string
  fromCountry?: string
  fromPhone?: string
  fromEmail?: string
  enabledCarriers?: CarrierType[]
  defaultLabelFormat?: LabelFormat
  defaultPackageWeight?: number
  requireSignature?: boolean
}

// Shippo Elements Types
export interface ShippoElementsAuthResponse {
  token: string
  expiresAt: string
  organizationId: string
}

export interface ShippoElementsLabel {
  transactionId: string
  trackingNumber: string
  trackingUrl: string
  labelUrl: string
  rate: {
    carrier: string
    service: string
    amount: string
    currency: string
  }
}

// Status Constants
export interface ShipmentStatusOption {
  value: 'pending' | 'label_purchased' | 'in_transit' | 'delivered' | 'exception' | 'refunded'
  label: string
}

export const SHIPMENT_STATUSES: ShipmentStatusOption[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'label_purchased', label: 'Label Purchased' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'exception', label: 'Exception' },
  { value: 'refunded', label: 'Refunded' },
]

export const CARRIER_OPTIONS = [
  { value: 'usps', label: 'USPS' },
  { value: 'ups', label: 'UPS' },
  { value: 'fedex', label: 'FedEx' },
] as const

export const LABEL_FORMAT_OPTIONS = [
  { value: 'PDF', label: 'PDF (Standard)' },
  { value: 'PDF_4x6', label: 'PDF 4x6 (Thermal)' },
  { value: 'PNG', label: 'PNG' },
] as const
