/**
 * MCP (Model Context Protocol) Client Integration
 *
 * Connects to MCP servers defined in .mcp.json AND database,
 * and converts their tools to Vercel AI SDK compatible format.
 *
 * Priority: Database configs override file configs with the same name.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { Tool as McpTool } from '@modelcontextprotocol/sdk/types.js';
import { tool, type Tool } from 'ai';
import { z, ZodTypeAny } from 'zod';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';

interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  source?: 'file' | 'database';
  displayName?: string;
  description?: string;
}

interface McpConfig {
  mcpServers: Record<string, McpServerConfig>;
}

// Cache for connected clients
const clientCache = new Map<string, Client>();

/**
 * Load MCP configuration from .mcp.json file
 */
async function loadMcpConfigFromFile(): Promise<McpConfig | null> {
  try {
    const configPath = join(process.cwd(), '.mcp.json');
    const configContent = await readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent) as McpConfig;

    // Mark all as file-sourced
    for (const name of Object.keys(config.mcpServers)) {
      config.mcpServers[name].source = 'file';
    }

    return config;
  } catch {
    // File doesn't exist or is invalid - that's okay
    return null;
  }
}

/**
 * Load MCP configuration from database
 */
async function loadMcpConfigFromDatabase(): Promise<McpConfig | null> {
  try {
    const servers = await prisma.mcpServer.findMany({
      where: { enabled: true },
    });

    if (servers.length === 0) {
      return null;
    }

    const mcpServers: Record<string, McpServerConfig> = {};

    for (const server of servers) {
      // Parse args from JSON
      const args = Array.isArray(server.args) ? (server.args as string[]) : [];

      // Merge plain env and encrypted env
      let env: Record<string, string> = {};

      // Plain env vars
      if (server.env && typeof server.env === 'object') {
        env = { ...env, ...(server.env as Record<string, string>) };
      }

      // Decrypt encrypted env vars
      if (server.envEncrypted) {
        try {
          const decrypted = decrypt(server.envEncrypted);
          const encryptedEnv = JSON.parse(decrypted) as Record<string, string>;
          env = { ...env, ...encryptedEnv };
        } catch (err) {
          console.warn(`[MCP] Failed to decrypt env for ${server.name}:`, err);
        }
      }

      mcpServers[server.name] = {
        command: server.command,
        args,
        env: Object.keys(env).length > 0 ? env : undefined,
        source: 'database',
        displayName: server.displayName || undefined,
        description: server.description || undefined,
      };
    }

    return { mcpServers };
  } catch (error) {
    console.warn('[MCP] Failed to load config from database:', error);
    return null;
  }
}

/**
 * Load and merge MCP configuration from both file and database
 * Database configs take priority over file configs with the same name
 */
export async function loadMcpConfig(): Promise<McpConfig | null> {
  const [fileConfig, dbConfig] = await Promise.all([
    loadMcpConfigFromFile(),
    loadMcpConfigFromDatabase(),
  ]);

  // If neither source has configs, return null
  if (!fileConfig && !dbConfig) {
    return null;
  }

  // Merge configs - database takes priority
  const mergedServers: Record<string, McpServerConfig> = {};

  // Add file configs first
  if (fileConfig) {
    for (const [name, config] of Object.entries(fileConfig.mcpServers)) {
      mergedServers[name] = config;
    }
  }

  // Override/add database configs
  if (dbConfig) {
    for (const [name, config] of Object.entries(dbConfig.mcpServers)) {
      mergedServers[name] = config;
    }
  }

  return { mcpServers: mergedServers };
}

/**
 * Filter environment variables to remove undefined values
 */
function cleanEnv(env: NodeJS.ProcessEnv): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Connect to an MCP server
 */
export async function connectToMcpServer(
  name: string,
  config: McpServerConfig
): Promise<Client | null> {
  // Check cache first
  if (clientCache.has(name)) {
    return clientCache.get(name)!;
  }

  try {
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args || [],
      env: {
        ...cleanEnv(process.env),
        ...config.env,
      },
    });

    const client = new Client({
      name: `nextjs-cms-${name}`,
      version: '1.0.0',
    });

    await client.connect(transport);

    // Cache the client
    clientCache.set(name, client);

    console.log(`[MCP] Connected to server: ${name} (source: ${config.source || 'unknown'})`);
    return client;
  } catch (error) {
    console.error(`[MCP] Failed to connect to server ${name}:`, error);
    return null;
  }
}

/**
 * Convert JSON Schema type to Zod schema
 */
