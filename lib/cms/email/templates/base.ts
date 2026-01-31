/**
 * Base Email Template
 *
 * Provides consistent styling and structure for all transactional emails.
 * Uses inline CSS for maximum email client compatibility.
 */

export interface BaseTemplateOptions {
  title: string;
  preheader?: string;
  content: string;
  footerContent?: string;
  brandColor?: string;
  logoUrl?: string;
  storeName?: string;
  storeUrl?: string;
  supportEmail?: string;
  unsubscribeUrl?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
}

/**
 * Base email template with responsive design and dark mode support
 */
export function baseTemplate(options: BaseTemplateOptions): string {
  const {
    title,
    preheader = '',
    content,
    footerContent = '',
    brandColor = '#4F46E5',
    logoUrl,
    storeName = '{{store.name}}',
    storeUrl = '{{store.url}}',
    supportEmail = '{{store.supportEmail}}',
    unsubscribeUrl,
    socialLinks = {},
  } = options;

  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings xmlns:o="urn:schemas-microsoft-com:office:office">
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style>
    td,th,div,p,a,h1,h2,h3,h4,h5,h6 {font-family: "Segoe UI", sans-serif; mso-line-height-rule: exactly;}
  </style>
  <![endif]-->
  <title>${title}</title>
  <style>
    :root {
      color-scheme: light dark;
    }

    /* Reset */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
      border-collapse: collapse !important;
    }

    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }

    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: #f4f4f5;
    }

    /* Dark mode styles */
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #18181b !important;
      }
      .email-container {
        background-color: #27272a !important;
      }
      .email-content {
        color: #e4e4e7 !important;
      }
      .email-footer {
        background-color: #18181b !important;
        color: #a1a1aa !important;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #fafafa !important;
      }
      p, td {
        color: #e4e4e7 !important;
      }
      .text-muted {
        color: #a1a1aa !important;
      }
    }

    /* Responsive styles */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .stack-column {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      .stack-column-center {
        text-align: center !important;
      }
      .mobile-padding {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }
      .mobile-hide {
        display: none !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5;">
  <!-- Preheader text (hidden) -->
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${preheader}
    ${'&zwnj;&nbsp;'.repeat(50)}
  </div>

  <!-- Email wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 10px;">

        <!-- Email container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; border-bottom: 1px solid #e4e4e7;">
              ${logoUrl ? `
              <a href="${storeUrl}" style="text-decoration: none;">
                <img src="${logoUrl}" alt="${storeName}" width="150" style="max-width: 150px; height: auto;">
              </a>
              ` : `
              <a href="${storeUrl}" style="text-decoration: none; font-size: 24px; font-weight: bold; color: ${brandColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                ${storeName}
              </a>
              `}
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="email-content mobile-padding" style="padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #3f3f46;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer" style="padding: 30px 40px; background-color: #fafafa; border-top: 1px solid #e4e4e7; border-radius: 0 0 8px 8px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                ${footerContent ? `
                <tr>
                  <td style="padding-bottom: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #71717a;">
                    ${footerContent}
                  </td>
                </tr>
                ` : ''}

                <!-- Social links -->
                ${Object.keys(socialLinks).length > 0 ? `
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    ${socialLinks.facebook ? `<a href="${socialLinks.facebook}" style="text-decoration: none; margin: 0 8px;"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg" width="24" height="24" alt="Facebook" style="opacity: 0.6;"></a>` : ''}
                    ${socialLinks.twitter ? `<a href="${socialLinks.twitter}" style="text-decoration: none; margin: 0 8px;"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitter.svg" width="24" height="24" alt="Twitter" style="opacity: 0.6;"></a>` : ''}
                    ${socialLinks.instagram ? `<a href="${socialLinks.instagram}" style="text-decoration: none; margin: 0 8px;"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg" width="24" height="24" alt="Instagram" style="opacity: 0.6;"></a>` : ''}
                  </td>
                </tr>
                ` : ''}

                <tr>
                  <td align="center" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #a1a1aa;">
                    <p style="margin: 0 0 8px 0;">
                      Questions? Contact us at <a href="mailto:${supportEmail}" style="color: ${brandColor}; text-decoration: none;">${supportEmail}</a>
                    </p>
                    <p style="margin: 0 0 8px 0;">
                      &copy; {{currentYear}} ${storeName}. All rights reserved.
                    </p>
                    ${unsubscribeUrl ? `
                    <p style="margin: 0;">
                      <a href="${unsubscribeUrl}" style="color: #a1a1aa; text-decoration: underline;">Unsubscribe</a>
                    </p>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

/**
 * Common UI components for email templates
 */
export const emailComponents = {
  /**
   * Primary call-to-action button
   */
  button: (text: string, url: string, color = '#4F46E5'): string => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
      <tr>
        <td style="border-radius: 6px; background-color: ${color};">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `,

  /**
   * Secondary/outline button
   */
  buttonOutline: (text: string, url: string, color = '#4F46E5'): string => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
      <tr>
        <td style="border-radius: 6px; border: 2px solid ${color};">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 12px 26px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: ${color}; text-decoration: none; border-radius: 6px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `,

  /**
   * Divider line
   */
  divider: (): string => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td style="border-top: 1px solid #e4e4e7;"></td>
      </tr>
    </table>
  `,

  /**
   * Info box/callout
   */
  infoBox: (content: string, bgColor = '#eff6ff', borderColor = '#3b82f6'): string => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td style="padding: 16px 20px; background-color: ${bgColor}; border-left: 4px solid ${borderColor}; border-radius: 4px;">
          ${content}
        </td>
      </tr>
    </table>
  `,

  /**
   * Success box
   */
  successBox: (content: string): string => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td style="padding: 16px 20px; background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 4px;">
          ${content}
        </td>
      </tr>
    </table>
  `,

  /**
   * Warning box
   */
  warningBox: (content: string): string => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td style="padding: 16px 20px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
          ${content}
        </td>
      </tr>
    </table>
  `,

  /**
   * Two-column layout row
   */
  twoColumn: (leftContent: string, rightContent: string): string => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td class="stack-column" width="50%" valign="top" style="padding-right: 10px;">
          ${leftContent}
        </td>
        <td class="stack-column" width="50%" valign="top" style="padding-left: 10px;">
          ${rightContent}
        </td>
      </tr>
    </table>
  `,

  /**
   * Image with optional caption
   */
  image: (src: string, alt: string, width = 520, caption?: string): string => `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 16px 0;">
      <tr>
        <td align="center">
          <img src="${src}" alt="${alt}" width="${width}" style="max-width: 100%; height: auto; border-radius: 6px;">
          ${caption ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #71717a;">${caption}</p>` : ''}
        </td>
      </tr>
    </table>
  `,

  /**
   * Heading styles
   */
  heading: {
    h1: (text: string): string => `<h1 style="margin: 0 0 24px 0; font-size: 28px; font-weight: 700; color: #18181b; line-height: 1.3;">${text}</h1>`,
    h2: (text: string): string => `<h2 style="margin: 24px 0 16px 0; font-size: 22px; font-weight: 600; color: #18181b; line-height: 1.3;">${text}</h2>`,
    h3: (text: string): string => `<h3 style="margin: 20px 0 12px 0; font-size: 18px; font-weight: 600; color: #18181b; line-height: 1.3;">${text}</h3>`,
  },

  /**
   * Paragraph
   */
  paragraph: (text: string): string => `<p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #3f3f46;">${text}</p>`,

  /**
   * Muted/secondary text
   */
  mutedText: (text: string): string => `<p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5; color: #71717a;">${text}</p>`,
};
