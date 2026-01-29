import { Config } from '@measured/puck';
import * as react_jsx_runtime from 'react/jsx-runtime';
import React__default from 'react';
export { Body, Column, Container, Head, Html, Preview, Button as REButton, Heading as REHeading, Hr as REHr, Img as REImg, Link as RELink, Text as REText, Row, Section } from '@react-email/components';

interface OrderSummaryCardProps {
    orderNumber: string;
    date: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    total: string;
    itemCount: number;
    trackingNumber?: string;
    showViewButton: boolean;
    viewOrderUrl: string;
}
declare function OrderSummaryCard({ orderNumber, date, status, total, itemCount, trackingNumber, showViewButton, viewOrderUrl, }: OrderSummaryCardProps): react_jsx_runtime.JSX.Element;
interface OrderHistoryListProps {
    title: string;
    emptyMessage: string;
    showFilters: boolean;
    maxItems: number;
    viewAllUrl: string;
}
declare function OrderHistoryList({ title, emptyMessage, showFilters, maxItems, viewAllUrl, }: OrderHistoryListProps): react_jsx_runtime.JSX.Element;
interface ShippingTrackerProps {
    title: string;
    carrier: string;
    trackingNumber: string;
    estimatedDelivery: string;
    currentStatus: 'label_created' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered';
    showHistory: boolean;
}
declare function ShippingTracker({ title, carrier, trackingNumber, estimatedDelivery, currentStatus, showHistory, }: ShippingTrackerProps): react_jsx_runtime.JSX.Element;
interface AccountOverviewProps {
    title: string;
    showAvatar: boolean;
    showEmail: boolean;
    showMemberSince: boolean;
    showEditButton: boolean;
    editProfileUrl: string;
}
declare function AccountOverview({ title, showAvatar, showEmail, showMemberSince, showEditButton, editProfileUrl, }: AccountOverviewProps): react_jsx_runtime.JSX.Element;
interface AddressCardProps {
    type: 'shipping' | 'billing';
    isDefault: boolean;
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
    showEditButton: boolean;
    showDeleteButton: boolean;
}
declare function AddressCard({ type, isDefault, name, street, city, state, zip, country, phone, showEditButton, showDeleteButton, }: AddressCardProps): react_jsx_runtime.JSX.Element;
interface WishlistItemProps {
    productName: string;
    productImage: string;
    price: string;
    originalPrice?: string;
    inStock: boolean;
    showAddToCart: boolean;
    showRemove: boolean;
}
declare function WishlistItem({ productName, productImage, price, originalPrice, inStock, showAddToCart, showRemove, }: WishlistItemProps): react_jsx_runtime.JSX.Element;
interface LoyaltyPointsWidgetProps {
    title: string;
    points: number;
    tier: string;
    pointsToNextTier: number;
    showRedeemButton: boolean;
    redeemUrl: string;
}
declare function LoyaltyPointsWidget({ title, points, tier, pointsToNextTier, showRedeemButton, redeemUrl, }: LoyaltyPointsWidgetProps): react_jsx_runtime.JSX.Element;
interface SupportWidgetProps {
    title: string;
    description: string;
    showEmail: boolean;
    showPhone: boolean;
    showChat: boolean;
    showFaq: boolean;
    email: string;
    phone: string;
    faqUrl: string;
}
declare function SupportWidget({ title, description, showEmail, showPhone, showChat, showFaq, email, phone, faqUrl, }: SupportWidgetProps): react_jsx_runtime.JSX.Element;
interface QuickActionsGridProps {
    title: string;
    actions: Array<{
        label: string;
        icon: string;
        url: string;
        color?: string;
    }>;
}
declare function QuickActionsGrid({ title, actions, }: QuickActionsGridProps): react_jsx_runtime.JSX.Element;
interface PaymentMethodsListProps {
    title: string;
    showAddButton: boolean;
    addPaymentUrl: string;
}
declare function PaymentMethodsList({ title, showAddButton, addPaymentUrl, }: PaymentMethodsListProps): react_jsx_runtime.JSX.Element;

