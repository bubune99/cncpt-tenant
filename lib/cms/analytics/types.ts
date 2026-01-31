/**
 * Analytics Types and Configurations
 */

// Analytics provider types
export type AnalyticsProvider = 'google' | 'matomo' | 'plausible' | 'umami' | 'custom'

// Analytics settings stored in database
export interface AnalyticsSettings {
  enabled: boolean

  // Google Analytics
  googleEnabled: boolean
  googleMeasurementId?: string // G-XXXXXXXXXX
  googleDebugMode: boolean

  // Matomo
  matomoEnabled: boolean
  matomoUrl?: string
  matomoSiteId?: string

  // Plausible (optional)
  plausibleEnabled: boolean
  plausibleDomain?: string

  // Privacy settings
  respectDoNotTrack: boolean
  anonymizeIp: boolean
  cookieConsent: boolean
}

// Default analytics settings
export const DEFAULT_ANALYTICS_SETTINGS: AnalyticsSettings = {
  enabled: false,
  googleEnabled: false,
  googleDebugMode: false,
  matomoEnabled: false,
  plausibleEnabled: false,
  respectDoNotTrack: true,
  anonymizeIp: true,
  cookieConsent: true,
}

// Standard event names
export type StandardEventName =
  | 'page_view'
  | 'purchase'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'begin_checkout'
  | 'view_item'
  | 'view_item_list'
  | 'search'
  | 'sign_up'
  | 'login'
  | 'share'
  | 'generate_lead'
  | 'add_payment_info'
  | 'add_shipping_info'
  | 'select_item'
  | 'select_promotion'
  | 'view_promotion'
  | 'refund'

// Custom event
export interface AnalyticsEvent {
  name: string
  params?: Record<string, string | number | boolean | undefined>
}

// E-commerce item
export interface EcommerceItem {
  item_id: string
  item_name: string
  item_brand?: string
  item_category?: string
  item_variant?: string
  price?: number
  quantity?: number
  currency?: string
}

// Purchase event data
export interface PurchaseEventData {
  transaction_id: string
  value: number
  currency: string
  tax?: number
  shipping?: number
  coupon?: string
  items: EcommerceItem[]
}

// Page view data
export interface PageViewData {
  page_title?: string
  page_location?: string
  page_path?: string
}

// User properties
export interface UserProperties {
  user_id?: string
  user_type?: string
  [key: string]: string | number | boolean | undefined
}

// Consent categories
export interface ConsentSettings {
  analytics_storage: 'granted' | 'denied'
  ad_storage: 'granted' | 'denied'
  ad_user_data: 'granted' | 'denied'
  ad_personalization: 'granted' | 'denied'
  functionality_storage: 'granted' | 'denied'
  personalization_storage: 'granted' | 'denied'
  security_storage: 'granted' // Always granted
}

// Default consent (privacy-first)
export const DEFAULT_CONSENT: ConsentSettings = {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  functionality_storage: 'granted',
  personalization_storage: 'denied',
  security_storage: 'granted',
}
