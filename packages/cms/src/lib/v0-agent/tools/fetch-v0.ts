/**
 * Fetch v0 Component Tool
 *
 * Fetches component code from a v0.dev URL
 */

import { AgentToolResult } from "../types";

interface FetchV0Input {
  url: string;
}

interface FetchV0Output {
  code: string;
  name?: string;
  description?: string;
  metadata?: {
    author?: string;
    createdAt?: string;
    version?: string;
  };
}

/**
 * Tool definition for Claude Agent SDK
 */
export const fetchV0Tool = {
  name: "fetch_v0_component",
  description: `Fetches a React component from a v0.dev URL.
Returns the component source code and any available metadata.
Use this as the first step when importing a v0 component.`,

  inputSchema: {
    type: "object" as const,
    properties: {
      url: {
        type: "string",
        description: "The v0.dev URL (e.g., https://v0.dev/t/abc123)",
      },
    },
    required: ["url"],
  },

  async execute(input: FetchV0Input): Promise<AgentToolResult<FetchV0Output>> {
    try {
      const { url } = input;

      // Validate URL is from v0.dev
      const parsedUrl = new URL(url);
      if (!parsedUrl.hostname.includes("v0.dev")) {
        return {
          success: false,
          error: "URL must be from v0.dev",
        };
      }

      // Extract the component ID from URL
      const pathParts = parsedUrl.pathname.split("/");
      const componentId = pathParts[pathParts.length - 1];

      if (!componentId) {
        return {
          success: false,
          error: "Could not extract component ID from URL",
        };
      }

      // Method 1: Try v0's API endpoint (if available)
      const apiResult = await tryV0Api(componentId);
      if (apiResult.success) {
        return apiResult;
      }

      // Method 2: Try fetching the page and extracting code
      const scrapeResult = await tryScrapePage(url);
      if (scrapeResult.success) {
        return scrapeResult;
      }

      // Method 3: Use v0 CLI (requires server-side execution)
      const cliResult = await tryV0Cli(url);
      if (cliResult.success) {
        return cliResult;
      }

      return {
        success: false,
        error:
          "Could not fetch component. The v0 URL may be private or the component may no longer exist.",
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch v0 component: ${(error as Error).message}`,
      };
    }
  },
};

/**
 * Try fetching via v0's API (if they have a public one)
 */
async function tryV0Api(
  componentId: string
): Promise<AgentToolResult<FetchV0Output>> {
  try {
    // v0 doesn't have a documented public API, but we can try common patterns
    const apiUrls = [
      `https://v0.dev/api/components/${componentId}`,
      `https://v0.dev/api/chat/${componentId}/code`,
      `https://v0.dev/api/t/${componentId}`,
    ];

    for (const apiUrl of apiUrls) {
      try {
        const response = await fetch(apiUrl, {
          headers: {
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; PuckCMS/1.0)",
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.code || data.source || data.component) {
            return {
              success: true,
              data: {
                code: data.code || data.source || data.component,
                name: data.name,
                description: data.description,
                metadata: {
                  author: data.author,
                  createdAt: data.createdAt,
                  version: data.version,
                },
              },
            };
          }
        }
      } catch {
        // Try next URL
        continue;
      }
    }

    return { success: false, error: "API not available" };
  } catch {
    return { success: false, error: "API fetch failed" };
  }
}

/**
 * Try scraping the v0.dev page for code
 */
async function tryScrapePage(
  url: string
): Promise<AgentToolResult<FetchV0Output>> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return { success: false, error: `Page returned ${response.status}` };
    }

    const html = await response.text();

    // Look for code in various possible locations
    // v0 might embed code in script tags, data attributes, or specific elements

    // Pattern 1: Look for code in a script tag with JSON data
    const scriptMatch = html.match(
      /<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
    );
    if (scriptMatch) {
      try {
        const nextData = JSON.parse(scriptMatch[1]);
        // Navigate through Next.js data structure to find code
        const code = extractCodeFromNextData(nextData);
        if (code) {
          return {
            success: true,
            data: { code },
          };
        }
      } catch {
        // JSON parse failed, continue
      }
    }

    // Pattern 2: Look for code in pre/code tags
    const codeMatch = html.match(
      /<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/
    );
    if (codeMatch) {
      const code = decodeHtmlEntities(codeMatch[1]);
      if (code.includes("export") || code.includes("function")) {
        return {
          success: true,
          data: { code },
        };
      }
    }

    // Pattern 3: Look for data attribute with code
    const dataMatch = html.match(/data-code="([^"]+)"/);
    if (dataMatch) {
      const code = decodeURIComponent(dataMatch[1]);
      return {
        success: true,
        data: { code },
      };
    }

    return { success: false, error: "Could not extract code from page" };
  } catch (error) {
    return {
      success: false,
      error: `Page scrape failed: ${(error as Error).message}`,
    };
  }
}

/**
 * Try using v0 CLI (server-side only)
 */
async function tryV0Cli(
  url: string
): Promise<AgentToolResult<FetchV0Output>> {
  // This would require server-side execution with child_process
  // For now, return not available
  // In production, this could spawn: npx v0 add <url> --dry-run
  return {
    success: false,
    error: "CLI method not available in current environment",
  };
}

/**
 * Extract code from Next.js __NEXT_DATA__ structure
 */
function extractCodeFromNextData(data: Record<string, unknown>): string | null {
  // Recursively search for code-like content
  const search = (obj: unknown): string | null => {
    if (typeof obj === "string") {
      if (
        obj.includes("export default") ||
        obj.includes("export function") ||
        (obj.includes("function") && obj.includes("return"))
      ) {
        return obj;
      }
    }
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const result = search(item);
        if (result) return result;
      }
    }
    if (typeof obj === "object" && obj !== null) {
      for (const value of Object.values(obj)) {
        const result = search(value);
        if (result) return result;
      }
    }
    return null;
  };

  return search(data);
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

export default fetchV0Tool;
