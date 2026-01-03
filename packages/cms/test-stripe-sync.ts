import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import Stripe from 'stripe'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' as any })

async function main() {
  console.log('Testing Stripe connection...')
  
  // First, test Stripe connection by listing products
  try {
    const stripeProducts = await stripe.products.list({ limit: 5 })
    console.log('Stripe connection successful! Found', stripeProducts.data.length, 'products in Stripe')
    stripeProducts.data.forEach(p => console.log(`  - ${p.name} (${p.id})`))
  } catch (err: any) {
    console.error('Stripe connection failed:', err.message)
    return
  }

  // Get the test product
  const product = await prisma.product.findFirst({
    where: { slug: 'test-product' }
  })
  
  if (!product) {
    console.log('No test product found!')
    return
  }
  
  console.log('\nSyncing product to Stripe:', product.title)
  console.log('  Price:', product.basePrice / 100, 'USD')
  console.log('  SKU:', product.sku)
  
  // Create in Stripe
  try {
    const stripeProduct = await stripe.products.create({
      name: product.title,
      description: product.description || undefined,
      metadata: {
        productId: product.id,
        productType: product.type,
        sku: product.sku || '',
      },
      default_price_data: {
        unit_amount: product.basePrice,
        currency: 'usd',
      },
    })
    
    console.log('\n✓ Product created in Stripe!')
    console.log('  Stripe Product ID:', stripeProduct.id)
    console.log('  Stripe Price ID:', stripeProduct.default_price)
    
    // Update local product with Stripe IDs
    await prisma.product.update({
      where: { id: product.id },
      data: {
        stripeProductId: stripeProduct.id,
        stripePriceId: stripeProduct.default_price as string,
        stripeSyncedAt: new Date(),
        stripeSyncError: null,
      }
    })
    
    console.log('\n✓ Local product updated with Stripe IDs')
    
    // Verify the sync
    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
      select: { stripeProductId: true, stripePriceId: true, stripeSyncedAt: true }
    })
    console.log('\nVerified sync:')
    console.log('  stripeProductId:', updatedProduct?.stripeProductId)
    console.log('  stripePriceId:', updatedProduct?.stripePriceId)
    console.log('  stripeSyncedAt:', updatedProduct?.stripeSyncedAt)
    
  } catch (err: any) {
    console.error('Failed to sync to Stripe:', err.message)
    await prisma.product.update({
      where: { id: product.id },
      data: { stripeSyncError: err.message }
    })
  }
}

main().catch(console.error).finally(() => { pool.end(); prisma.$disconnect() })
