'use client';

/**
 * Puck E-commerce Components
 *
 * Visual builder components for payment, pricing, and checkout UIs.
 * These components integrate with Stripe Elements for client dashboards.
 */

import React from 'react';

// ============================================================================
// PRICING TABLE
// ============================================================================

export interface PricingPlanItem {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string;
  buttonText: string;
  buttonUrl: string;
  highlighted: boolean;
  badge?: string;
}

export interface PricingTableProps {
  title?: string;
  subtitle?: string;
  plans: PricingPlanItem[];
  columns?: 2 | 3 | 4;
  style?: 'cards' | 'minimal' | 'bordered';
}

export function PricingTable({
  title = 'Pricing Plans',
  subtitle,
  plans = [],
  columns = 3,
  style = 'cards',
}: PricingTableProps): React.ReactElement {
  const parsedPlans = typeof plans === 'string' ? [] : plans;

  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  };

  const cardStyles = {
    cards: 'bg-white rounded-xl shadow-lg',
    minimal: 'bg-transparent border-0',
    bordered: 'bg-white border-2 border-gray-200 rounded-lg',
  };

  return (
    <section className="py-12 px-4">
      {(title || subtitle) && (
        <div className="text-center mb-10">
          {title && <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>}
          {subtitle && <p className="text-lg text-gray-600">{subtitle}</p>}
        </div>
      )}

      <div className={`grid grid-cols-1 ${gridCols[columns]} gap-6 max-w-6xl mx-auto`}>
        {parsedPlans.map((plan, index) => {
          const features = plan.features?.split('\n').filter(Boolean) || [];

          return (
            <div
              key={index}
              className={`relative p-6 ${cardStyles[style]} ${
                plan.highlighted ? 'ring-2 ring-indigo-500 scale-105' : ''
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && (
                    <span className="ml-1 text-gray-500">/{plan.period}</span>
                  )}
                </div>
                {plan.description && (
                  <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
                )}
              </div>

              {features.length > 0 && (
                <ul className="space-y-3 mb-6">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              <a
                href={plan.buttonUrl || '#'}
                className={`block w-full py-3 px-4 text-center font-medium rounded-lg transition-colors ${
                  plan.highlighted
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.buttonText || 'Get Started'}
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================================
// PRODUCT CARD
// ============================================================================

export interface ProductCardProps {
  name: string;
  description?: string;
  price: string;
  originalPrice?: string;
  image?: string;
  badge?: string;
  buttonText?: string;
  buttonUrl?: string;
  rating?: number;
  reviewCount?: number;
  showAddToCart?: boolean;
  style?: 'simple' | 'detailed' | 'minimal';
}

export function ProductCard({
  name,
  description,
  price,
  originalPrice,
  image,
  badge,
  buttonText = 'Add to Cart',
  buttonUrl = '#',
  rating,
  reviewCount,
  showAddToCart = true,
  style = 'simple',
}: ProductCardProps): React.ReactElement {
  const hasDiscount = originalPrice && originalPrice !== price;

  return (
    <div className={`group relative ${style === 'minimal' ? '' : 'bg-white rounded-lg shadow-md overflow-hidden'}`}>
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {badge && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
            {badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className={`p-4 ${style === 'minimal' ? 'px-0' : ''}`}>
        <h3 className="font-semibold text-gray-900 mb-1 truncate">{name}</h3>

        {description && style === 'detailed' && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{description}</p>
        )}

        {/* Rating */}
        {rating !== undefined && style === 'detailed' && (
          <div className="flex items-center mb-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            {reviewCount !== undefined && (
              <span className="ml-1 text-xs text-gray-500">({reviewCount})</span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-gray-900">{price}</span>
          {hasDiscount && (
            <span className="text-sm text-gray-500 line-through">{originalPrice}</span>
          )}
        </div>

        {/* Button */}
        {showAddToCart && (
          <a
            href={buttonUrl}
            className="block w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-center font-medium rounded-lg transition-colors"
          >
            {buttonText}
          </a>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PRODUCT GRID
// ============================================================================

export interface ProductGridItem {
  name: string;
  price: string;
  originalPrice?: string;
  image?: string;
  badge?: string;
  buttonUrl?: string;
}

export interface ProductGridProps {
  title?: string;
  products: ProductGridItem[];
  columns?: 2 | 3 | 4;
  showAddToCart?: boolean;
  buttonText?: string;
}

export function ProductGrid({
  title,
  products = [],
  columns = 4,
  showAddToCart = true,
  buttonText = 'Add to Cart',
}: ProductGridProps): React.ReactElement {
  const parsedProducts = typeof products === 'string' ? [] : products;

  const gridCols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <section className="py-8 px-4">
      {title && (
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      )}

      <div className={`grid grid-cols-1 ${gridCols[columns]} gap-6`}>
        {parsedProducts.map((product, index) => (
          <ProductCard
            key={index}
            name={product.name}
            price={product.price}
            originalPrice={product.originalPrice}
            image={product.image}
            badge={product.badge}
            buttonUrl={product.buttonUrl}
            buttonText={buttonText}
            showAddToCart={showAddToCart}
            style="simple"
          />
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// ORDER SUMMARY
// ============================================================================

export interface OrderSummaryItem {
  name: string;
  quantity: number;
  price: string;
}

export interface OrderSummaryProps {
  items: OrderSummaryItem[];
  subtotal: string;
  shipping?: string;
  tax?: string;
  discount?: string;
  total: string;
  showCheckoutButton?: boolean;
  checkoutUrl?: string;
  checkoutButtonText?: string;
  style?: 'simple' | 'detailed' | 'compact';
}

export function OrderSummary({
  items = [],
  subtotal,
  shipping,
  tax,
  discount,
  total,
  showCheckoutButton = true,
  checkoutUrl = '/checkout',
  checkoutButtonText = 'Proceed to Checkout',
  style = 'simple',
}: OrderSummaryProps): React.ReactElement {
  const parsedItems = typeof items === 'string' ? [] : items;

  return (
    <div className={`bg-gray-50 rounded-lg p-6 ${style === 'compact' ? 'text-sm' : ''}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

      {/* Items */}
      {style !== 'compact' && parsedItems.length > 0 && (
        <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
          {parsedItems.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {item.name} x {item.quantity}
              </span>
              <span className="font-medium text-gray-900">{item.price}</span>
            </div>
          ))}
        </div>
      )}

      {/* Totals */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">{subtotal}</span>
        </div>

        {shipping && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="text-gray-900">{shipping}</span>
          </div>
        )}

        {tax && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span className="text-gray-900">{tax}</span>
          </div>
        )}

        {discount && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-{discount}</span>
          </div>
        )}

        <div className="flex justify-between pt-2 border-t border-gray-200">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-bold text-lg text-gray-900">{total}</span>
        </div>
      </div>

      {/* Checkout Button */}
      {showCheckoutButton && (
        <a
          href={checkoutUrl}
          className="mt-6 block w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-center font-medium rounded-lg transition-colors"
        >
          {checkoutButtonText}
        </a>
      )}
    </div>
  );
}

// ============================================================================
// CHECKOUT SECTION
// ============================================================================

export interface CheckoutSectionProps {
  title?: string;
  description?: string;
  paymentMethods?: string[];
  securityBadges?: boolean;
  guaranteeText?: string;
  backgroundColor?: string;
  accentColor?: string;
}

export function CheckoutSection({
  title = 'Secure Checkout',
  description = 'Complete your purchase securely',
  paymentMethods = ['visa', 'mastercard', 'amex', 'paypal'],
  securityBadges = true,
  guaranteeText = '30-day money-back guarantee',
  backgroundColor = '#f9fafb',
  accentColor = '#4f46e5',
}: CheckoutSectionProps): React.ReactElement {
  const paymentIcons: Record<string, string> = {
    visa: 'https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/us.svg',
    mastercard: 'https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/eu.svg',
    amex: 'https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/us.svg',
    paypal: 'https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/us.svg',
  };

  return (
    <section
      className="py-12 px-4"
      style={{ backgroundColor }}
    >
      <div className="max-w-xl mx-auto text-center">
        {/* Lock Icon */}
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: accentColor }}
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{description}</p>

        {/* Payment Methods */}
        {paymentMethods.length > 0 && (
          <div className="flex justify-center gap-4 mb-6">
            {paymentMethods.map((method) => (
              <div
                key={method}
                className="w-12 h-8 bg-white rounded shadow flex items-center justify-center text-xs font-semibold text-gray-500 uppercase"
              >
                {method}
              </div>
            ))}
          </div>
        )}

        {/* Security Badge */}
        {securityBadges && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>256-bit SSL Encryption</span>
          </div>
        )}

        {/* Guarantee */}
        {guaranteeText && (
          <p className="text-sm text-gray-500">{guaranteeText}</p>
        )}

        {/* Placeholder for Stripe Elements */}
        <div className="mt-8 p-6 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-sm text-gray-400">
            Payment form will be rendered here via Stripe Elements
          </p>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FEATURE LIST (for pricing pages)
// ============================================================================

export interface FeatureItem {
  title: string;
  description?: string;
  included: boolean;
}

export interface FeatureListProps {
  title?: string;
  features: FeatureItem[];
  columns?: 1 | 2 | 3;
  showIcons?: boolean;
  iconColor?: string;
}

export function FeatureList({
  title,
  features = [],
  columns = 2,
  showIcons = true,
  iconColor = '#22c55e',
}: FeatureListProps): React.ReactElement {
  const parsedFeatures = typeof features === 'string' ? [] : features;

  const gridCols = {
    1: '',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
  };

  return (
    <section className="py-8 px-4">
      {title && (
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{title}</h2>
      )}

      <div className={`grid grid-cols-1 ${gridCols[columns]} gap-4 max-w-4xl mx-auto`}>
        {parsedFeatures.map((feature, index) => (
          <div key={index} className="flex items-start p-4 bg-white rounded-lg">
            {showIcons && (
              <div
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: feature.included ? iconColor : '#e5e7eb' }}
              >
                {feature.included ? (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            )}
            <div>
              <h3 className={`font-medium ${feature.included ? 'text-gray-900' : 'text-gray-400'}`}>
                {feature.title}
              </h3>
              {feature.description && (
                <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// TESTIMONIAL (for sales pages)
// ============================================================================

export interface TestimonialProps {
  quote: string;
  authorName: string;
  authorTitle?: string;
  authorImage?: string;
  companyLogo?: string;
  rating?: number;
  style?: 'simple' | 'card' | 'featured';
}

export function Testimonial({
  quote,
  authorName,
  authorTitle,
  authorImage,
  companyLogo,
  rating,
  style = 'card',
}: TestimonialProps): React.ReactElement {
  return (
    <div className={`${style === 'featured' ? 'bg-indigo-50 p-8 rounded-2xl' : style === 'card' ? 'bg-white p-6 rounded-lg shadow-md' : 'p-4'}`}>
      {/* Rating */}
      {rating !== undefined && (
        <div className="flex mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      )}

      {/* Quote */}
      <blockquote className={`text-gray-700 mb-4 ${style === 'featured' ? 'text-lg' : ''}`}>
        &ldquo;{quote}&rdquo;
      </blockquote>

      {/* Author */}
      <div className="flex items-center">
        {authorImage && (
          <img
            src={authorImage}
            alt={authorName}
            className="w-10 h-10 rounded-full object-cover mr-3"
          />
        )}
        <div>
          <div className="font-semibold text-gray-900">{authorName}</div>
          {authorTitle && <div className="text-sm text-gray-500">{authorTitle}</div>}
        </div>
        {companyLogo && (
          <img
            src={companyLogo}
            alt="Company"
            className="h-8 ml-auto"
          />
        )}
      </div>
    </div>
  );
}

export default {
  PricingTable,
  ProductCard,
  ProductGrid,
  OrderSummary,
  CheckoutSection,
  FeatureList,
  Testimonial,
};