/**
 * Dashboard Puck Configuration
 *
 * Puck configuration for building client-facing dashboard pages.
 * Provides components for orders, accounts, shipping, wishlist, and support.
 */

type DashboardComponents = {
    OrderSummaryCard: OrderSummaryCardProps;
    OrderHistoryList: OrderHistoryListProps;
    ShippingTracker: ShippingTrackerProps;
    AccountOverview: AccountOverviewProps;
    AddressCard: AddressCardProps;
    WishlistItem: WishlistItemProps;
    LoyaltyPointsWidget: LoyaltyPointsWidgetProps;
    SupportWidget: SupportWidgetProps;
    QuickActionsGrid: QuickActionsGridProps;
    PaymentMethodsList: PaymentMethodsListProps;
};
declare const dashboardPuckConfig: Config<DashboardComponents>;

/**
 * Puck E-commerce Components
 *
 * Visual builder components for payment, pricing, and checkout UIs.
 * These components integrate with Stripe Elements for client dashboards.
 */

interface PricingPlanItem {
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
interface PricingTableProps {
    title?: string;
    subtitle?: string;
    plans: PricingPlanItem[];
    columns?: 2 | 3 | 4;
    style?: 'cards' | 'minimal' | 'bordered';
}
declare function PricingTable({ title, subtitle, plans, columns, style, }: PricingTableProps): React__default.ReactElement;
interface ProductCardProps {
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
declare function ProductCard({ name, description, price, originalPrice, image, badge, buttonText, buttonUrl, rating, reviewCount, showAddToCart, style, }: ProductCardProps): React__default.ReactElement;
interface ProductGridItem {
    name: string;
    price: string;
    originalPrice?: string;
    image?: string;
    badge?: string;
    buttonUrl?: string;
}
interface ProductGridProps {
    title?: string;
    products: ProductGridItem[];
    columns?: 2 | 3 | 4;
    showAddToCart?: boolean;
    buttonText?: string;
}
declare function ProductGrid({ title, products, columns, showAddToCart, buttonText, }: ProductGridProps): React__default.ReactElement;
interface OrderSummaryItem {
    name: string;
    quantity: number;
    price: string;
}
interface OrderSummaryProps {
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
declare function OrderSummary({ items, subtotal, shipping, tax, discount, total, showCheckoutButton, checkoutUrl, checkoutButtonText, style, }: OrderSummaryProps): React__default.ReactElement;
interface CheckoutSectionProps {
    title?: string;
    description?: string;
    paymentMethods?: string[];
    securityBadges?: boolean;
    guaranteeText?: string;
    backgroundColor?: string;
    accentColor?: string;
}
declare function CheckoutSection({ title, description, paymentMethods, securityBadges, guaranteeText, backgroundColor, accentColor, }: CheckoutSectionProps): React__default.ReactElement;
interface FeatureItem {
    title: string;
    description?: string;
    included: boolean;
}
interface FeatureListProps {
    title?: string;
    features: FeatureItem[];
    columns?: 1 | 2 | 3;
    showIcons?: boolean;
    iconColor?: string;
}
declare function FeatureList({ title, features, columns, showIcons, iconColor, }: FeatureListProps): React__default.ReactElement;
interface TestimonialProps {
    quote: string;
    authorName: string;
    authorTitle?: string;
    authorImage?: string;
    companyLogo?: string;
    rating?: number;
    style?: 'simple' | 'card' | 'featured';
}
declare function Testimonial({ quote, authorName, authorTitle, authorImage, companyLogo, rating, style, }: TestimonialProps): React__default.ReactElement;

/**
 * E-commerce Puck Configuration
 *
 * Puck configuration for building e-commerce pages, pricing tables,
 * checkout flows, and sales pages visually.
 */

type EcommerceComponents = {
    PricingTable: PricingTableProps;
    ProductCard: ProductCardProps;
    ProductGrid: ProductGridProps;
    OrderSummary: OrderSummaryProps;
    CheckoutSection: CheckoutSectionProps;
    FeatureList: FeatureListProps;
    Testimonial: TestimonialProps;
};
declare const ecommercePuckConfig: Config<EcommerceComponents>;

interface EmailContainerProps {
    backgroundColor: string;
    width: number;
    padding: number;
    children?: React__default.ReactNode;
}
interface EmailHeaderProps {
    logoUrl: string;
    logoAlt: string;
    logoWidth: number;
    alignment: 'left' | 'center' | 'right';
    backgroundColor: string;
}
interface EmailTextProps {
    content: string;
    fontSize: number;
    color: string;
    alignment: 'left' | 'center' | 'right';
    fontWeight: 'normal' | 'bold';
    lineHeight: number;
}
interface EmailButtonProps {
    label: string;
    href: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: number;
    fullWidth: boolean;
    alignment: 'left' | 'center' | 'right';
}
interface EmailImageProps {
    src: string;
    alt: string;
    width: number | 'full';
    alignment: 'left' | 'center' | 'right';
    borderRadius: number;
}
interface EmailDividerProps {
    color: string;
    thickness: number;
    style: 'solid' | 'dashed' | 'dotted';
}
interface EmailColumnsProps {
    columns: number;
    gap: number;
    content: string;
}
interface EmailFooterProps {
    companyName: string;
    address: string;
    unsubscribeUrl: string;
    socialLinks: Array<{
        platform: string;
        url: string;
    }>;
    textColor: string;
}
interface EmailHeroProps {
    heading: string;
    subheading: string;
    imageUrl: string;
    ctaLabel: string;
    ctaUrl: string;
    backgroundColor: string;
    textColor: string;
    imagePosition: 'above' | 'below' | 'background';
}
interface EmailCardProps {
    title: string;
    description: string;
    imageUrl: string;
    ctaLabel: string;
    ctaUrl: string;
    backgroundColor: string;
    borderRadius: number;
}
interface EmailListProps {
    items: string;
    style: 'bullet' | 'number' | 'check';
    color: string;
}
interface EmailSpacerProps {
    height: number;
}
interface EmailProductProps {
    productName: string;
    productImage: string;
    productPrice: string;
    productDescription: string;
    ctaLabel: string;
    ctaUrl: string;
}
interface EmailCouponProps {
    code: string;
    discount: string;
    expiryDate: string;
    backgroundColor: string;
    borderColor: string;
}
declare const EmailContainer: ({ backgroundColor, width, padding, }: EmailContainerProps) => react_jsx_runtime.JSX.Element;
declare const EmailHeader: ({ logoUrl, logoAlt, logoWidth, alignment, backgroundColor, }: EmailHeaderProps) => react_jsx_runtime.JSX.Element;
declare const EmailText: ({ content, fontSize, color, alignment, fontWeight, lineHeight, }: EmailTextProps) => react_jsx_runtime.JSX.Element;
declare const EmailButton: ({ label, href, backgroundColor, textColor, borderRadius, fullWidth, alignment, }: EmailButtonProps) => react_jsx_runtime.JSX.Element;
declare const EmailImage: ({ src, alt, width, alignment, borderRadius, }: EmailImageProps) => react_jsx_runtime.JSX.Element;
declare const EmailDivider: ({ color, thickness, style, }: EmailDividerProps) => react_jsx_runtime.JSX.Element;
declare const EmailColumns: ({ columns, gap, content, }: EmailColumnsProps) => react_jsx_runtime.JSX.Element;
declare const EmailFooter: ({ companyName, address, unsubscribeUrl, socialLinks, textColor, }: EmailFooterProps) => react_jsx_runtime.JSX.Element;
declare const EmailHero: ({ heading, subheading, imageUrl, ctaLabel, ctaUrl, backgroundColor, textColor, imagePosition, }: EmailHeroProps) => react_jsx_runtime.JSX.Element;
declare const EmailCard: ({ title, description, imageUrl, ctaLabel, ctaUrl, backgroundColor, borderRadius, }: EmailCardProps) => react_jsx_runtime.JSX.Element;
declare const EmailList: ({ items, style, color, }: EmailListProps) => react_jsx_runtime.JSX.Element;
declare const EmailSpacer: ({ height }: EmailSpacerProps) => react_jsx_runtime.JSX.Element;
declare const EmailProduct: ({ productName, productImage, productPrice, productDescription, ctaLabel, ctaUrl, }: EmailProductProps) => react_jsx_runtime.JSX.Element;
declare const EmailCoupon: ({ code, discount, expiryDate, backgroundColor, borderColor, }: EmailCouponProps) => react_jsx_runtime.JSX.Element;

type EmailComponents = {
    EmailContainer: EmailContainerProps;
    EmailHeader: EmailHeaderProps;
    EmailText: EmailTextProps;
    EmailButton: EmailButtonProps;
    EmailImage: EmailImageProps;
    EmailDivider: EmailDividerProps;
    EmailColumns: EmailColumnsProps;
    EmailFooter: EmailFooterProps;
    EmailHero: EmailHeroProps;
    EmailCard: EmailCardProps;
    EmailList: EmailListProps;
    EmailSpacer: EmailSpacerProps;
    EmailProduct: EmailProductProps;
    EmailCoupon: EmailCouponProps;
};
declare const emailPuckConfig: Config<EmailComponents>;

/**
 * Puck Layout Components - Header and Footer
 *
 * Reusable header and footer components for global or selective use across pages.
 * These components can be configured globally in site settings or customized per page.
 */
interface NavLink {
    label: string;
    href: string;
    openInNewTab?: boolean;
}
interface SocialLink {
    platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok' | 'github';
    url: string;
}
interface FooterColumn {
    title: string;
    links: NavLink[];
}
interface HeaderProps {
    logo?: {
        type: 'text' | 'image';
        text?: string;
        imageUrl?: string;
        imageAlt?: string;
        width?: number;
        height?: number;
    };
    navLinks: NavLink[];
    showSearch?: boolean;
    showCart?: boolean;
    showAccount?: boolean;
    ctaButton?: {
        label: string;
        href: string;
        variant: 'primary' | 'secondary' | 'outline';
    };
    sticky?: boolean;
    transparent?: boolean;
    backgroundColor?: string;
    textColor?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}
declare function Header({ logo, navLinks, showSearch, showCart, showAccount, ctaButton, sticky, transparent, backgroundColor, textColor, maxWidth, }: HeaderProps): react_jsx_runtime.JSX.Element;
interface FooterProps {
    logo?: {
        type: 'text' | 'image';
        text?: string;
        imageUrl?: string;
        imageAlt?: string;
        width?: number;
        height?: number;
    };
    tagline?: string;
    columns: FooterColumn[];
    socialLinks?: SocialLink[];
    newsletter?: {
        enabled: boolean;
        title?: string;
        description?: string;
        placeholder?: string;
        buttonLabel?: string;
    };
    bottomLinks?: NavLink[];
    copyrightText?: string;
    backgroundColor?: string;
    textColor?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    layout?: 'simple' | 'columns' | 'centered';
}
declare function Footer({ logo, tagline, columns, socialLinks, newsletter, bottomLinks, copyrightText, backgroundColor, textColor, maxWidth, layout, }: FooterProps): react_jsx_runtime.JSX.Element;
interface AnnouncementBarProps {
    message: string;
    link?: {
        label: string;
        href: string;
    };
    dismissible?: boolean;
    backgroundColor?: string;
    textColor?: string;
}
declare function AnnouncementBar({ message, link, dismissible, backgroundColor, textColor, }: AnnouncementBarProps): react_jsx_runtime.JSX.Element;

/**
 * Puck Configuration for Layout Components (Header & Footer)
 *
 * Provides configurable header and footer components for use
 * in global site settings or per-page customization.
 */

type LayoutComponents = {
    Header: HeaderProps;
    Footer: FooterProps;
    AnnouncementBar: AnnouncementBarProps;
};
declare const layoutPuckConfig: Config<LayoutComponents>;

interface StatWidgetProps {
    title: string;
    value: string;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon?: string;
    backgroundColor?: string;
}
declare function StatWidget({ title, value, change, changeType, icon, backgroundColor, }: StatWidgetProps): react_jsx_runtime.JSX.Element;
interface ChartWidgetProps {
    title: string;
    chartType: 'bar' | 'line' | 'pie';
    dataSource?: string;
    height?: number;
    backgroundColor?: string;
}
declare function ChartWidget({ title, chartType, height, backgroundColor, }: ChartWidgetProps): react_jsx_runtime.JSX.Element;
interface TableWidgetProps {
    title: string;
    columns: string;
    dataSource?: string;
    maxRows?: number;
    backgroundColor?: string;
}
declare function TableWidget({ title, columns, maxRows, backgroundColor, }: TableWidgetProps): react_jsx_runtime.JSX.Element;
interface ActivityWidgetProps {
    title: string;
    maxItems?: number;
    backgroundColor?: string;
}
declare function ActivityWidget({ title, maxItems, backgroundColor, }: ActivityWidgetProps): react_jsx_runtime.JSX.Element;
interface FormSectionProps {
    title: string;
    description?: string;
    children?: React__default.ReactNode;
}
declare function FormSection({ title, description, children, }: FormSectionProps): react_jsx_runtime.JSX.Element;
interface TextInputFieldProps {
    label: string;
    name: string;
    placeholder?: string;
    helpText?: string;
    required?: boolean;
    type?: 'text' | 'email' | 'url' | 'password';
}
declare function TextInputField({ label, name, placeholder, helpText, required, type, }: TextInputFieldProps): react_jsx_runtime.JSX.Element;
interface SelectFieldProps {
    label: string;
    name: string;
    options: string;
    helpText?: string;
    required?: boolean;
}
declare function SelectField({ label, name, options, helpText, required, }: SelectFieldProps): react_jsx_runtime.JSX.Element;
interface ToggleFieldProps {
    label: string;
    name: string;
    description?: string;
    defaultEnabled?: boolean;
    onChange?: (enabled: boolean) => void;
}
declare function ToggleField({ label, name, description, defaultEnabled, onChange, }: ToggleFieldProps): react_jsx_runtime.JSX.Element;
interface PageHeaderProps {
    title: string;
    description?: string;
    showBackButton?: boolean;
    onBack?: () => void;
}
declare function PageHeader({ title, description, showBackButton, onBack, }: PageHeaderProps): react_jsx_runtime.JSX.Element;
interface CardContainerProps {
    title?: string;
    padding?: number;
    backgroundColor?: string;
    children?: React__default.ReactNode;
}
declare function CardContainer({ title, padding, backgroundColor, children, }: CardContainerProps): react_jsx_runtime.JSX.Element;
interface GridLayoutProps {
    columns: number;
    gap?: number;
    children?: React__default.ReactNode;
}
declare function GridLayout({ columns, gap, children, }: GridLayoutProps): react_jsx_runtime.JSX.Element;
interface TabsContainerProps {
    tabs: string;
    defaultTab?: string;
    onTabChange?: (tab: string) => void;
}
declare function TabsContainer({ tabs, defaultTab, onTabChange, }: TabsContainerProps): react_jsx_runtime.JSX.Element;
interface ActionButtonProps {
    label: string;
    variant?: 'primary' | 'secondary' | 'danger';
    icon?: string;
    fullWidth?: boolean;
    onClick?: () => void;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
}
declare function ActionButton({ label, variant, icon, fullWidth, onClick, disabled, type, }: ActionButtonProps): react_jsx_runtime.JSX.Element;
interface AlertBoxProps {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message?: string;
    dismissible?: boolean;
    onDismiss?: () => void;
}
declare function AlertBox({ type, title, message, dismissible, onDismiss, }: AlertBoxProps): react_jsx_runtime.JSX.Element;

/**
 * Plugin UI Puck Configuration
 *
 * Puck configuration for building plugin settings pages, dashboard widgets,
 * and custom admin pages visually.
 */

type PluginUIComponents = {
    StatWidget: StatWidgetProps;
    ChartWidget: ChartWidgetProps;
    TableWidget: TableWidgetProps;
    ActivityWidget: ActivityWidgetProps;
    FormSection: FormSectionProps;
    TextInputField: TextInputFieldProps;
    SelectField: SelectFieldProps;
    ToggleField: ToggleFieldProps;
    PageHeader: PageHeaderProps;
    CardContainer: CardContainerProps;
    GridLayout: GridLayoutProps;
    TabsContainer: TabsContainerProps;
    ActionButton: ActionButtonProps;
    AlertBox: AlertBoxProps;
};
declare const pluginUIPuckConfig: Config<PluginUIComponents>;

export { AccountOverview, type AccountOverviewProps, ActionButton, type ActionButtonProps, ActivityWidget, type ActivityWidgetProps, AddressCard, type AddressCardProps, AlertBox, type AlertBoxProps, AnnouncementBar, type AnnouncementBarProps, CardContainer, type CardContainerProps, ChartWidget, type ChartWidgetProps, CheckoutSection, type CheckoutSectionProps, type DashboardComponents, type EcommerceComponents, EmailButton, type EmailButtonProps, EmailCard, type EmailCardProps, EmailColumns, type EmailColumnsProps, type EmailComponents, EmailContainer, type EmailContainerProps, EmailCoupon, type EmailCouponProps, EmailDivider, type EmailDividerProps, EmailFooter, type EmailFooterProps, EmailHeader, type EmailHeaderProps, EmailHero, type EmailHeroProps, EmailImage, type EmailImageProps, EmailList, type EmailListProps, EmailProduct, type EmailProductProps, EmailSpacer, type EmailSpacerProps, EmailText, type EmailTextProps, type FeatureItem, FeatureList, type FeatureListProps, Footer, type FooterColumn, type FooterProps, FormSection, type FormSectionProps, GridLayout, type GridLayoutProps, Header, type HeaderProps, type LayoutComponents, LoyaltyPointsWidget, type LoyaltyPointsWidgetProps, type NavLink, OrderHistoryList, type OrderHistoryListProps, OrderSummary, OrderSummaryCard, type OrderSummaryCardProps, type OrderSummaryItem, type OrderSummaryProps, PageHeader, type PageHeaderProps, PaymentMethodsList, type PaymentMethodsListProps, type PluginUIComponents, type PricingPlanItem, PricingTable, type PricingTableProps, ProductCard, type ProductCardProps, ProductGrid, type ProductGridItem, type ProductGridProps, QuickActionsGrid, type QuickActionsGridProps, SelectField, type SelectFieldProps, ShippingTracker, type ShippingTrackerProps, type SocialLink, StatWidget, type StatWidgetProps, SupportWidget, type SupportWidgetProps, TableWidget, type TableWidgetProps, TabsContainer, type TabsContainerProps, Testimonial, type TestimonialProps, TextInputField, type TextInputFieldProps, ToggleField, type ToggleFieldProps, WishlistItem, type WishlistItemProps, dashboardPuckConfig, ecommercePuckConfig, emailPuckConfig, layoutPuckConfig, pluginUIPuckConfig };
