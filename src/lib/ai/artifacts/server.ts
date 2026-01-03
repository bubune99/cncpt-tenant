/**
 * Artifacts Server
 *
 * Server-side document handling for AI-generated artifacts.
 * Adapted from ChatSDK for Prisma.
 */

import { prisma } from '@/lib/db';
import { generateText, streamText } from 'ai';
import { createModelFromSettings } from '../index';
import { codePrompt, sheetPrompt, updateDocumentPrompt } from '../prompts';
import type {
  ArtifactDocument,
  ArtifactKind,
  CreateDocumentCallbackProps,
  DocumentHandler,
  UpdateDocumentCallbackProps,
} from './types';

export { artifactKinds } from './types';
export type { ArtifactKind } from './types';

/**
 * Save a document to the database
 */
export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}): Promise<void> {
  await prisma.aiDocument.upsert({
    where: { id },
    update: {
      title,
      content,
      updatedAt: new Date(),
    },
    create: {
      id,
      title,
      kind,
      content,
      userId,
    },
  });
}

/**
 * Get a document by ID
 */
export async function getDocumentById({
  id,
}: {
  id: string;
}): Promise<ArtifactDocument | null> {
  const doc = await prisma.aiDocument.findUnique({
    where: { id },
  });

  if (!doc) return null;

  return {
    id: doc.id,
    title: doc.title,
    kind: doc.kind as ArtifactKind,
    content: doc.content ?? '',
    userId: doc.userId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Create a document handler factory
 */
export function createDocumentHandler<T extends ArtifactKind>(config: {
  kind: T;
  onCreateDocument: (params: CreateDocumentCallbackProps) => Promise<string>;
  onUpdateDocument: (params: UpdateDocumentCallbackProps) => Promise<string>;
}): DocumentHandler<T> {
  return {
    kind: config.kind,
    onCreateDocument: async (args: CreateDocumentCallbackProps) => {
      const draftContent = await config.onCreateDocument({
        id: args.id,
        title: args.title,
        dataStream: args.dataStream,
        session: args.session,
      });

      if (args.session?.user?.id) {
        await saveDocument({
          id: args.id,
          title: args.title,
          content: draftContent,
          kind: config.kind,
          userId: args.session.user.id,
        });
      }
    },
    onUpdateDocument: async (args: UpdateDocumentCallbackProps) => {
      const draftContent = await config.onUpdateDocument({
        document: args.document,
        description: args.description,
        dataStream: args.dataStream,
        session: args.session,
      });

      if (args.session?.user?.id) {
        await saveDocument({
          id: args.document.id,
          title: args.document.title,
          content: draftContent,
          kind: config.kind,
          userId: args.session.user.id,
        });
      }
    },
  };
}

/**
 * Text document handler
 */
export const textDocumentHandler = createDocumentHandler({
  kind: 'text',
  onCreateDocument: async ({ title, dataStream }) => {
    const { model } = await createModelFromSettings();

    let draftContent = '';

    const { textStream } = streamText({
      model,
      system: 'Write about the given topic. Be concise and informative.',
      prompt: title,
    });

    for await (const chunk of textStream) {
      draftContent += chunk;
      dataStream.write({
        type: 'data-text-delta',
        data: chunk,
        transient: true,
      });
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    const { model } = await createModelFromSettings();

    let draftContent = '';

    const { textStream } = streamText({
      model,
      system: updateDocumentPrompt(document.content, 'text'),
      prompt: description,
    });

    for await (const chunk of textStream) {
      draftContent += chunk;
      dataStream.write({
        type: 'data-text-delta',
        data: chunk,
        transient: true,
      });
    }

    return draftContent;
  },
});

/**
 * Code document handler
 */
export const codeDocumentHandler = createDocumentHandler({
  kind: 'code',
  onCreateDocument: async ({ title, dataStream }) => {
    const { model } = await createModelFromSettings();

    let draftContent = '';

    const { textStream } = streamText({
      model,
      system: codePrompt,
      prompt: title,
    });

    for await (const chunk of textStream) {
      draftContent += chunk;
      dataStream.write({
        type: 'data-text-delta',
        data: chunk,
        transient: true,
      });
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    const { model } = await createModelFromSettings();

    let draftContent = '';

    const { textStream } = streamText({
      model,
      system: updateDocumentPrompt(document.content, 'code'),
      prompt: description,
    });

    for await (const chunk of textStream) {
      draftContent += chunk;
      dataStream.write({
        type: 'data-text-delta',
        data: chunk,
        transient: true,
      });
    }

    return draftContent;
  },
});

/**
 * Sheet/CSV document handler
 */
export const sheetDocumentHandler = createDocumentHandler({
  kind: 'sheet',
  onCreateDocument: async ({ title, dataStream }) => {
    const { model } = await createModelFromSettings();

    const { text } = await generateText({
      model,
      system: sheetPrompt,
      prompt: title,
    });

    dataStream.write({
      type: 'data-sheet',
      data: text,
      transient: true,
    });

    return text;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    const { model } = await createModelFromSettings();

    const { text } = await generateText({
      model,
      system: updateDocumentPrompt(document.content, 'sheet'),
      prompt: description,
    });

    dataStream.write({
      type: 'data-sheet',
      data: text,
      transient: true,
    });

    return text;
  },
});

/**
 * All document handlers by artifact kind
 */
export const documentHandlersByArtifactKind: DocumentHandler[] = [
  textDocumentHandler,
  codeDocumentHandler,
  sheetDocumentHandler,
];
