/**
 * Update Document Tool
 *
 * Allows the AI to update existing artifacts.
 * Adapted from ChatSDK for Prisma/Stack Auth.
 */

import { tool, type UIMessageStreamWriter } from 'ai';
import { z } from 'zod';
import { getDocumentById, documentHandlersByArtifactKind } from '../artifacts/server';
import type { ArtifactSession } from '../artifacts/types';

type UpdateDocumentProps = {
  session: ArtifactSession;
  dataStream: UIMessageStreamWriter;
};

export const updateDocument = ({ session, dataStream }: UpdateDocumentProps) =>
  tool({
    description: 'Update a document with the given description of changes.',
    inputSchema: z.object({
      id: z.string().describe('The ID of the document to update'),
      description: z.string().describe('The description of changes that need to be made'),
    }),
    execute: async ({ id, description }) => {
      const document = await getDocumentById({ id });

      if (!document) {
        return {
          error: 'Document not found',
        };
      }

      dataStream.write({
        type: 'data-clear',
        data: null,
        transient: true,
      });

      const documentHandler = documentHandlersByArtifactKind.find(
        (handler) => handler.kind === document.kind
      );

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${document.kind}`);
      }

      await documentHandler.onUpdateDocument({
        document,
        description,
        dataStream,
        session,
      });

      dataStream.write({ type: 'data-finish', data: null, transient: true });

      return {
        id,
        title: document.title,
        kind: document.kind,
        content: 'The document has been updated successfully.',
      };
    },
  });
