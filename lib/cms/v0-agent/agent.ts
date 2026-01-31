/**
 * v0 Import Agent
 *
 * Uses Claude to intelligently convert v0.dev components
 * into Puck templates.
 *
 * Supports both official Anthropic SDK and Vercel AI SDK.
 */

import { V0_IMPORT_SYSTEM_PROMPT, V0_IMPORT_EXAMPLES } from "./prompts/system";
import { fetchV0Tool } from "./tools/fetch-v0";
import { listPrimitivesTool, getPrimitiveTool } from "./tools/primitives";
import { uploadAssetTool, uploadMultipleAssetsTool } from "./tools/upload-asset";
import { saveTemplateTool, updateTemplateTool } from "./tools/save-template";
import { validateTemplateTool, suggestMappingTool } from "./tools/validate";
import {
  V0ImportRequest,
  V0ImportResult,
  PuckTemplate,
  AgentToolResult,
} from "./types";

// Dynamic import for Anthropic SDK
type AnthropicClient = {
  messages: {
    create: (params: AnthropicCreateParams) => Promise<AnthropicResponse>;
  };
};

interface AnthropicCreateParams {
  model: string;
  max_tokens: number;
  system: string;
  tools: AnthropicTool[];
  messages: AnthropicMessage[];
}

interface AnthropicTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

interface AnthropicMessage {
  role: "user" | "assistant";
  content: AnthropicContent[] | string;
}

interface AnthropicContent {
  type: "text" | "tool_use" | "tool_result";
  text?: string;
  id?: string;
  name?: string;
  input?: unknown;
  tool_use_id?: string;
  content?: string;
}

interface AnthropicResponse {
  content: AnthropicContent[];
  stop_reason: "end_turn" | "tool_use" | "max_tokens";
}

// Tool definitions for Claude
const tools: AnthropicTool[] = [
  {
    name: fetchV0Tool.name,
    description: fetchV0Tool.description,
    input_schema: fetchV0Tool.inputSchema as Record<string, unknown>,
  },
  {
    name: listPrimitivesTool.name,
    description: listPrimitivesTool.description,
    input_schema: listPrimitivesTool.inputSchema as Record<string, unknown>,
  },
  {
    name: getPrimitiveTool.name,
    description: getPrimitiveTool.description,
    input_schema: getPrimitiveTool.inputSchema as Record<string, unknown>,
  },
  {
    name: uploadAssetTool.name,
    description: uploadAssetTool.description,
    input_schema: uploadAssetTool.inputSchema as Record<string, unknown>,
  },
  {
    name: uploadMultipleAssetsTool.name,
    description: uploadMultipleAssetsTool.description,
    input_schema: uploadMultipleAssetsTool.inputSchema as Record<string, unknown>,
  },
  {
    name: saveTemplateTool.name,
    description: saveTemplateTool.description,
    input_schema: saveTemplateTool.inputSchema as Record<string, unknown>,
  },
  {
    name: updateTemplateTool.name,
    description: updateTemplateTool.description,
    input_schema: updateTemplateTool.inputSchema as Record<string, unknown>,
  },
  {
    name: validateTemplateTool.name,
    description: validateTemplateTool.description,
    input_schema: validateTemplateTool.inputSchema as Record<string, unknown>,
  },
  {
    name: suggestMappingTool.name,
    description: suggestMappingTool.description,
    input_schema: suggestMappingTool.inputSchema as Record<string, unknown>,
  },
];

// Tool executor map
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toolExecutors: Record<string, (input: any) => Promise<AgentToolResult>> = {
  [fetchV0Tool.name]: fetchV0Tool.execute,
  [listPrimitivesTool.name]: listPrimitivesTool.execute,
  [getPrimitiveTool.name]: getPrimitiveTool.execute,
  [uploadAssetTool.name]: uploadAssetTool.execute,
  [uploadMultipleAssetsTool.name]: uploadMultipleAssetsTool.execute,
  [saveTemplateTool.name]: saveTemplateTool.execute,
  [updateTemplateTool.name]: updateTemplateTool.execute,
  [validateTemplateTool.name]: validateTemplateTool.execute,
  [suggestMappingTool.name]: suggestMappingTool.execute,
};

export interface V0ImportAgentConfig {
  apiKey?: string;
  model?: string;
  maxIterations?: number;
  verbose?: boolean;
}

/**
 * Load Anthropic SDK dynamically
 * Uses Function constructor to avoid TypeScript static analysis errors
 */
