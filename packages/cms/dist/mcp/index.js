"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _chunkI5PINI5Tjs = require('../chunk-I5PINI5T.js');
require('../chunk-HY7GTCJM.js');

// src/lib/mcp/auth.ts
var _crypto = require('crypto'); var _crypto2 = _interopRequireDefault(_crypto);
var API_KEY_PREFIX = "cms_";
function generateApiKey() {
  const randomBytes = _crypto2.default.randomBytes(24);
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
  return _crypto2.default.createHash("sha256").update(key).digest("hex");
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
var _async_hooks = require('async_hooks');
var mcpContextStorage = new (0, _async_hooks.AsyncLocalStorage)();
async function validateMcpApiKey(apiKeyOrHeader) {
  const apiKey = extractApiKey(apiKeyOrHeader);
  if (!apiKey || !isValidApiKeyFormat(apiKey)) {
    return null;
  }
  const keyHash = hashApiKey(apiKey);
  try {
    const keyRecord = await _chunkI5PINI5Tjs.prisma.apiKey.findFirst({
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
    _chunkI5PINI5Tjs.prisma.apiKey.update({
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

























exports.API_KEY_PREFIX = API_KEY_PREFIX; exports.DEFAULT_LIMIT = DEFAULT_LIMIT; exports.MAX_LIMIT = MAX_LIMIT; exports.compactJson = compactJson; exports.extractApiKey = extractApiKey; exports.generateApiKey = generateApiKey; exports.getMcpContext = getMcpContext; exports.getMcpContextOrNull = getMcpContextOrNull; exports.getMcpServerStatus = getMcpServerStatus; exports.getMcpTools = getMcpTools; exports.getMcpUserId = getMcpUserId; exports.hasMcpScope = hasMcpScope; exports.hashApiKey = hashApiKey; exports.invalidateMcpServerCache = invalidateMcpServerCache; exports.isValidApiKeyFormat = isValidApiKeyFormat; exports.loadMcpConfig = loadMcpConfig; exports.mcpError = mcpError; exports.mcpResponse = mcpResponse; exports.normalizePagination = normalizePagination; exports.pickFields = pickFields; exports.requireMcpScope = requireMcpScope; exports.runWithMcpContext = runWithMcpContext; exports.truncate = truncate; exports.validateMcpApiKey = validateMcpApiKey;
//# sourceMappingURL=index.js.map