/**
 * Scoped Prisma Client - Row-Level Security at the application layer
 *
 * Creates a Prisma client extension that automatically injects userId filters
 * on user-scoped models. This provides user-level data isolation: users see
 * only their own conversations, documents, notifications, API keys, etc.
 *
 * Two scoping modes:
 * - USER_SCOPED: Full isolation — all reads and writes scoped to the user
 * - WRITE_SCOPED: Read-all, write-own — public reads but writes scoped to the user
 */

import { prisma } from './index';

// Field name mapping: some models use non-standard field names for the user FK
const USER_FIELD_MAP: Record<string, string> = {
  Media: 'uploadedById',
  PageTemplate: 'createdById',
  BlogPost: 'authorId',
};

function getUserField(model: string): string {
  return USER_FIELD_MAP[model] || 'userId';
}

// Models that should be fully scoped by userId (all operations)
const USER_SCOPED_MODELS = new Set([
  'AiConversation',
  'AiDocument',
  'Notification',
  'ApiKey',
  'Media',
  'Address',
]);

// Models with read-all but write-own semantics
const WRITE_SCOPED_MODELS = new Set([
  'BlogPost',
  'BlogComment',
  'PageTemplate',
]);

const READ_OPERATIONS = new Set([
  'findMany',
  'findFirst',
  'findUnique',
  'count',
  'aggregate',
  'groupBy',
]);

const CREATE_OPERATIONS = new Set([
  'create',
  'createMany',
]);

const MUTATE_OPERATIONS = new Set([
  'update',
  'updateMany',
  'delete',
  'deleteMany',
  'upsert',
]);

export function createScopedClient(userId: string) {
  return prisma.$extends({
    query: {
      $allOperations({ model, operation, args, query }) {
        if (!model) return query(args);

        const userField = getUserField(model);

        // Full isolation — all operations scoped to user
        if (USER_SCOPED_MODELS.has(model)) {
          if (READ_OPERATIONS.has(operation)) {
            args.where = { ...args.where, [userField]: userId };
          }
          if (CREATE_OPERATIONS.has(operation)) {
            if (Array.isArray(args.data)) {
              args.data = args.data.map((d: Record<string, unknown>) => ({
                ...d,
                [userField]: userId,
              }));
            } else {
              args.data = { ...args.data, [userField]: userId };
            }
          }
          if (MUTATE_OPERATIONS.has(operation)) {
            args.where = { ...args.where, [userField]: userId };
            if (operation === 'upsert' && args.create) {
              args.create = { ...args.create, [userField]: userId };
            }
          }
        }

        // Write-only scoping (reads are public, writes scoped to user)
        if (WRITE_SCOPED_MODELS.has(model)) {
          if (MUTATE_OPERATIONS.has(operation)) {
            args.where = { ...args.where, [userField]: userId };
            if (operation === 'upsert' && args.create) {
              args.create = { ...args.create, [userField]: userId };
            }
          }
          if (CREATE_OPERATIONS.has(operation)) {
            if (Array.isArray(args.data)) {
              args.data = args.data.map((d: Record<string, unknown>) => ({
                ...d,
                [userField]: userId,
              }));
            } else {
              args.data = { ...args.data, [userField]: userId };
            }
          }
        }

        return query(args);
      },
    },
  });
}