async function loadAnthropicClient(apiKey?: string): Promise<AnthropicClient> {
  try {
    // Use Function constructor to dynamically import without TypeScript checking
    const importFn = new Function("moduleName", "return import(moduleName)");
    const module = await importFn("@anthropic-ai/sdk");
    const Anthropic = module.default || module.Anthropic;

    if (!Anthropic) {
      throw new Error("Could not find Anthropic constructor in module");
    }

    return new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    }) as unknown as AnthropicClient;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(
      `Anthropic SDK not available: ${message}. Run: npm install @anthropic-ai/sdk`
    );
  }
}

export class V0ImportAgent {
  private client: AnthropicClient | null = null;
  private apiKey?: string;
  private model: string;
  private maxIterations: number;
  private verbose: boolean;

  constructor(config: V0ImportAgentConfig = {}) {
    this.apiKey = config.apiKey;
    this.model = config.model || "claude-sonnet-4-20250514";
    this.maxIterations = config.maxIterations || 20;
    this.verbose = config.verbose || false;
  }

  /**
   * Ensure client is initialized
   */
  private async ensureClient(): Promise<AnthropicClient> {
    if (!this.client) {
      this.client = await loadAnthropicClient(this.apiKey);
    }
    return this.client;
  }

  /**
   * Import a v0 component and convert it to a Puck template
   */
  async importComponent(request: V0ImportRequest): Promise<V0ImportResult> {
    const client = await this.ensureClient();

    const messages: AnthropicMessage[] = [
      {
        role: "user",
        content: this.buildUserPrompt(request),
      },
    ];

    let iterations = 0;
    let finalResult: V0ImportResult | null = null;

    while (iterations < this.maxIterations) {
      iterations++;

      if (this.verbose) {
        console.log(`[V0Agent] Iteration ${iterations}`);
      }

      const response = await client.messages.create({
        model: this.model,
        max_tokens: 8192,
        system: V0_IMPORT_SYSTEM_PROMPT + "\n\n" + V0_IMPORT_EXAMPLES,
        tools,
        messages,
      });

      // Process the response
      const assistantContent: AnthropicContent[] = [];
      const toolResults: AnthropicContent[] = [];

      for (const block of response.content) {
        assistantContent.push(block);

        if (block.type === "tool_use") {
          if (this.verbose) {
            console.log(`[V0Agent] Tool call: ${block.name}`);
          }

          const executor = toolExecutors[block.name!];
          if (!executor) {
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify({ success: false, error: `Unknown tool: ${block.name}` }),
            });
            continue;
          }

          try {
            const result = await executor(block.input);
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify(result),
            });

            // Check if this was a save_puck_template call
            if (block.name === "save_puck_template" && result.success) {
              finalResult = {
                success: true,
                template: result.data as unknown as PuckTemplate,
              };
            }
          } catch (error) {
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify({
                success: false,
                error: (error as Error).message,
              }),
            });
          }
        }

        if (block.type === "text" && this.verbose) {
          console.log(`[V0Agent] ${block.text?.substring(0, 200)}...`);
        }
      }

      // Add assistant message
      messages.push({
        role: "assistant",
        content: assistantContent,
      });

      // If there were tool calls, add results and continue
      if (toolResults.length > 0) {
        messages.push({
          role: "user",
          content: toolResults,
        });
      }

      // Check if we're done
      if (response.stop_reason === "end_turn") {
        if (finalResult) {
          return finalResult;
        }

        // Agent finished without saving - extract any errors from the conversation
        const lastAssistantMessage = response.content.find(
          (block: AnthropicContent) => block.type === "text"
        );
        return {
          success: false,
          errors: [
            lastAssistantMessage?.type === "text"
              ? lastAssistantMessage.text || "Agent finished without creating a template"
              : "Agent finished without creating a template",
          ],
        };
      }
    }

    return {
      success: false,
      errors: [`Max iterations (${this.maxIterations}) reached without completing import`],
    };
  }

  /**
   * Build the user prompt for the import request
   */
  private buildUserPrompt(request: V0ImportRequest): string {
    let prompt = `Import this v0.dev component and convert it to a Puck template.\n\n`;

    prompt += `**v0 URL:** ${request.url}\n\n`;

    if (request.name) {
      prompt += `**Preferred Name:** ${request.name}\n`;
    }

    if (request.category) {
      prompt += `**Category:** ${request.category}\n`;
    }

    if (request.description) {
      prompt += `**Description:** ${request.description}\n`;
    }

    prompt += `\n## Instructions\n`;
    prompt += `1. First, fetch the component code using the fetch_v0_component tool\n`;
    prompt += `2. List available primitives to understand your options\n`;
    prompt += `3. Analyze the component and plan the conversion\n`;
    prompt += `4. Upload any images/assets found\n`;
    prompt += `5. Build the component tree mapping JSX to primitives\n`;
    prompt += `6. Validate the result\n`;
    prompt += `7. Save the template\n`;

    return prompt;
  }

  /**
   * Import from raw code instead of URL
   */
  async importFromCode(
    code: string,
    options: Omit<V0ImportRequest, "url"> = {}
  ): Promise<V0ImportResult> {
    const client = await this.ensureClient();

    const messages: AnthropicMessage[] = [
      {
        role: "user",
        content: this.buildCodePrompt(code, options),
      },
    ];

    let iterations = 0;
    let finalResult: V0ImportResult | null = null;

    while (iterations < this.maxIterations) {
      iterations++;

      if (this.verbose) {
        console.log(`[V0Agent] Iteration ${iterations}`);
      }

      const response = await client.messages.create({
        model: this.model,
        max_tokens: 8192,
        system: V0_IMPORT_SYSTEM_PROMPT + "\n\n" + V0_IMPORT_EXAMPLES,
        tools,
        messages,
      });

      const assistantContent: AnthropicContent[] = [];
      const toolResults: AnthropicContent[] = [];

      for (const block of response.content) {
        assistantContent.push(block);

        if (block.type === "tool_use") {
          if (this.verbose) {
            console.log(`[V0Agent] Tool call: ${block.name}`);
          }

          // Skip fetch tool for code-based import
          if (block.name === "fetch_v0_component") {
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify({
                success: true,
                data: { code, name: options.name },
              }),
            });
            continue;
          }

          const executor = toolExecutors[block.name!];
          if (!executor) {
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify({ success: false, error: `Unknown tool: ${block.name}` }),
            });
            continue;
          }

          try {
            const result = await executor(block.input);
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify(result),
            });

            if (block.name === "save_puck_template" && result.success) {
              finalResult = {
                success: true,
                template: result.data as unknown as PuckTemplate,
              };
            }
          } catch (error) {
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify({
                success: false,
                error: (error as Error).message,
              }),
            });
          }
        }
      }

      messages.push({
        role: "assistant",
        content: assistantContent,
      });

      if (toolResults.length > 0) {
        messages.push({
          role: "user",
          content: toolResults,
        });
      }

      if (response.stop_reason === "end_turn") {
        if (finalResult) {
          return finalResult;
        }

        const lastAssistantMessage = response.content.find(
          (block: AnthropicContent) => block.type === "text"
        );
        return {
          success: false,
          errors: [
            lastAssistantMessage?.type === "text"
              ? lastAssistantMessage.text || "Agent finished without creating a template"
              : "Agent finished without creating a template",
          ],
        };
      }
    }

    return {
      success: false,
      errors: [`Max iterations (${this.maxIterations}) reached without completing import`],
    };
  }

  private buildCodePrompt(
    code: string,
    options: Omit<V0ImportRequest, "url">
  ): string {
    let prompt = `Convert this React component code to a Puck template.\n\n`;

    prompt += `**Component Code:**\n\`\`\`tsx\n${code}\n\`\`\`\n\n`;

    if (options.name) {
      prompt += `**Preferred Name:** ${options.name}\n`;
    }

    if (options.category) {
      prompt += `**Category:** ${options.category}\n`;
    }

    if (options.description) {
      prompt += `**Description:** ${options.description}\n`;
    }

    prompt += `\n## Instructions\n`;
    prompt += `1. List available primitives to understand your options\n`;
    prompt += `2. Analyze the component structure\n`;
    prompt += `3. Upload any images/assets found in the code\n`;
    prompt += `4. Build the component tree mapping JSX to primitives\n`;
    prompt += `5. Validate the result\n`;
    prompt += `6. Save the template\n`;

    return prompt;
  }
}

// Export singleton instance
let defaultAgent: V0ImportAgent | null = null;

export function getV0ImportAgent(config?: V0ImportAgentConfig): V0ImportAgent {
  if (!defaultAgent || config) {
    defaultAgent = new V0ImportAgent(config);
  }
  return defaultAgent;
}

export default V0ImportAgent;
