import {
  prisma
} from "../chunk-BY6YNCHO.mjs";
import "../chunk-C2QMXRW7.mjs";

// src/lib/mcp/auth.ts
import crypto from "crypto";
var API_KEY_PREFIX = "cms_";
function generateApiKey() {
  const randomBytes = crypto.randomBytes(24);
  const keyBody = randomBytes.toString("base64url").replace(
    /[+/=]/g,
    (c) => c === "+" ? "-" : c === "/" ? "_" : ""
  );
  const key = `${API_KEY_PREFIX}${keyBody}`;
  const hash = hashApiKey(key);
  const prefix = key.substring(0, 8);
  return { key, hash, prefix };
}
function hashApiKey(key) {
  return crypto.createHash("sha256").update(key).digest("hex");
}
function isValidApiKeyFormat(key) {
  if (!key.startsWith(API_KEY_PREFIX)) {
    return false;
  }
  if (key.length < 36) {
    return false;
  }
  return true;
}
function extractApiKey(authHeader) {
  if (!authHeader) return null;
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim();
  }
  if (authHeader.startsWith(API_KEY_PREFIX)) {
    return authHeader.trim();
  }
  return null;
}

// src/lib/mcp/context.ts
import { AsyncLocalStorage } from "async_hooks";
var mcpContextStorage = new AsyncLocalStorage();
async function validateMcpApiKey(apiKeyOrHeader) {
  const apiKey = extractApiKey(apiKeyOrHeader);
  if (!apiKey || !isValidApiKeyFormat(apiKey)) {
    return null;
  }
  const keyHash = hashApiKey(apiKey);
  try {
    const keyRecord = await prisma.apiKey.findFirst({
      where: {
        keyHash,
        revokedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: /* @__PURE__ */ new Date() } }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });
    if (!keyRecord) {
      return null;
    }
    prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: /* @__PURE__ */ new Date() }
    }).catch(
      (err) => console.error("Failed to update MCP API key last_used_at:", err)
    );
    return {
      userId: keyRecord.userId,
      apiKeyId: keyRecord.id,
      scopes: keyRecord.scopes || ["read", "write"],
      email: keyRecord.user.email
    };
  } catch (error) {
    console.error("MCP API key validation error:", error);
    return null;
  }
}
function runWithMcpContext(context, fn) {
  return mcpContextStorage.run(context, fn);
}
function getMcpContext() {
  const context = mcpContextStorage.getStore();
  if (!context) {
    throw new Error("MCP context not available - called outside of MCP request");
  }
  return context;
}
function getMcpContextOrNull() {
  return mcpContextStorage.getStore() || null;
}
function getMcpUserId() {
  return getMcpContext().userId;
}
function hasMcpScope(scope) {
  const context = getMcpContextOrNull();
  if (!context) return false;
  return context.scopes.includes(scope);
}
function requireMcpScope(scope) {
  if (!hasMcpScope(scope)) {
    throw new Error(`MCP operation requires '${scope}' scope`);
  }
}

// src/lib/mcp/utils.ts
function compactJson(data) {
  return JSON.stringify(data);
}
function truncate(str, maxLength) {
  if (!str) return null;
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
}
function pickFields(obj, fields) {
  const result = {};
  for (const field of fields) {
    if (field in obj) {
      result[field] = obj[field];
    }
  }
  return result;
}
function mcpResponse(data) {
  return {
    content: [{ type: "text", text: compactJson(data) }]
  };
}
function mcpError(message) {
  return {
    content: [{ type: "text", text: compactJson({ error: message }) }]
  };
}
var DEFAULT_LIMIT = 20;
var MAX_LIMIT = 100;
function normalizePagination(limit, offset) {
  return {
    limit: Math.min(limit || DEFAULT_LIMIT, MAX_LIMIT),
    offset: offset || 0
  };
}

// src/lib/mcp/index.ts
async function loadMcpConfig() {
  return null;
}
async function getMcpServerStatus() {
  return [];
}
async function getMcpTools() {
  return {};
}
async function invalidateMcpServerCache(_serverName) {
  return;
}
export {
  API_KEY_PREFIX,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  compactJson,
  extractApiKey,
  generateApiKey,
  getMcpContext,
  getMcpContextOrNull,
  getMcpServerStatus,
  getMcpTools,
  getMcpUserId,
  hasMcpScope,
  hashApiKey,
  invalidateMcpServerCache,
  isValidApiKeyFormat,
  loadMcpConfig,
  mcpError,
  mcpResponse,
  normalizePagination,
  pickFields,
  requireMcpScope,
  runWithMcpContext,
  truncate,
  validateMcpApiKey
};
//# sourceMappingURL=index.mjs.map