/**
 * Puck Email Template Renderer
 *
 * Renders EmailTemplate records that contain Puck JSON content
 */

import { prisma } from '../../db';
import { parseMergeTags, MergeTagData } from '../merge-tags';
import { wrapInBaseTemplate, htmlToPlainText } from './renderer';
import { getEmailSettings } from '../../settings';

interface RenderResult {
  html: string;
  text: string;
  subject?: string;
}

/**
 * Render an email template by ID with merge data
 */
export async function renderEmailTemplate(
  templateId: string,
  data: Record<string, unknown>
): Promise<RenderResult> {
  const template = await prisma.emailTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error(`Email template not found: ${templateId}`);
  }

  return renderEmailTemplateData(template, data);
}

/**
 * Render an email template by slug with merge data
 */
export async function renderEmailTemplateBySlug(
  slug: string,
  data: Record<string, unknown>
): Promise<RenderResult | null> {
  const template = await prisma.emailTemplate.findUnique({
    where: { slug },
  });

  if (!template) {
    return null;
  }

  return renderEmailTemplateData(template, data);
}

/**
 * Render template data (internal helper)
 */
async function renderEmailTemplateData(
  template: {
    subject: string | null;
    preheader: string | null;
    content: unknown;
    html: string | null;
    name: string;
  },
  data: Record<string, unknown>
): Promise<RenderResult> {
  const emailSettings = await getEmailSettings();

  // Build merge data with store info
  const mergeData: MergeTagData = {
    ...flattenData(data),
    store: {
      name: emailSettings.fromName || 'Our Store',
      email: emailSettings.fromEmail || 'noreply@example.com',
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
    currentYear: new Date().getFullYear().toString(),
  };

  let html: string;
  let subject = template.subject || template.name;

  // Process subject merge tags
  subject = parseMergeTags(subject, mergeData);

  // If we have Puck JSON content, render it
  if (template.content && typeof template.content === 'object') {
    html = renderPuckContent(template.content as PuckContent, mergeData);
  } else if (template.html) {
    // Use pre-rendered HTML
    html = template.html;
  } else {
    // Fallback to empty content
    html = '<p>No content</p>';
  }

  // Process merge tags in HTML
  html = parseMergeTags(html, mergeData);

  // Wrap in base template
  html = wrapInBaseTemplate(html, {
    title: subject,
    preheader: template.preheader ? parseMergeTags(template.preheader, mergeData) : undefined,
    store: {
      name: emailSettings.fromName || 'Our Store',
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      supportEmail: emailSettings.replyTo || emailSettings.fromEmail || 'support@example.com',
    },
  });

  // Generate plain text version
  const text = htmlToPlainText(html);

  return { html, text, subject };
}

/**
 * Puck content structure
 */
interface PuckContent {
  content?: PuckComponent[];
  root?: {
    props?: Record<string, unknown>;
  };
}

interface PuckComponent {
  type: string;
  props?: Record<string, unknown>;
}

/**
 * Render Puck email content to HTML
 */
function renderPuckContent(content: PuckContent, mergeData: MergeTagData): string {
  if (!content.content || !Array.isArray(content.content)) {
    return '';
  }

  return content.content
    .map((component) => renderPuckComponent(component, mergeData))
    .join('\n');
}

/**
 * Render individual Puck component to HTML
 */
function renderPuckComponent(component: PuckComponent, mergeData: MergeTagData): string {
  const props = component.props || {};

  switch (component.type) {
    case 'Heading':
      const level = props.level || 'h1';
      const headingText = parseMergeTags(String(props.text || ''), mergeData);
      return `<${level} style="color: #333; margin: 0 0 16px 0;">${headingText}</${level}>`;

    case 'Text':
    case 'Paragraph':
      const text = parseMergeTags(String(props.text || props.content || ''), mergeData);
      return `<p style="color: #333; line-height: 1.6; margin: 0 0 16px 0;">${text}</p>`;

    case 'Button':
      const buttonText = parseMergeTags(String(props.label || props.text || 'Click Here'), mergeData);
      const buttonUrl = parseMergeTags(String(props.url || props.href || '#'), mergeData);
      const buttonColor = props.color || '#000';
      return `
        <table border="0" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
          <tr>
            <td style="background-color: ${buttonColor}; border-radius: 6px; padding: 12px 24px;">
              <a href="${buttonUrl}" style="color: #ffffff; text-decoration: none; font-weight: 600;">${buttonText}</a>
            </td>
          </tr>
        </table>
      `;

    case 'Image':
      const src = parseMergeTags(String(props.src || props.url || ''), mergeData);
      const alt = parseMergeTags(String(props.alt || ''), mergeData);
      const width = props.width || '100%';
      return `<img src="${src}" alt="${alt}" width="${width}" style="max-width: 100%; height: auto; margin: 16px 0; border-radius: 8px;" />`;

    case 'Divider':
      return '<hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />';

    case 'Spacer':
      const height = props.height || 24;
      return `<div style="height: ${height}px;"></div>`;

    case 'Card':
    case 'Box':
      const cardContent = props.content ? renderPuckContent(props.content as PuckContent, mergeData) : '';
      return `<div style="background: #f9f9f9; border-radius: 8px; padding: 24px; margin: 16px 0;">${cardContent}</div>`;

    case 'Table':
      // Render data table
      const rows = (props.rows || props.data) as Array<Record<string, string>> || [];
      if (rows.length === 0) return '';

      const tableRows = rows
        .map((row) => {
          const cells = Object.entries(row)
            .map(([key, value]) => `<td style="padding: 8px; border-bottom: 1px solid #eee;">${parseMergeTags(String(value), mergeData)}</td>`)
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('');

      return `<table style="width: 100%; border-collapse: collapse; margin: 16px 0;"><tbody>${tableRows}</tbody></table>`;

    case 'OrderSummary':
    case 'SubmissionData':
      // Render dynamic data from merge tags
      const dataKey = typeof props.dataKey === 'string' ? props.dataKey : 'submission.fields';
      const fields = getNestedValue(mergeData, dataKey) as Array<{ label: string; value: string }> || [];

      if (!Array.isArray(fields) || fields.length === 0) return '';

      const summaryRows = fields
        .map((field) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 500;">${field.label}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${field.value}</td>
          </tr>
        `)
        .join('');

      return `<table style="width: 100%; border-collapse: collapse; margin: 16px 0;"><tbody>${summaryRows}</tbody></table>`;

    default:
      // Unknown component - try to render children or return empty
      if (props.children && typeof props.children === 'string') {
        return `<div>${parseMergeTags(props.children, mergeData)}</div>`;
      }
      return '';
  }
}

/**
 * Flatten nested object for merge tag access
 */
function flattenData(data: Record<string, unknown>, prefix = ''): MergeTagData {
  const result: MergeTagData = {};

  for (const [key, value] of Object.entries(data)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      result[fullKey] = '';
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenData(value as Record<string, unknown>, fullKey));
      result[fullKey] = value as MergeTagData;
    } else if (Array.isArray(value)) {
      result[fullKey] = value as MergeTagData[];
    } else {
      result[fullKey] = value as string | number | boolean;
    }
  }

  return result;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj as unknown);
}
