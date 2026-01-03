'use client'

import React from 'react'
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'

// Type definitions for email components
export interface EmailContainerProps {
  backgroundColor: string
  width: number
  padding: number
  children?: React.ReactNode
}

export interface EmailHeaderProps {
  logoUrl: string
  logoAlt: string
  logoWidth: number
  alignment: 'left' | 'center' | 'right'
  backgroundColor: string
}

export interface EmailTextProps {
  content: string
  fontSize: number
  color: string
  alignment: 'left' | 'center' | 'right'
  fontWeight: 'normal' | 'bold'
  lineHeight: number
}

export interface EmailButtonProps {
  label: string
  href: string
  backgroundColor: string
  textColor: string
  borderRadius: number
  fullWidth: boolean
  alignment: 'left' | 'center' | 'right'
}

export interface EmailImageProps {
  src: string
  alt: string
  width: number | 'full'
  alignment: 'left' | 'center' | 'right'
  borderRadius: number
}

export interface EmailDividerProps {
  color: string
  thickness: number
  style: 'solid' | 'dashed' | 'dotted'
}

export interface EmailColumnsProps {
  columns: number
  gap: number
  content: string
}

export interface EmailFooterProps {
  companyName: string
  address: string
  unsubscribeUrl: string
  socialLinks: Array<{ platform: string; url: string }>
  textColor: string
}

export interface EmailHeroProps {
  heading: string
  subheading: string
  imageUrl: string
  ctaLabel: string
  ctaUrl: string
  backgroundColor: string
  textColor: string
  imagePosition: 'above' | 'below' | 'background'
}

export interface EmailCardProps {
  title: string
  description: string
  imageUrl: string
  ctaLabel: string
  ctaUrl: string
  backgroundColor: string
  borderRadius: number
}

export interface EmailListProps {
  items: string
  style: 'bullet' | 'number' | 'check'
  color: string
}

export interface EmailSpacerProps {
  height: number
}

export interface EmailProductProps {
  productName: string
  productImage: string
  productPrice: string
  productDescription: string
  ctaLabel: string
  ctaUrl: string
}

export interface EmailCouponProps {
  code: string
  discount: string
  expiryDate: string
  backgroundColor: string
  borderColor: string
}

// Component implementations using React Email
export const EmailContainer = ({
  backgroundColor,
  width,
  padding,
}: EmailContainerProps) => (
  <Container
    style={{
      maxWidth: width,
      margin: '0 auto',
      backgroundColor,
      padding,
    }}
  >
    <Text style={{ padding: 20, textAlign: 'center', color: '#666' }}>
      [Email Container - Add content blocks here]
    </Text>
  </Container>
)

export const EmailHeader = ({
  logoUrl,
  logoAlt,
  logoWidth,
  alignment,
  backgroundColor,
}: EmailHeaderProps) => (
  <Section style={{ backgroundColor, padding: '20px 0', textAlign: alignment }}>
    {logoUrl ? (
      <Img
        src={logoUrl}
        alt={logoAlt}
        width={logoWidth}
        style={{ display: 'inline-block' }}
      />
    ) : (
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1a56db', margin: 0 }}>
        Your Logo
      </Text>
    )}
  </Section>
)

export const EmailText = ({
  content,
  fontSize,
  color,
  alignment,
  fontWeight,
  lineHeight,
}: EmailTextProps) => (
  <Text
    style={{
      fontSize,
      color,
      textAlign: alignment,
      fontWeight,
      lineHeight,
      margin: '0 0 16px 0',
      fontFamily: 'Arial, sans-serif',
    }}
  >
    {content}
  </Text>
)

