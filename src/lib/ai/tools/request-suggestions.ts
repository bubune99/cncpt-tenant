/**
 * Request Suggestions Tool
 *
 * Allows the AI to generate suggestions for improving a document.
 * Adapted from ChatSDK for Prisma/Stack Auth.
 */

import { streamObject, tool, type UIMessageStreamWriter } from 'ai';
import { z } from 'zod';
import { generateId } from 'ai';
import { prisma } from '@/lib/db';
import { getDocumentById } from '../artifacts/server';
import { createModelFromSettings } from '../index';
import type { ArtifactSession } from '../artifacts/types';

type RequestSuggestionsProps = {
  session: ArtifactSession;
  dataStream: UIMessageStreamWriter;
};

export const requestSuggestions = ({ session, dataStream }: RequestSuggestionsProps) =>
  tool({
    description: 'Request suggestions for improving a document',
    inputSchema: z.object({
      documentId: z.string().describe('The ID of the document to request suggestions for'),
    }),
    execute: async ({ documentId }) => {
      const document = await getDocumentById({ id: documentId });

      if (!document || !document.content) {
        return {
          error: 'Document not found',
        };
      }

      const { model } = await createModelFromSettings();

      const suggestions: Array<{
        id: string;
        documentId: string;
        originalText: string;
        suggestedText: string;
        description: string;
        isResolved: boolean;
      }> = [];

      const { elementStream } = streamObject({
        model,
        system:
          'You are a helpful writing assistant. Given a piece of writing, please offer suggestions to improve it. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.',
        prompt: document.content,
        output: 'array',
        schema: z.object({
          originalSentence: z.string().describe('The original sentence'),
          suggestedSentence: z.string().describe('The suggested sentence'),
          description: z.string().describe('The description of the suggestion'),
        }),
      });

      for await (const element of elementStream) {
        const suggestion = {
          id: generateId(),
          documentId,
          originalText: element.originalSentence,
          suggestedText: element.suggestedSentence,
          description: element.description,
          isResolved: false,
        };

        dataStream.write({
          type: 'data-suggestion',
          data: suggestion,
          transient: true,
        });

        suggestions.push(suggestion);
      }

      // Save suggestions to database
      if (session.user?.id && suggestions.length > 0) {
        await prisma.aiSuggestion.createMany({
          data: suggestions.map((suggestion) => ({
            ...suggestion,
            userId: session.user.id,
            createdAt: new Date(),
            documentCreatedAt: document.createdAt,
          })),
        });
      }

      return {
        id: documentId,
        title: document.title,
        kind: document.kind,
        message: 'Suggestions have been added to the document',
      };
    },
  });
