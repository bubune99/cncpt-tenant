# Stripe Credit Pack Setup Guide

Since the Stripe MCP is read-only and the Stripe CLI isn't installed, you'll need to create the credit pack products manually in the Stripe Dashboard.

## Credit Packs to Create

Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products) and create the following products:

### 1. Starter Pack ($5.00)
- **Product Name**: Starter Pack - 500 AI Credits
- **Description**: Get started with AI features (500 credits)
- **Price**: $5.00 USD (one-time payment)
- **Metadata**:
  - `pack_name`: `starter`
  - `credits`: `500`
  - `bonus_credits`: `0`

### 2. Growth Pack ($15.00) - POPULAR
- **Product Name**: Growth Pack - 2,200 AI Credits
- **Description**: Most popular choice (2,000 + 200 bonus credits)
- **Price**: $15.00 USD (one-time payment)
- **Metadata**:
  - `pack_name`: `popular`
  - `credits`: `2000`
  - `bonus_credits`: `200`

### 3. Pro Pack ($35.00) - BEST VALUE
- **Product Name**: Pro Pack - 5,750 AI Credits
- **Description**: For power users (5,000 + 750 bonus credits)
- **Price**: $35.00 USD (one-time payment)
- **Metadata**:
  - `pack_name`: `pro`
  - `credits`: `5000`
  - `bonus_credits`: `750`

### 4. Enterprise Pack ($99.00)
- **Product Name**: Enterprise Pack - 18,000 AI Credits
- **Description**: Maximum credits (15,000 + 3,000 bonus credits)
- **Price**: $99.00 USD (one-time payment)
- **Metadata**:
  - `pack_name`: `enterprise`
  - `credits`: `15000`
  - `bonus_credits`: `3000`

## After Creating Products

1. Copy the Price IDs for each product (they look like `price_xxxx...`)
2. Run the SQL script to update the database:

```sql
-- Update credit packs with Stripe IDs
-- Replace the placeholder IDs with your actual Stripe price IDs

UPDATE ai_credit_packs SET
  stripe_product_id = 'YOUR_STARTER_PRODUCT_ID',
  stripe_price_id = 'YOUR_STARTER_PRICE_ID'
WHERE name = 'starter';

UPDATE ai_credit_packs SET
  stripe_product_id = 'YOUR_POPULAR_PRODUCT_ID',
  stripe_price_id = 'YOUR_POPULAR_PRICE_ID'
WHERE name = 'popular';

UPDATE ai_credit_packs SET
  stripe_product_id = 'YOUR_PRO_PRODUCT_ID',
  stripe_price_id = 'YOUR_PRO_PRICE_ID'
WHERE name = 'pro';

UPDATE ai_credit_packs SET
  stripe_product_id = 'YOUR_ENTERPRISE_PRODUCT_ID',
  stripe_price_id = 'YOUR_ENTERPRISE_PRICE_ID'
WHERE name = 'enterprise';
```

## Alternative: Using price_data (No Stripe Setup Required)

The current implementation in `/api/dashboard/credits/purchase/route.ts` already supports creating checkout sessions without pre-configured Stripe prices using `price_data`. This means the credit pack purchases will work even without setting up Stripe products in advance - they'll be created dynamically at checkout time.

However, pre-creating the products in Stripe is recommended for:
- Better analytics and reporting in Stripe Dashboard
- Consistent product IDs across checkouts
- Easier management and price updates

## Webhook Configuration

Make sure your webhook endpoint is configured to handle credit pack purchases:

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-domain.com/api/dashboard/subscription/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
   - `invoice.paid`
   - `customer.created`

4. Copy the webhook secret and add to your environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```
