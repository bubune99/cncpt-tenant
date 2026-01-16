/**
 * Shipping Primitives
 *
 * Primitives for shipping operations: rates, labels, tracking, and address validation.
 * Uses Shippo integration from src/lib/shippo/
 */

import type { CreatePrimitiveRequest } from '../types';

export const SHIPPING_PRIMITIVES: Array<CreatePrimitiveRequest & { builtIn: true }> = [
  // ============================================================================
  // SHIPPING PRIMITIVES
  // ============================================================================
  {
    name: 'shipping.getRates',
    description: 'Get shipping rates from multiple carriers (USPS, UPS, FedEx) for a shipment. Compares prices and delivery times.',
    category: 'shipping',
    tags: ['shipping', 'rates', 'carriers', 'shippo'],
    icon: 'Truck',
    timeout: 30000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        addressFrom: {
          type: 'object',
          description: 'Ship-from address (optional, uses default if not provided)',
          properties: {
            name: { type: 'string' },
            company: { type: 'string' },
            street1: { type: 'string' },
            street2: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            zip: { type: 'string' },
            country: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
          },
        },
        addressTo: {
          type: 'object',
          description: 'Ship-to address (required)',
          properties: {
            name: { type: 'string' },
            company: { type: 'string' },
            street1: { type: 'string' },
            street2: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            zip: { type: 'string' },
            country: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
          },
          required: ['name', 'street1', 'city', 'state', 'zip', 'country'],
        },
        parcels: {
          type: 'array',
          description: 'Package dimensions and weight',
          items: {
            type: 'object',
            properties: {
              length: { type: 'number', description: 'Length in inches' },
              width: { type: 'number', description: 'Width in inches' },
              height: { type: 'number', description: 'Height in inches' },
              weight: { type: 'number', description: 'Weight in ounces' },
              massUnit: { type: 'string', default: 'oz' },
              distanceUnit: { type: 'string', default: 'in' },
            },
            required: ['length', 'width', 'height', 'weight'],
          },
        },
        signature: {
          type: 'boolean',
          description: 'Require signature confirmation',
        },
        insurance: {
          type: 'object',
          description: 'Insurance options',
          properties: {
            amount: { type: 'string' },
            currency: { type: 'string', default: 'USD' },
            content: { type: 'string' },
          },
        },
      },
      required: ['addressTo', 'parcels'],
    },
    handler: `
      const { createShipment, getDefaultFromAddress } = await import('../../shippo');

      // Use default from address if not provided
      const addressFrom = args.addressFrom || await getDefaultFromAddress();

      const shipment = await createShipment({
        addressFrom,
        addressTo: args.addressTo,
        parcels: args.parcels,
        extra: {
          signature: args.signature,
          insurance: args.insurance,
        },
      });

      return {
        success: true,
        shipmentId: shipment.shipmentId,
        rates: shipment.rates.map(rate => ({
          rateId: rate.rateId,
          carrier: rate.carrier,
          service: rate.servicelevel.name,
          price: parseFloat(rate.amount),
          currency: rate.currency,
          estimatedDays: rate.estimatedDays,
          deliveryTerms: rate.durationTerms,
        })),
        cheapest: shipment.rates[0] ? {
          carrier: shipment.rates[0].carrier,
          service: shipment.rates[0].servicelevel.name,
          price: parseFloat(shipment.rates[0].amount),
        } : null,
      };
    `,
  },
  {
    name: 'shipping.createLabel',
    description: 'Purchase a shipping label for a selected rate. Returns label URL, tracking number, and tracking URL.',
    category: 'shipping',
    tags: ['shipping', 'label', 'purchase', 'shippo'],
    icon: 'Tag',
    timeout: 30000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        rateId: {
          type: 'string',
          description: 'Rate ID from shipping.getRates',
        },
        labelFormat: {
          type: 'string',
          description: 'Label format',
          enum: ['PDF', 'PDF_4x6', 'PNG', 'ZPLII'],
          default: 'PDF',
        },
        orderId: {
          type: 'string',
          description: 'Order ID to associate with this shipment',
        },
      },
      required: ['rateId'],
    },
    handler: `
      const { purchaseLabel } = await import('../../shippo');
      const { prisma } = await import('../../db');

      const label = await purchaseLabel({
        rateId: args.rateId,
        labelFormat: args.labelFormat || 'PDF',
      });

      // Create shipment record if order ID provided
      if (args.orderId && label.status === 'SUCCESS') {
        await prisma.shipment.create({
          data: {
            orderId: args.orderId,
            carrier: label.rate.carrier,
            service: label.rate.servicelevel.name,
            trackingNumber: label.trackingNumber,
            trackingUrl: label.trackingUrl,
            labelUrl: label.labelUrl,
            status: 'LABEL_CREATED',
          },
        });
      }

      return {
        success: label.status === 'SUCCESS',
        transactionId: label.transactionId,
        trackingNumber: label.trackingNumber,
        trackingUrl: label.trackingUrl,
        labelUrl: label.labelUrl,
        carrier: label.rate.carrier,
        service: label.rate.servicelevel.name,
        eta: label.eta,
        messages: label.messages,
      };
    `,
  },
  {
    name: 'shipping.getTracking',
    description: 'Get tracking status and history for a shipment by tracking number.',
    category: 'shipping',
    tags: ['shipping', 'tracking', 'status', 'shippo'],
    icon: 'MapPin',
    timeout: 15000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        carrier: {
          type: 'string',
          description: 'Carrier name',
          enum: ['usps', 'ups', 'fedex', 'dhl_express'],
        },
        trackingNumber: {
          type: 'string',
          description: 'Tracking number',
        },
      },
      required: ['carrier', 'trackingNumber'],
    },
    handler: `
      const { getTracking } = await import('../../shippo');

      const tracking = await getTracking(args.carrier, args.trackingNumber);

      return {
        success: true,
        carrier: tracking.carrier,
        trackingNumber: tracking.trackingNumber,
        eta: tracking.eta,
        currentStatus: {
          status: tracking.trackingStatus.status,
          details: tracking.trackingStatus.statusDetails,
          date: tracking.trackingStatus.statusDate,
          location: tracking.trackingStatus.location,
        },
        isDelivered: tracking.trackingStatus.status === 'DELIVERED',
        history: tracking.trackingHistory.map(event => ({
          status: event.status,
          details: event.statusDetails,
          date: event.statusDate,
          location: event.location,
        })),
      };
    `,
  },
  {
    name: 'shipping.validateAddress',
    description: 'Validate and standardize a shipping address. Returns corrected address and validation messages.',
    category: 'shipping',
    tags: ['shipping', 'address', 'validation', 'shippo'],
    icon: 'CheckCircle',
    timeout: 15000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Recipient name',
        },
        company: {
          type: 'string',
          description: 'Company name (optional)',
        },
        street1: {
          type: 'string',
          description: 'Street address line 1',
        },
        street2: {
          type: 'string',
          description: 'Street address line 2 (optional)',
        },
        city: {
          type: 'string',
          description: 'City',
        },
        state: {
          type: 'string',
          description: 'State/Province code',
        },
        zip: {
          type: 'string',
          description: 'Postal/ZIP code',
        },
        country: {
          type: 'string',
          description: 'Country code (e.g., US, CA)',
          default: 'US',
        },
        phone: {
          type: 'string',
          description: 'Phone number',
        },
        email: {
          type: 'string',
          description: 'Email address',
        },
      },
      required: ['name', 'street1', 'city', 'state', 'zip'],
    },
    handler: `
      const { validateAddress } = await import('../../shippo');

      const result = await validateAddress({
        name: args.name,
        company: args.company,
        street1: args.street1,
        street2: args.street2,
        city: args.city,
        state: args.state,
        zip: args.zip,
        country: args.country || 'US',
        phone: args.phone,
        email: args.email,
      });

      return {
        success: true,
        isValid: result.isValid,
        address: {
          name: result.name,
          company: result.company,
          street1: result.street1,
          street2: result.street2,
          city: result.city,
          state: result.state,
          zip: result.zip,
          country: result.country,
        },
        messages: result.messages,
        hasWarnings: result.messages?.some(m => m.type === 'warning') || false,
        hasErrors: result.messages?.some(m => m.type === 'error') || false,
      };
    `,
  },
  {
    name: 'shipping.refundLabel',
    description: 'Request a refund for a purchased shipping label.',
    category: 'shipping',
    tags: ['shipping', 'refund', 'label', 'shippo'],
    icon: 'RotateCcw',
    timeout: 15000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        transactionId: {
          type: 'string',
          description: 'Transaction ID from label purchase',
        },
        shipmentId: {
          type: 'string',
          description: 'Optional: Database shipment ID to update',
        },
      },
      required: ['transactionId'],
    },
    handler: `
      const { refundLabel } = await import('../../shippo');
      const { prisma } = await import('../../db');

      const refund = await refundLabel(args.transactionId);

      // Update shipment record if ID provided
      if (args.shipmentId && refund.status !== 'ERROR') {
        await prisma.shipment.update({
          where: { id: args.shipmentId },
          data: { status: 'REFUND_PENDING' },
        });
      }

      return {
        success: refund.status !== 'ERROR',
        transactionId: refund.transactionId,
        status: refund.status,
      };
    `,
  },
];
