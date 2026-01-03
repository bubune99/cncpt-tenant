'use client';

/**
 * E-commerce Puck Configuration
 *
 * Puck configuration for building e-commerce pages, pricing tables,
 * checkout flows, and sales pages visually.
 */

import type { Config } from '@measured/puck';
import {
  PricingTable,
  ProductCard,
  ProductGrid,
  OrderSummary,
  CheckoutSection,
  FeatureList,
  Testimonial,
  type PricingTableProps,
  type ProductCardProps,
  type ProductGridProps,
  type OrderSummaryProps,
  type CheckoutSectionProps,
  type FeatureListProps,
  type TestimonialProps,
} from './components';

export type EcommerceComponents = {
  PricingTable: PricingTableProps;
  ProductCard: ProductCardProps;
  ProductGrid: ProductGridProps;
  OrderSummary: OrderSummaryProps;
  CheckoutSection: CheckoutSectionProps;
  FeatureList: FeatureListProps;
  Testimonial: TestimonialProps;
};

export const ecommercePuckConfig: Config<EcommerceComponents> = {
  categories: {
    pricing: {
      title: 'Pricing',
      components: ['PricingTable', 'FeatureList'],
    },
    products: {
      title: 'Products',
      components: ['ProductCard', 'ProductGrid'],
    },
    checkout: {
      title: 'Checkout',
      components: ['OrderSummary', 'CheckoutSection'],
    },
    social: {
      title: 'Social Proof',
      components: ['Testimonial'],
    },
  },
  components: {
    // ========== PRICING ==========
    PricingTable: {
      label: 'Pricing Table',
      fields: {
        title: { type: 'text', label: 'Title' },
        subtitle: { type: 'textarea', label: 'Subtitle' },
        plans: {
          type: 'array',
          label: 'Plans',
          arrayFields: {
            name: { type: 'text', label: 'Plan Name' },
            price: { type: 'text', label: 'Price (e.g., $29)' },
            period: { type: 'text', label: 'Period (e.g., month)' },
            description: { type: 'text', label: 'Description' },
            features: { type: 'textarea', label: 'Features (one per line)' },
            buttonText: { type: 'text', label: 'Button Text' },
            buttonUrl: { type: 'text', label: 'Button URL' },
            highlighted: {
              type: 'radio',
              label: 'Highlighted',
              options: [
                { label: 'Yes', value: true },
                { label: 'No', value: false },
              ],
            },
            badge: { type: 'text', label: 'Badge (e.g., Popular)' },
          },
          defaultItemProps: {
            name: 'Plan',
            price: '$29',
            period: 'month',
            description: 'Perfect for getting started',
            features: 'Feature 1\nFeature 2\nFeature 3',
            buttonText: 'Get Started',
            buttonUrl: '#',
            highlighted: false,
          },
        },
        columns: {
          type: 'select',
          label: 'Columns',
          options: [
            { label: '2 Columns', value: 2 },
            { label: '3 Columns', value: 3 },
            { label: '4 Columns', value: 4 },
          ],
        },
        style: {
          type: 'select',
          label: 'Style',
          options: [
            { label: 'Cards', value: 'cards' },
            { label: 'Minimal', value: 'minimal' },
            { label: 'Bordered', value: 'bordered' },
          ],
        },
      },
      defaultProps: {
        title: 'Choose Your Plan',
        subtitle: 'Simple, transparent pricing that grows with you.',
        plans: [
          {
            name: 'Starter',
            price: '$9',
            period: 'month',
            description: 'Perfect for individuals',
            features: '1 User\n5 Projects\nBasic Support',
            buttonText: 'Start Free',
            buttonUrl: '#',
            highlighted: false,
          },
          {
            name: 'Professional',
            price: '$29',
            period: 'month',
            description: 'Best for growing teams',
            features: '5 Users\nUnlimited Projects\nPriority Support\nAdvanced Analytics',
            buttonText: 'Get Started',
            buttonUrl: '#',
            highlighted: true,
            badge: 'Popular',
          },
          {
            name: 'Enterprise',
            price: '$99',
            period: 'month',
            description: 'For large organizations',
            features: 'Unlimited Users\nUnlimited Projects\n24/7 Support\nCustom Integrations\nDedicated Manager',
            buttonText: 'Contact Sales',
            buttonUrl: '#',
            highlighted: false,
          },
        ],
        columns: 3,
        style: 'cards',
      },
      render: PricingTable,
    },

    FeatureList: {
      label: 'Feature List',
      fields: {
        title: { type: 'text', label: 'Title' },
        features: {
          type: 'array',
          label: 'Features',
          arrayFields: {
            title: { type: 'text', label: 'Feature Title' },
            description: { type: 'text', label: 'Description' },
            included: {
              type: 'radio',
              label: 'Included',
              options: [
                { label: 'Yes', value: true },
                { label: 'No', value: false },
              ],
            },
          },
          defaultItemProps: {
            title: 'Feature',
            description: 'Description of this feature',
            included: true,
          },
        },
        columns: {
          type: 'select',
          label: 'Columns',
          options: [
            { label: '1 Column', value: 1 },
            { label: '2 Columns', value: 2 },
            { label: '3 Columns', value: 3 },
          ],
        },
        showIcons: {
          type: 'radio',
          label: 'Show Icons',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        iconColor: { type: 'text', label: 'Icon Color' },
      },
      defaultProps: {
        title: 'Everything you need',
        features: [
          { title: 'Unlimited projects', description: 'Create as many as you need', included: true },
          { title: 'Team collaboration', description: 'Work together seamlessly', included: true },
          { title: 'Advanced analytics', description: 'Track your performance', included: true },
          { title: 'Priority support', description: 'Get help when you need it', included: true },
        ],
        columns: 2,
        showIcons: true,
        iconColor: '#22c55e',
      },
      render: FeatureList,
    },

    // ========== PRODUCTS ==========
    ProductCard: {
      label: 'Product Card',
      fields: {
        name: { type: 'text', label: 'Product Name' },
        description: { type: 'textarea', label: 'Description' },
        price: { type: 'text', label: 'Price' },
        originalPrice: { type: 'text', label: 'Original Price (for discount)' },
        image: { type: 'text', label: 'Image URL' },
        badge: { type: 'text', label: 'Badge (e.g., Sale)' },
        buttonText: { type: 'text', label: 'Button Text' },
        buttonUrl: { type: 'text', label: 'Button URL' },
        rating: { type: 'number', label: 'Rating (1-5)', min: 1, max: 5 },
        reviewCount: { type: 'number', label: 'Review Count' },
        showAddToCart: {
          type: 'radio',
          label: 'Show Add to Cart',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        style: {
          type: 'select',
          label: 'Style',
          options: [
            { label: 'Simple', value: 'simple' },
            { label: 'Detailed', value: 'detailed' },
            { label: 'Minimal', value: 'minimal' },
          ],
        },
      },
      defaultProps: {
        name: 'Product Name',
        description: 'A great product description goes here.',
        price: '$49.99',
        image: 'https://placehold.co/400x400',
        buttonText: 'Add to Cart',
        buttonUrl: '#',
        showAddToCart: true,
        style: 'simple',
      },
      render: ProductCard,
    },

    ProductGrid: {
      label: 'Product Grid',
      fields: {
        title: { type: 'text', label: 'Section Title' },
        products: {
          type: 'array',
          label: 'Products',
          arrayFields: {
            name: { type: 'text', label: 'Product Name' },
            price: { type: 'text', label: 'Price' },
            originalPrice: { type: 'text', label: 'Original Price' },
            image: { type: 'text', label: 'Image URL' },
            badge: { type: 'text', label: 'Badge' },
            buttonUrl: { type: 'text', label: 'Button URL' },
          },
          defaultItemProps: {
            name: 'Product',
            price: '$29.99',
            image: 'https://placehold.co/400x400',
            buttonUrl: '#',
          },
        },
        columns: {
          type: 'select',
          label: 'Columns',
          options: [
            { label: '2 Columns', value: 2 },
            { label: '3 Columns', value: 3 },
            { label: '4 Columns', value: 4 },
          ],
        },
        showAddToCart: {
          type: 'radio',
          label: 'Show Add to Cart',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        buttonText: { type: 'text', label: 'Button Text' },
      },
      defaultProps: {
        title: 'Featured Products',
        products: [
          { name: 'Product 1', price: '$29.99', image: 'https://placehold.co/400x400', buttonUrl: '#' },
          { name: 'Product 2', price: '$39.99', image: 'https://placehold.co/400x400', buttonUrl: '#' },
          { name: 'Product 3', price: '$49.99', image: 'https://placehold.co/400x400', badge: 'Sale', buttonUrl: '#' },
          { name: 'Product 4', price: '$59.99', image: 'https://placehold.co/400x400', buttonUrl: '#' },
        ],
        columns: 4,
        showAddToCart: true,
        buttonText: 'Add to Cart',
      },
      render: ProductGrid,
    },

    // ========== CHECKOUT ==========
    OrderSummary: {
      label: 'Order Summary',
      fields: {
        items: {
          type: 'array',
          label: 'Items',
          arrayFields: {
            name: { type: 'text', label: 'Item Name' },
            quantity: { type: 'number', label: 'Quantity' },
            price: { type: 'text', label: 'Price' },
          },
          defaultItemProps: {
            name: 'Item',
            quantity: 1,
            price: '$29.99',
          },
        },
        subtotal: { type: 'text', label: 'Subtotal' },
        shipping: { type: 'text', label: 'Shipping' },
        tax: { type: 'text', label: 'Tax' },
        discount: { type: 'text', label: 'Discount' },
        total: { type: 'text', label: 'Total' },
        showCheckoutButton: {
          type: 'radio',
          label: 'Show Checkout Button',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        checkoutUrl: { type: 'text', label: 'Checkout URL' },
        checkoutButtonText: { type: 'text', label: 'Button Text' },
        style: {
          type: 'select',
          label: 'Style',
          options: [
            { label: 'Simple', value: 'simple' },
            { label: 'Detailed', value: 'detailed' },
            { label: 'Compact', value: 'compact' },
          ],
        },
      },
      defaultProps: {
        items: [
          { name: 'Product 1', quantity: 2, price: '$59.98' },
          { name: 'Product 2', quantity: 1, price: '$29.99' },
        ],
        subtotal: '$89.97',
        shipping: '$9.99',
        tax: '$7.20',
        total: '$107.16',
        showCheckoutButton: true,
        checkoutUrl: '/checkout',
        checkoutButtonText: 'Proceed to Checkout',
        style: 'simple',
      },
      render: OrderSummary,
    },

    CheckoutSection: {
      label: 'Checkout Section',
      fields: {
        title: { type: 'text', label: 'Title' },
        description: { type: 'textarea', label: 'Description' },
        paymentMethods: {
          type: 'array',
          label: 'Payment Methods',
          arrayFields: {
            method: { type: 'text', label: 'Method' },
          },
        },
        securityBadges: {
          type: 'radio',
          label: 'Show Security Badges',
          options: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
        },
        guaranteeText: { type: 'text', label: 'Guarantee Text' },
        backgroundColor: { type: 'text', label: 'Background Color' },
        accentColor: { type: 'text', label: 'Accent Color' },
      },
      defaultProps: {
        title: 'Secure Checkout',
        description: 'Complete your purchase securely with our encrypted payment system.',
        paymentMethods: ['visa', 'mastercard', 'amex', 'paypal'],
        securityBadges: true,
        guaranteeText: '30-day money-back guarantee',
        backgroundColor: '#f9fafb',
        accentColor: '#4f46e5',
      },
      render: CheckoutSection,
    },

    // ========== SOCIAL PROOF ==========
    Testimonial: {
      label: 'Testimonial',
      fields: {
        quote: { type: 'textarea', label: 'Quote' },
        authorName: { type: 'text', label: 'Author Name' },
        authorTitle: { type: 'text', label: 'Author Title' },
        authorImage: { type: 'text', label: 'Author Image URL' },
        companyLogo: { type: 'text', label: 'Company Logo URL' },
        rating: { type: 'number', label: 'Rating (1-5)', min: 1, max: 5 },
        style: {
          type: 'select',
          label: 'Style',
          options: [
            { label: 'Simple', value: 'simple' },
            { label: 'Card', value: 'card' },
            { label: 'Featured', value: 'featured' },
          ],
        },
      },
      defaultProps: {
        quote: 'This product has completely transformed how we work. The team is more productive than ever.',
        authorName: 'Jane Smith',
        authorTitle: 'CEO at TechCorp',
        rating: 5,
        style: 'card',
      },
      render: Testimonial,
    },
  },
};

export default ecommercePuckConfig;
