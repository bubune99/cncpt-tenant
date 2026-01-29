/**
 * Email Variables System
 *
 * Provides template variables for email templates with sample values
 * for preview rendering and variable replacement.
 */

export interface VariableDefinition {
  key: string;
  label: string;
  sampleValue: string;
  description?: string;
}

export interface VariableCategory {
  label: string;
  icon: string;
  variables: VariableDefinition[];
}

/**
 * Email template variables organized by category
 */
export const emailVariables: Record<string, VariableCategory> = {
  user: {
    label: "User",
    icon: "user",
    variables: [
      { key: "user.name", label: "User Name", sampleValue: "John Doe" },
      { key: "user.firstName", label: "First Name", sampleValue: "John" },
      { key: "user.lastName", label: "Last Name", sampleValue: "Doe" },
      { key: "user.email", label: "Email", sampleValue: "john@example.com" },
    ],
  },
  order: {
    label: "Order",
    icon: "shopping-cart",
    variables: [
      { key: "order.id", label: "Order ID", sampleValue: "ORD-12345" },
      { key: "order.number", label: "Order Number", sampleValue: "#12345" },
      { key: "order.total", label: "Order Total", sampleValue: "$99.99" },
      { key: "order.status", label: "Order Status", sampleValue: "Processing" },
      { key: "order.date", label: "Order Date", sampleValue: "January 15, 2026" },
      {
        key: "order.trackingUrl",
        label: "Tracking URL",
        sampleValue: "https://track.example.com/123",
      },
    ],
  },
  shipping: {
    label: "Shipping",
    icon: "package",
    variables: [
      { key: "shipping.address", label: "Shipping Address", sampleValue: "123 Main St" },
      { key: "shipping.city", label: "City", sampleValue: "New York" },
      { key: "shipping.state", label: "State", sampleValue: "NY" },
      { key: "shipping.zip", label: "ZIP Code", sampleValue: "10001" },
      { key: "shipping.country", label: "Country", sampleValue: "United States" },
      { key: "shipping.carrier", label: "Carrier", sampleValue: "FedEx" },
      {
        key: "shipping.trackingNumber",
        label: "Tracking Number",
        sampleValue: "1234567890",
      },
    ],
  },
  company: {
    label: "Company",
    icon: "building",
    variables: [
      { key: "company.name", label: "Company Name", sampleValue: "Acme Inc" },
      { key: "company.email", label: "Support Email", sampleValue: "support@acme.com" },
      { key: "company.phone", label: "Phone", sampleValue: "(555) 123-4567" },
      { key: "company.address", label: "Address", sampleValue: "456 Business Ave" },
      { key: "company.website", label: "Website", sampleValue: "https://acme.com" },
    ],
  },
  date: {
    label: "Date & Time",
    icon: "calendar",
    variables: [
      { key: "date.today", label: "Today's Date", sampleValue: "January 16, 2026" },
      { key: "date.year", label: "Current Year", sampleValue: "2026" },
      { key: "date.month", label: "Current Month", sampleValue: "January" },
    ],
  },
  links: {
    label: "Links",
    icon: "link",
    variables: [
      {
        key: "links.unsubscribe",
        label: "Unsubscribe Link",
        sampleValue: "https://example.com/unsubscribe",
      },
      {
        key: "links.preferences",
        label: "Preferences Link",
        sampleValue: "https://example.com/preferences",
      },
      {
        key: "links.viewInBrowser",
        label: "View in Browser",
        sampleValue: "https://example.com/email/view",
      },
    ],
  },
};

/**
 * Check if text contains any template variables
 */
export function hasVariables(text: string): boolean {
  return /\{\{[\w.]+\}\}/.test(text);
}

/**
 * Get all variable keys from text
 */
export function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{([\w.]+)\}\}/g);
  if (!matches) return [];
  return matches.map((m) => m.replace(/\{\{|\}\}/g, ""));
}

/**
 * Replace variables with their sample values for preview
 */
export function replaceWithSampleValues(text: string): string {
  if (!hasVariables(text)) return text;

  let result = text;
  const variableKeys = extractVariables(text);

  for (const key of variableKeys) {
    const sampleValue = getSampleValue(key);
    if (sampleValue) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), sampleValue);
    }
  }

  return result;
}

/**
 * Get sample value for a variable key
 */
function getSampleValue(key: string): string | null {
  for (const category of Object.values(emailVariables)) {
    const variable = category.variables.find((v) => v.key === key);
    if (variable) {
      return variable.sampleValue;
    }
  }
  return null;
}

/**
 * Replace variables with actual data
 */
export function replaceVariables(text: string, data: Record<string, unknown>): string {
  if (!hasVariables(text)) return text;

  let result = text;
  const variableKeys = extractVariables(text);

  for (const key of variableKeys) {
    const value = getNestedValue(data, key);
    if (value !== undefined) {
      result = result.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, "g"),
        String(value)
      );
    }
  }

  return result;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current: unknown, key) => {
    if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}
