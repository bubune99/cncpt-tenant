/**
 * Email Attachments Types
 *
 * Defines types for email template attachments
 */

export interface EmailAttachment {
  id: string;
  name: string;
  type: "invoice" | "document" | "image";
  sourceType: "invoice" | "media" | "url";
  sourceId?: string;
  sourceUrl?: string;
  useVariable?: boolean;
  variableKey?: string;
  mimeType?: string;
  size?: number;
}

/**
 * Resolve attachments for sending
 * Replaces variables with actual values and fetches attachment data
 */
export async function resolveAttachments(
  attachments: EmailAttachment[],
  data: Record<string, unknown>
): Promise<Array<{ filename: string; content: Buffer; contentType: string }>> {
  const resolved: Array<{ filename: string; content: Buffer; contentType: string }> = [];

  for (const attachment of attachments) {
    let sourceId = attachment.sourceId;
    let filename = attachment.name;

    // Resolve variable-based attachments
    if (attachment.useVariable && attachment.variableKey) {
      const variableValue = getNestedValue(data, attachment.variableKey);
      if (variableValue) {
        sourceId = String(variableValue);
        // Replace variable in filename
        filename = filename.replace(
          new RegExp(`\\{\\{${attachment.variableKey}\\}\\}`, "g"),
          String(variableValue)
        );
      }
    }

    // Skip if no source ID resolved
    if (!sourceId) continue;

    // Fetch attachment content based on type
    if (attachment.sourceType === "invoice") {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/invoices/${sourceId}/pdf`
        );
        if (response.ok) {
          const buffer = Buffer.from(await response.arrayBuffer());
          resolved.push({
            filename,
            content: buffer,
            contentType: "application/pdf",
          });
        }
      } catch (error) {
        console.error(`Failed to fetch invoice attachment: ${sourceId}`, error);
      }
    }
  }

  return resolved;
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
