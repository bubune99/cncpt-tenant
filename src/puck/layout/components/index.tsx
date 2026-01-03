/**
 * Puck Layout Components - Header and Footer
 *
 * Reusable header and footer components for global or selective use across pages.
 * These components can be configured globally in site settings or customized per page.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

// ============================================================================
// TYPES
// ============================================================================

export interface NavLink {
  label: string;
  href: string;
  openInNewTab?: boolean;
}

export interface SocialLink {
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok' | 'github';
  url: string;
}

export interface FooterColumn {
  title: string;
  links: NavLink[];
}

// ============================================================================
// HEADER COMPONENT
// ============================================================================

export interface HeaderProps {
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

export function Header({
  logo = { type: 'text', text: 'Your Brand' },
  navLinks = [],
  showSearch = false,
  showCart = false,
  showAccount = false,
  ctaButton,
  sticky = true,
  transparent = false,
  backgroundColor = '#ffffff',
  textColor = '#18181b',
  maxWidth = 'xl',
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  const buttonVariants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-900 text-white hover:bg-gray-800',
    outline: 'border-2 border-current hover:bg-gray-100',
  };

  return (
    <header
      className={`w-full z-50 ${sticky ? 'sticky top-0' : ''} ${
        transparent ? 'bg-transparent' : ''
      }`}
      style={{
        backgroundColor: transparent ? 'transparent' : backgroundColor,
        color: textColor,
      }}
    >
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${maxWidthClasses[maxWidth]}`}>
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              {logo.type === 'image' && logo.imageUrl ? (
                <Image
                  src={logo.imageUrl}
                  alt={logo.imageAlt || 'Logo'}
                  width={logo.width || 120}
                  height={logo.height || 40}
                  className="h-8 lg:h-10 w-auto"
                />
              ) : (
                <span className="text-xl lg:text-2xl font-bold">{logo.text}</span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                target={link.openInNewTab ? '_blank' : undefined}
                rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                className="text-sm font-medium hover:opacity-70 transition-opacity"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            {showSearch && (
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            )}

            {/* Cart */}
            {showCart && (
              <Link
                href="/cart"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
                aria-label="Cart"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </Link>
            )}

            {/* Account */}
            {showAccount && (
              <Link
                href="/account"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Account"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </Link>
            )}

            {/* CTA Button */}
            {ctaButton && (
              <Link
                href={ctaButton.href}
                className={`hidden sm:inline-flex px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  buttonVariants[ctaButton.variant]
                }`}
              >
                {ctaButton.label}
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  target={link.openInNewTab ? '_blank' : undefined}
                  rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                  className="text-base font-medium hover:opacity-70 transition-opacity"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {ctaButton && (
                <Link
                  href={ctaButton.href}
                  className={`inline-flex justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    buttonVariants[ctaButton.variant]
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {ctaButton.label}
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

// ============================================================================
// FOOTER COMPONENT
// ============================================================================

export interface FooterProps {
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

const SocialIcon = ({ platform }: { platform: SocialLink['platform'] }) => {
  const icons: Record<SocialLink['platform'], React.ReactNode> = {
    facebook: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    twitter: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    instagram: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    linkedin: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    youtube: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    tiktok: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
    github: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  };

  return icons[platform] || null;
};

export function Footer({
  logo = { type: 'text', text: 'Your Brand' },
  tagline,
  columns = [],
  socialLinks = [],
  newsletter = { enabled: false },
  bottomLinks = [],
  copyrightText,
  backgroundColor = '#18181b',
  textColor = '#ffffff',
  maxWidth = 'xl',
  layout = 'columns',
}: FooterProps) {
  const [email, setEmail] = React.useState('');
  const currentYear = new Date().getFullYear();

  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Newsletter submission logic would go here
    console.log('Newsletter signup:', email);
    setEmail('');
  };

  return (
    <footer style={{ backgroundColor, color: textColor }}>
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 ${maxWidthClasses[maxWidth]}`}>
        {layout === 'centered' ? (
          /* Centered Layout */
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              {logo.type === 'image' && logo.imageUrl ? (
                <Image
                  src={logo.imageUrl}
                  alt={logo.imageAlt || 'Logo'}
                  width={logo.width || 150}
                  height={logo.height || 50}
                  className="h-10 w-auto"
                />
              ) : (
                <span className="text-2xl font-bold">{logo.text}</span>
              )}
            </div>

            {tagline && <p className="text-sm opacity-70 mb-8 max-w-md mx-auto">{tagline}</p>}

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex justify-center space-x-6 mb-8">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-70 hover:opacity-100 transition-opacity"
                    aria-label={social.platform}
                  >
                    <SocialIcon platform={social.platform} />
                  </a>
                ))}
              </div>
            )}

            {/* Newsletter */}
            {newsletter.enabled && (
              <div className="max-w-md mx-auto mb-8">
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={newsletter.placeholder || 'Enter your email'}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-white/40"
                    required
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  >
                    {newsletter.buttonLabel || 'Subscribe'}
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* Columns Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <div className="mb-4">
                {logo.type === 'image' && logo.imageUrl ? (
                  <Image
                    src={logo.imageUrl}
                    alt={logo.imageAlt || 'Logo'}
                    width={logo.width || 150}
                    height={logo.height || 50}
                    className="h-10 w-auto"
                  />
                ) : (
                  <span className="text-xl font-bold">{logo.text}</span>
                )}
              </div>

              {tagline && <p className="text-sm opacity-70 mb-6">{tagline}</p>}

              {/* Social Links */}
              {socialLinks.length > 0 && (
                <div className="flex space-x-4">
                  {socialLinks.map((social, index) => (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-70 hover:opacity-100 transition-opacity"
                      aria-label={social.platform}
                    >
                      <SocialIcon platform={social.platform} />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Link Columns */}
            {columns.map((column, colIndex) => (
              <div key={colIndex}>
                <h3 className="font-semibold mb-4">{column.title}</h3>
                <ul className="space-y-3">
                  {column.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link
                        href={link.href}
                        target={link.openInNewTab ? '_blank' : undefined}
                        rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                        className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Newsletter Column */}
            {newsletter.enabled && (
              <div>
                <h3 className="font-semibold mb-4">{newsletter.title || 'Newsletter'}</h3>
                {newsletter.description && (
                  <p className="text-sm opacity-70 mb-4">{newsletter.description}</p>
                )}
                <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={newsletter.placeholder || 'Enter your email'}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-white/40 text-sm"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-white text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors"
                  >
                    {newsletter.buttonLabel || 'Subscribe'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm opacity-70">
              {copyrightText || `© ${currentYear} ${logo.text || 'Your Brand'}. All rights reserved.`}
            </p>

            {bottomLinks.length > 0 && (
              <div className="flex flex-wrap justify-center gap-6">
                {bottomLinks.map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    target={link.openInNewTab ? '_blank' : undefined}
                    rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                    className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// ANNOUNCEMENT BAR COMPONENT
// ============================================================================

export interface AnnouncementBarProps {
  message: string;
  link?: {
    label: string;
    href: string;
  };
  dismissible?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

export function AnnouncementBar({
  message,
  link,
  dismissible = true,
  backgroundColor = '#2563eb',
  textColor = '#ffffff',
}: AnnouncementBarProps) {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return <div className="hidden" />;

  return (
    <div
      className="relative py-2 px-4 text-center text-sm"
      style={{ backgroundColor, color: textColor }}
    >
      <span>{message}</span>
      {link && (
        <Link
          href={link.href}
          className="ml-2 underline hover:no-underline font-medium"
        >
          {link.label}
        </Link>
      )}
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
