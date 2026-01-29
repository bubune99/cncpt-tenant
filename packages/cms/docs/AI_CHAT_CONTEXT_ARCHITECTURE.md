# AI Chat Context & Help System Architecture

## Overview

This document outlines the comprehensive architecture for entity-based context awareness in the AI chat system, WebSocket integration using Socket.io, and enhancements to the help system for AI management.

---

## 1. Entity-Based Context System

### 1.1 Context Interface

```typescript
interface EntityContext {
  // Current location
  route: string                      // /admin/products/123
  section: string                    // 'products' | 'orders' | 'customers' | etc.

  // Entity information
  entityType: EntityType | null      // 'product' | 'order' | 'customer' | 'page' | 'blogPost'
  entityId: string | null

  // Nested context (for detail pages)
  parentContext?: {
    entityType: EntityType
    entityId: string
  }

  // UI state
  selectedIds?: string[]             // Multi-select in tables
  filters?: Record<string, any>      // Active filters
  searchQuery?: string               // Current search
  modalOpen?: string                 // Active modal ID

  // Metadata
  timestamp: number
  sessionId: string
}

type EntityType =
  | 'product'
  | 'order'
  | 'customer'
  | 'page'
  | 'blogPost'
  | 'workflow'
  | 'form'
  | 'media'
  | 'setting'
```

### 1.2 Context Flow

```
User navigates → Route parsed → EntityContext created
                                      ↓
                              WebSocket emits context
                                      ↓
                              Server stores in session
                                      ↓
                              AI chat receives context
                                      ↓
                              Tools can fetch entity details
```

---

## 2. Socket.io Integration

### 2.1 Events

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `context:update` | Client → Server | EntityContext | Navigation/state change |
| `help:element-click` | Client → Server | { helpKey, context } | Help mode interaction |
| `help:context-received` | Server → Client | { helpKey } | Acknowledge help click |
| `chat:context-request` | Server → Client | - | AI needs current context |
| `chat:context-response` | Client → Server | { context, lastHelpClick } | Respond with context |

### 2.2 Server Architecture

- Socket.io server initialized via Next.js instrumentation
- Optional Redis adapter for horizontal scaling
- Session data stored per socket connection
- Context persisted for AI chat access

---

## 3. Help System Enhancements

### 3.1 Enhanced Help Key Registry

New fields for AI guidance:

| Field | Type | Purpose |
|-------|------|---------|
| `aiGuidance` | string | Instructions for AI when writing help |
| `commonQuestions` | string[] | FAQs users ask about this element |
| `relatedKeys` | string[] | Connected help keys for context |
| `difficulty` | enum | basic / intermediate / advanced |
| `entityAware` | boolean | Can have entity-specific content |
| `suggestedFormat` | enum | brief / detailed / tutorial |
| `includeMedia` | boolean | Video/image would help |

### 3.2 New AI Tools

| Tool | Purpose |
|------|---------|
| `getHelpContent` | Read existing content before editing |
| `updateHelpContent` | Single-item update (more efficient than batch) |
| `getEntityDetails` | Fetch entity data for context-aware responses |
| `validateHelpContent` | Check quality and broken references |

---

## 4. Implementation Priority

### Phase 1: Foundation
1. Entity context types and interfaces
2. EntityContextProvider with route parsing
3. Socket.io server setup
4. Socket.io client provider

### Phase 2: AI Tools
1. getHelpContent tool
2. updateHelpContent tool
3. getEntityDetails tool
4. Enhanced help key registry

### Phase 3: Integration
1. Context-aware system prompt
2. Help mode → WebSocket integration
3. Chat route context handling
4. Migrate Puck AI chat

### Phase 4: Enhancement
1. Session caching (Redis)
2. Multi-step tool execution tracking
3. Help content validation
4. AI guidance in registry

---

## 5. Best Practices from LMS

### Adopted Patterns
1. **customBody in chat** - Pass context with every message
2. **Dynamic system prompt injection** - Build prompt based on context
3. **Session caching with Redis** - Fast access to conversation state
4. **Tool result caching** - For multi-step execution
5. **createUIMessageStream pattern** - Proper AI SDK v6 streaming
6. **Execution state tracking** - Track successful/failed tools

### Key Differences
1. **WebSocket for context** - Real-time sync vs HTTP
2. **Help mode integration** - Unique to CMS
3. **Entity-agnostic tools** - Generic entity fetching
4. **Help lifecycle management** - Orphan detection, archival

---

## 6. File Structure

```
src/
├── contexts/
│   ├── entity-context.tsx      # Entity context provider
│   └── socket-context.tsx      # Socket.io client provider
├── lib/
│   ├── socket/
│   │   ├── server.ts           # Socket.io server setup
│   │   ├── client.ts           # Client utilities
│   │   └── types.ts            # Socket event types
│   ├── ai/
│   │   ├── tools/
│   │   │   ├── help-management-tools.ts
│   │   │   ├── entity-tools.ts
│   │   │   └── index.ts
│   │   └── context.ts          # Context-aware prompt building
│   └── session/
│       └── cache.ts            # Redis session cache
├── components/
│   └── help-system/
│       ├── help-key-registry.ts
│       └── ...
└── app/
    └── api/
        ├── chat/route.ts
        ├── socket/route.ts
        └── puck/chat/route.ts
```
