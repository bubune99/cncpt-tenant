/**
 * Shippo Shipping Elements JWT Authentication
 *
 * Generates a JWT token for the Shippo Shipping Elements widget.
 * This token allows the embedded widget to make API calls on behalf of the merchant.
 *
 * Shippo Elements requires the embedded:carriers scope for the label purchase widget.
 * @see https://docs.goshippo.com/docs/shippingelements/
 */

import { NextResponse } from 'next/server';
import { getShippingSettings } from '@/lib/shippo';

export async function POST() {
  try {
    const settings = await getShippingSettings();

    // Debug logging in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Shippo Auth] Settings check:', {
        enabled: settings.enabled,
        hasApiKey: !!settings.shippoApiKey,
        apiKeyPrefix: settings.shippoApiKey?.substring(0, 12) + '...',
        useElements: settings.useElements,
      });
    }

    if (!settings.enabled) {
      return NextResponse.json(
        { error: 'Shipping is not enabled. Configure SHIPPO_API_KEY or enable in Settings.' },
        { status: 400 }
      );
    }

    const apiKey = settings.shippoApiKey;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Shippo API key is not configured. Set SHIPPO_API_KEY env var or configure in Settings.' },
        { status: 400 }
      );
    }

    // Request JWT token from Shippo's authz endpoint
    // This endpoint creates a short-lived token for the embedded widget
    const response = await fetch('https://api.goshippo.com/embedded/authz/', {
      method: 'POST',
      headers: {
        'Authorization': `ShippoToken ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scope: 'embedded:carriers',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Shippo Auth] Authz error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      // Parse error if JSON
      let errorMessage = 'Failed to authenticate with Shippo';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.message || errorJson.error || errorMessage;
      } catch {
        // Use raw text if not JSON
        if (errorText) errorMessage = errorText;
      }

      // Handle specific error cases
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid Shippo API key. Please check your SHIPPO_API_KEY.' },
          { status: 401 }
        );
      }

      if (response.status === 403) {
        return NextResponse.json(
          { error: 'Shippo API key does not have permission for Shipping Elements. Contact Shippo support.' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const authData = await response.json();

    // Decode JWT to extract user/org info if needed
    // The JWT contains user_id and user_object_id
    let organizationId = authData.organization_id;
    if (!organizationId && authData.token) {
      try {
        const payload = JSON.parse(Buffer.from(authData.token.split('.')[1], 'base64').toString());
        organizationId = payload.user_object_id || payload.user_id?.toString() || '';
      } catch {
        organizationId = '';
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Shippo Auth] Success:', {
        hasToken: !!authData.token,
        organizationId,
        expiresAt: authData.expires_at || authData.expiresIn,
      });
    }

    return NextResponse.json({
      token: authData.token,
      expiresAt: authData.expires_at || authData.expiresIn,
      organizationId,
    });
  } catch (error) {
    console.error('[Shippo Auth] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authentication failed' },
      { status: 500 }
    );
  }
}