function jsonSchemaToZod(schema?: McpTool['inputSchema']): ZodTypeAny {
  if (!schema || typeof schema !== 'object') {
    return z.object({});
  }

  const properties = (schema as Record<string, unknown>).properties as
    | Record<string, Record<string, unknown>>
    | undefined;
  const required = ((schema as Record<string, unknown>).required as string[]) || [];

  if (!properties) {
    return z.object({});
  }

  const shape: Record<string, ZodTypeAny> = {};

  for (const [key, prop] of Object.entries(properties)) {
    let zodType: ZodTypeAny;
    const propType = prop.type as string;
    const propEnum = prop.enum as string[] | undefined;
    const propItems = prop.items as { type: string } | undefined;
    const propDescription = prop.description as string | undefined;
    const propDefault = prop.default;

    switch (propType) {
      case 'string':
        if (propEnum && propEnum.length > 0) {
          zodType = z.enum(propEnum as [string, ...string[]]);
        } else {
          zodType = z.string();
        }
        break;
      case 'number':
      case 'integer':
        zodType = z.number();
        break;
      case 'boolean':
        zodType = z.boolean();
        break;
      case 'array':
        if (propItems?.type === 'string') {
          zodType = z.array(z.string());
        } else if (propItems?.type === 'number') {
          zodType = z.array(z.number());
        } else {
          zodType = z.array(z.unknown());
        }
        break;
      case 'object':
        zodType = z.record(z.string(), z.unknown());
        break;
      default:
        zodType = z.unknown();
    }

    // Add description if available
    if (propDescription) {
      zodType = zodType.describe(propDescription);
    }

    // Make optional if not required
    if (!required.includes(key)) {
      zodType = zodType.optional();
      if (propDefault !== undefined) {
        zodType = zodType.default(propDefault);
      }
    }

    shape[key] = zodType;
  }

  return z.object(shape);
}

/**
 * Convert an MCP tool to Vercel AI SDK tool format
 */
export function mcpToolToAiSdkTool(
  client: Client,
  serverName: string,
  mcpTool: McpTool
) {
  const parameters = jsonSchemaToZod(mcpTool.inputSchema) as z.ZodObject<Record<string, ZodTypeAny>>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return tool({
    description: mcpTool.description || `MCP tool: ${mcpTool.name}`,
    parameters,
    execute: async (args: Record<string, unknown>) => {
      try {
        const result = await client.callTool({
          name: mcpTool.name,
          arguments: args,
        });
        return {
          success: true,
          server: serverName,
          tool: mcpTool.name,
          result: result.content,
        };
      } catch (error) {
        console.error(`[MCP] Tool execution error (${mcpTool.name}):`, error);
        return {
          success: false,
          server: serverName,
          tool: mcpTool.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  } as any);
}

/**
 * Get all tools from connected MCP servers as AI SDK tools
 */
export async function getMcpTools(): Promise<Record<string, Tool>> {
  const config = await loadMcpConfig();
  if (!config) {
    return {};
  }

  const tools: Record<string, Tool> = {};

  for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
    const client = await connectToMcpServer(serverName, serverConfig);
    if (!client) {
      continue;
    }

    try {
      const { tools: mcpTools } = await client.listTools();

      for (const mcpTool of mcpTools) {
        // Create a unique tool name with server prefix
        const toolName = `mcp_${serverName}_${mcpTool.name}`;
        tools[toolName] = mcpToolToAiSdkTool(client, serverName, mcpTool);
      }

      console.log(
        `[MCP] Loaded ${mcpTools.length} tools from server: ${serverName}`
      );
    } catch (error) {
      console.error(`[MCP] Failed to list tools from ${serverName}:`, error);
    }
  }

  return tools;
}

/**
 * Disconnect all MCP clients
 */
export async function disconnectAllMcpClients(): Promise<void> {
  for (const [name, client] of clientCache.entries()) {
    try {
      await client.close();
      console.log(`[MCP] Disconnected from server: ${name}`);
    } catch (error) {
      console.error(`[MCP] Error disconnecting from ${name}:`, error);
    }
  }
  clientCache.clear();
}

/**
 * Invalidate cache for a specific server (useful when config changes)
 */
export async function invalidateMcpServerCache(serverName: string): Promise<void> {
  const client = clientCache.get(serverName);
  if (client) {
    try {
      await client.close();
    } catch {
      // Ignore close errors
    }
    clientCache.delete(serverName);
    console.log(`[MCP] Invalidated cache for server: ${serverName}`);
  }
}

/**
 * Get MCP server status with source information
 */
export async function getMcpServerStatus(): Promise<
  Array<{
    name: string;
    displayName?: string;
    description?: string;
    source: 'file' | 'database' | 'unknown';
    connected: boolean;
    toolCount: number;
    error?: string;
  }>
> {
  const config = await loadMcpConfig();
  if (!config) {
    return [];
  }

  const status: Array<{
    name: string;
    displayName?: string;
    description?: string;
    source: 'file' | 'database' | 'unknown';
    connected: boolean;
    toolCount: number;
    error?: string;
  }> = [];

  for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
    try {
      const client = await connectToMcpServer(serverName, serverConfig);
      if (client) {
        const { tools } = await client.listTools();
        status.push({
          name: serverName,
          displayName: serverConfig.displayName,
          description: serverConfig.description,
          source: serverConfig.source || 'unknown',
          connected: true,
          toolCount: tools.length,
        });
      } else {
        status.push({
          name: serverName,
          displayName: serverConfig.displayName,
          description: serverConfig.description,
          source: serverConfig.source || 'unknown',
          connected: false,
          toolCount: 0,
          error: 'Failed to connect',
        });
      }
    } catch (error) {
      status.push({
        name: serverName,
        displayName: serverConfig.displayName,
        description: serverConfig.description,
        source: serverConfig.source || 'unknown',
        connected: false,
        toolCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return status;
}
