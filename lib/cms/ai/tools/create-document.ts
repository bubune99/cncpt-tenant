/**
 * Create Document Tool
 *
 * Allows the AI to create new artifacts (text, code, spreadsheets).
 * Adapted from ChatSDK for Prisma/Stack Auth.
 */

import { tool, type UIMessageStreamWriter } from 'ai';
import { z } from 'zod';
import { generateId } from 'ai';
import { artifactKinds, documentHandlersByArtifactKind } from '../artifacts/server';
import type { ArtifactSession } from '../artifacts/types';

type CreateDocumentProps = {
  session: ArtifactSession;
  dataStream: UIMessageStreamWriter;
};

export const createDocument = ({ session, dataStream }: CreateDocumentProps) =>
  tool({
    description:
      'Create a document for writing or content creation activities. This tool will call other functions that will generate the contents of the document based on the title and kind.',
    inputSchema: z.object({
      title: z.string().describe('The title of the document to create'),
      kind: z.enum(artifactKinds).describe('The type of document: text, code, or sheet'),
    }),
    execute: async ({ title, kind }) => {
      const id = generateId();

      dataStream.write({
        type: 'data-kind',
        data: kind,
        transient: true,
      });

      dataStream.write({
        type: 'data-id',
        data: id,
        transient: true,
      });

      dataStream.write({
        type: 'data-title',
        data: title,
        transient: true,
      });

      dataStream.write({
        type: 'data-clear',
        data: null,
        transient: true,
      });

      const documentHandler = documentHandlersByArtifactKind.find(
        (handler) => handler.kind === kind
      );

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${kind}`);
      }

      await documentHandler.onCreateDocument({
        id,
        title,
        dataStream,
        session,
      });

      dataStream.write({ type: 'data-finish', data: null, transient: true });

      return {
        id,
        title,
        kind,
        content: 'A document was created and is now visible to the user.',
      };
    },
  });