export const EmailButton = ({
  label,
  href,
  backgroundColor,
  textColor,
  borderRadius,
  fullWidth,
  alignment,
}: EmailButtonProps) => (
  <Section style={{ textAlign: alignment }}>
    <Button
      href={href}
      style={{
        display: fullWidth ? 'block' : 'inline-block',
        backgroundColor,
        color: textColor,
        padding: '14px 28px',
        borderRadius,
        textDecoration: 'none',
        fontWeight: 600,
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {label}
    </Button>
  </Section>
)

export const EmailImage = ({
  src,
  alt,
  width,
  alignment,
  borderRadius,
}: EmailImageProps) => (
  <Section style={{ textAlign: alignment }}>
    {src ? (
      <Img
        src={src}
        alt={alt}
        width={width === 'full' ? '100%' : width}
        style={{
          display: 'inline-block',
          borderRadius,
          maxWidth: '100%',
        }}
      />
    ) : (
      <div
        style={{
          width: width === 'full' ? '100%' : width,
          height: 200,
          backgroundColor: '#e5e7eb',
          borderRadius,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
        }}
      >
        Image Placeholder
      </div>
    )}
  </Section>
)

export const EmailDivider = ({
  color,
  thickness,
  style,
}: EmailDividerProps) => (
  <Hr
    style={{
      border: 'none',
      borderTop: `${thickness}px ${style} ${color}`,
      margin: '20px 0',
    }}
  />
)

export const EmailColumns = ({
  columns,
  gap,
  content,
}: EmailColumnsProps) => {
  const contentItems = content.split('\n').filter(Boolean)

  return (
    <Row>
      {Array.from({ length: columns }).map((_, i) => (
        <Column
          key={i}
          style={{
            width: `${100 / columns}%`,
            padding: `0 ${gap / 2}px`,
            verticalAlign: 'top',
          }}
        >
          <Text style={{ margin: 0 }}>{contentItems[i] || `Column ${i + 1}`}</Text>
        </Column>
      ))}
    </Row>
  )
}

export const EmailFooter = ({
  companyName,
  address,
  unsubscribeUrl,
  socialLinks,
  textColor,
}: EmailFooterProps) => (
  <Section
    style={{
      borderTop: '1px solid #e5e7eb',
      padding: '20px 0',
      marginTop: 20,
      textAlign: 'center',
    }}
  >
    {socialLinks && socialLinks.length > 0 && (
      <Row style={{ marginBottom: 16 }}>
        <Column style={{ textAlign: 'center' }}>
          {socialLinks.map((link, i) => (
            <Link
              key={i}
              href={link.url}
              style={{
                color: textColor,
                textDecoration: 'none',
                margin: '0 8px',
                fontSize: 12,
              }}
            >
              {link.platform}
            </Link>
          ))}
        </Column>
      </Row>
    )}
    <Text style={{ color: textColor, fontSize: 12, margin: '0 0 8px 0', fontFamily: 'Arial, sans-serif' }}>
      {companyName}
    </Text>
    <Text style={{ color: textColor, fontSize: 12, margin: '0 0 8px 0', whiteSpace: 'pre-line', fontFamily: 'Arial, sans-serif' }}>
      {address}
    </Text>
    <Link
      href={unsubscribeUrl}
      style={{ color: textColor, fontSize: 12, textDecoration: 'underline' }}
    >
      Unsubscribe
    </Link>
  </Section>
)

export const EmailHero = ({
  heading,
  subheading,
  imageUrl,
  ctaLabel,
  ctaUrl,
  backgroundColor,
  textColor,
  imagePosition,
}: EmailHeroProps) => (
  <Section
    style={{
      backgroundColor,
      padding: 40,
      textAlign: 'center',
      backgroundImage: imagePosition === 'background' && imageUrl ? `url(${imageUrl})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  >
    {imagePosition === 'above' && imageUrl && (
      <Img
        src={imageUrl}
        alt=""
        style={{ maxWidth: '100%', marginBottom: 20 }}
      />
    )}
    <Heading
      style={{
        color: textColor,
        fontSize: 32,
        fontWeight: 'bold',
        margin: '0 0 16px 0',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {heading}
    </Heading>
    <Text
      style={{
        color: textColor,
        fontSize: 18,
        margin: '0 0 24px 0',
        opacity: 0.9,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {subheading}
    </Text>
    {ctaLabel && (
      <Button
        href={ctaUrl}
        style={{
          display: 'inline-block',
          backgroundColor: textColor === '#ffffff' ? '#ffffff' : '#1a56db',
          color: textColor === '#ffffff' ? '#111827' : '#ffffff',
          padding: '14px 32px',
          borderRadius: 6,
          textDecoration: 'none',
          fontWeight: 600,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {ctaLabel}
      </Button>
    )}
    {imagePosition === 'below' && imageUrl && (
      <Img
        src={imageUrl}
        alt=""
        style={{ maxWidth: '100%', marginTop: 20 }}
      />
    )}
  </Section>
)

export const EmailCard = ({
  title,
  description,
  imageUrl,
  ctaLabel,
  ctaUrl,
  backgroundColor,
  borderRadius,
}: EmailCardProps) => (
  <Section
    style={{
      backgroundColor,
      borderRadius,
      overflow: 'hidden',
      border: '1px solid #e5e7eb',
    }}
  >
    {imageUrl && (
      <Img src={imageUrl} alt="" style={{ width: '100%' }} />
    )}
    <Row style={{ padding: 20 }}>
      <Column>
        <Heading as="h3" style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 600, fontFamily: 'Arial, sans-serif' }}>
          {title}
        </Heading>
        <Text style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: 14, fontFamily: 'Arial, sans-serif' }}>
          {description}
        </Text>
        {ctaLabel && (
          <Link
            href={ctaUrl}
            style={{
              color: '#1a56db',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14,
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {ctaLabel} →
          </Link>
        )}
      </Column>
    </Row>
  </Section>
)

export const EmailList = ({
  items,
  style,
  color,
}: EmailListProps) => {
  const itemsList = items.split('\n').filter(Boolean)

  return (
    <Section style={{ fontFamily: 'Arial, sans-serif' }}>
      {itemsList.map((item, i) => (
        <Row key={i} style={{ marginBottom: 8 }}>
          <Column style={{ width: 24, color, verticalAlign: 'top' }}>
            {style === 'check' ? (
              <span style={{ color: '#10b981' }}>✓</span>
            ) : style === 'number' ? (
              `${i + 1}.`
            ) : (
              '•'
            )}
          </Column>
          <Column style={{ color }}>
            <Text style={{ margin: 0, color }}>{item}</Text>
          </Column>
        </Row>
      ))}
    </Section>
  )
}

export const EmailSpacer = ({ height }: EmailSpacerProps) => (
  <Section style={{ height }} />
)

export const EmailProduct = ({
  productName,
  productImage,
  productPrice,
  productDescription,
  ctaLabel,
  ctaUrl,
}: EmailProductProps) => (
  <Section
    style={{
      backgroundColor: '#ffffff',
      borderRadius: 8,
      overflow: 'hidden',
      border: '1px solid #e5e7eb',
      marginBottom: 16,
    }}
  >
    <Row>
      <Column style={{ width: 120, padding: 16, verticalAlign: 'top' }}>
        {productImage ? (
          <Img
            src={productImage}
            alt={productName}
            width={100}
            height={100}
            style={{ objectFit: 'cover', borderRadius: 8 }}
          />
        ) : (
          <div
            style={{
              width: 100,
              height: 100,
              backgroundColor: '#f3f4f6',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              fontSize: 12,
            }}
          >
            No Image
          </div>
        )}
      </Column>
      <Column style={{ padding: 16, verticalAlign: 'top' }}>
        <Heading as="h4" style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 600, fontFamily: 'Arial, sans-serif' }}>
          {productName}
        </Heading>
        <Text style={{ margin: '0 0 8px 0', color: '#1a56db', fontSize: 18, fontWeight: 700, fontFamily: 'Arial, sans-serif' }}>
          {productPrice}
        </Text>
        <Text style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: 14, fontFamily: 'Arial, sans-serif' }}>
          {productDescription}
        </Text>
        {ctaLabel && (
          <Button
            href={ctaUrl}
            style={{
              display: 'inline-block',
              backgroundColor: '#1a56db',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: 4,
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: 14,
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {ctaLabel}
          </Button>
        )}
      </Column>
    </Row>
  </Section>
)

export const EmailCoupon = ({
  code,
  discount,
  expiryDate,
  backgroundColor,
  borderColor,
}: EmailCouponProps) => (
  <Section
    style={{
      backgroundColor,
      border: `2px dashed ${borderColor}`,
      borderRadius: 8,
      padding: 24,
      textAlign: 'center',
    }}
  >
    <Text style={{ margin: '0 0 8px 0', fontSize: 14, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>
      USE CODE
    </Text>
    <Text
      style={{
        margin: '0 0 8px 0',
        fontSize: 28,
        fontWeight: 700,
        color: '#111827',
        letterSpacing: 2,
        fontFamily: 'monospace',
      }}
    >
      {code}
    </Text>
    <Text style={{ margin: '0 0 8px 0', fontSize: 20, color: '#059669', fontWeight: 600, fontFamily: 'Arial, sans-serif' }}>
      {discount}
    </Text>
    <Text style={{ margin: 0, fontSize: 12, color: '#9ca3af', fontFamily: 'Arial, sans-serif' }}>
      Expires: {expiryDate}
    </Text>
  </Section>
)

// Export React Email components for use in full email templates
export {
  Html,
  Head,
  Body,
  Preview,
  Container,
  Section,
  Row,
  Column,
  Text as REText,
  Heading as REHeading,
  Button as REButton,
  Link as RELink,
  Img as REImg,
  Hr as REHr,
}
