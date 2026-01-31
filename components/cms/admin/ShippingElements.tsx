'use client';

/**
 * Shippo Shipping Elements Widget
 *
 * Embeds the Shippo Shipping Elements widget for label purchasing.
 * This is a hosted solution that handles:
 * - Rate shopping across carriers
 * - Label purchase
 * - Address validation
 * - Package details
 * - Tracking
 *
 * @see https://docs.goshippo.com/docs/shippingelements/
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, AlertCircle, Package } from 'lucide-react';

// Declare the global shippo object from the SDK
// @see https://docs.goshippo.com/docs/shippingelements/install/
declare global {
  interface Window {
    shippo?: {
      init: (config: ShippoInitConfig) => void;
      labelPurchase: (element: string, orderDetails: ShippoOrderDetails | ShippoOrderDetails[]) => void;
    };
  }
}

interface ShippoInitConfig {
  token: string;
  org: string; // SDK uses 'org', not 'organization'
  locale?: string;
  theme?: Record<string, unknown>;
}

// SDK address format
interface ShippoAddress {
  name: string;
  company?: string;
  street_no?: string;
  street1: string;
  street2?: string;
  street3?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

// SDK line item format
interface ShippoLineItem {
  id?: number;
  title: string;
  sku?: string;
  quantity: number;
  currency: string;
  unit_amount: string;
  unit_weight: string;
  weight_unit: 'oz' | 'lb' | 'g' | 'kg';
  country_of_origin?: string;
}

// SDK order details format
interface ShippoOrderDetails {
  address_to: ShippoAddress;
  address_from?: ShippoAddress;
  address_return?: ShippoAddress;
  line_items: ShippoLineItem[];
  object_id?: string;
  order_number?: string;
  order_status?: string;
  placed_at?: string;
  notes?: string;
  shipment_date?: Date;
  extras?: {
    insurance?: { amount: string; currency: string };
    signature_confirmation?: string;
  };
}

interface ShippoLabel {
  transactionId: string;
  trackingNumber: string;
  trackingUrl: string;
  labelUrl: string;
  rate: {
    carrier: string;
    service: string;
    amount: string;
    currency: string;
  };
}

export interface ShippingElementsProps {
  /** Order details for prefilling the widget */
  orderDetails?: ShippoOrderDetails;
  /** Callback when label is created (not directly supported by SDK, but we can poll) */
  onLabelCreated?: (label: ShippoLabel) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Custom theme */
  theme?: Record<string, unknown>;
  /** Locale (default: en-US) */
  locale?: string;
  /** Custom class name */
  className?: string;
}

export function ShippingElements({
  orderDetails,
  onLabelCreated,
  onError,
  theme,
  locale = 'en-US',
  className = '',
}: ShippingElementsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const initAttempted = useRef(false);

  // Load the Shippo SDK script
  const loadShippoScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.shippo) {
        resolve();
        return;
      }

      // Check if script is already in DOM
      const existingScript = document.querySelector(
        'script[src="https://js.goshippo.com/embeddable-client.js"]'
      );
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Shippo SDK')));
        return;
      }

      // Load script
      const script = document.createElement('script');
      script.src = 'https://js.goshippo.com/embeddable-client.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Shippo SDK'));
      document.body.appendChild(script);
    });
  }, []);

  // Fetch JWT token and initialize
  const initializeWidget = useCallback(async () => {
    if (initAttempted.current) return;
    initAttempted.current = true;

    try {
      setLoading(true);
      setError(null);

      // Load SDK
      await loadShippoScript();

      // Get JWT token
      const authResponse = await fetch('/api/shipping/elements/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        throw new Error(errorData.error || 'Failed to authenticate');
      }

      const { token, organizationId } = await authResponse.json();

      if (!window.shippo) {
        throw new Error('Shippo SDK not loaded');
      }

      // Initialize SDK with correct parameter names
      window.shippo.init({
        token,
        org: organizationId, // SDK uses 'org', not 'organization'
        locale,
        theme: theme || { width: '100%' },
      });

      setInitialized(true);
      setLoading(false);
      // labelPurchase will be called in a separate useEffect after the container is mounted
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize shipping widget';
      setError(message);
      setLoading(false);
      onError?.(err instanceof Error ? err : new Error(message));
    }
  }, [loadShippoScript, orderDetails, locale, theme, onError]);

  useEffect(() => {
    initializeWidget();
  }, [initializeWidget]);

  // Render the label purchase widget after initialization and container mount
  useEffect(() => {
    if (!initialized || !window.shippo || loading || error) {
      return;
    }

    // Wait for next tick to ensure container is in DOM
    const timer = setTimeout(() => {
      if (!containerRef.current) {
        console.error('[ShippingElements] Container not found');
        return;
      }

      const defaultOrderDetails: ShippoOrderDetails = orderDetails || {
        address_to: {
          name: '',
          street1: '',
          city: '',
          state: '',
          zip: '',
          country: 'US',
        },
        line_items: [{
          title: 'New Shipment',
          quantity: 1,
          currency: 'USD',
          unit_amount: '0.00',
          unit_weight: '1',
          weight_unit: 'lb',
        }],
      };

      try {
        console.log('[ShippingElements] Calling labelPurchase with container:', containerRef.current);
        window.shippo?.labelPurchase('#shippo-elements-container', defaultOrderDetails);
      } catch (labelError) {
        console.error('[ShippingElements] labelPurchase error:', labelError);
        const errorMessage = labelError instanceof Error ? labelError.message : 'Failed to load label purchase widget';
        setError(errorMessage);
        onError?.(labelError instanceof Error ? labelError : new Error(errorMessage));
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [initialized, loading, error, orderDetails, onError]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading shipping widget...</span>
      </div>
    );
  }

  if (error) {
    const isAuthError = error.includes('API key') || error.includes('authenticate') || error.includes('401') || error.includes('403');
    const isElementsNotAvailable = error.includes('permission') || error.includes('Elements');

    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Shipping Widget Error</h3>
        <p className="text-muted-foreground mb-4 max-w-md">{error}</p>

        {isAuthError && (
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            Please verify your Shippo API key is correct. Test keys start with &quot;shippo_test_&quot;
            and live keys start with &quot;shippo_live_&quot;.
          </p>
        )}

        {isElementsNotAvailable && (
          <div className="text-sm text-muted-foreground mb-4 max-w-md p-4 bg-muted rounded-lg">
            <p className="font-medium mb-2">Shippo Shipping Elements requires:</p>
            <ul className="list-disc list-inside text-left space-y-1">
              <li>A Shippo account with Elements enabled</li>
              <li>Contact Shippo to enable this feature</li>
              <li>Or disable &quot;Use Shippo Elements&quot; in Settings to use the API directly</li>
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => {
              initAttempted.current = false;
              initializeWidget();
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
          <a
            href="https://docs.goshippo.com/docs/shippingelements/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border rounded-md hover:bg-accent"
          >
            View Docs
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {!initialized && (
        <div className="flex items-center justify-center p-8">
          <Package className="h-8 w-8 text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Preparing shipping options...</span>
        </div>
      )}
      <div
        id="shippo-elements-container"
        ref={containerRef}
        className="min-h-[600px]"
      />
    </div>
  );
}

export default ShippingElements;
