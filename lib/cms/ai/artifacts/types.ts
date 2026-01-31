/**
 * Artifact Types
 *
 * Type definitions for the artifacts system.
 */

import type { UIMessageStreamWriter } from 'ai';

/**
 * Supported artifact kinds
 */
export const artifactKinds = ['text', 'code', 'sheet'] as const;
export type ArtifactKind = (typeof artifactKinds)[number];

/**
 * Artifact document stored in the database
 */
export interface ArtifactDocument {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User session type for Stack Auth
 */
export interface ArtifactSession {
  user: {
    id: string;
    email?: string;
    name?: string;
  };
}

/**
 * Props for creating a document
 */
export interface CreateDocumentCallbackProps {
  id: string;
  title: string;
  dataStream: UIMessageStreamWriter;
  session: ArtifactSession;
}

/**
 * Props for updating a document
 */
export interface UpdateDocumentCallbackProps {
  document: ArtifactDocument;
  description: string;
  dataStream: UIMessageStreamWriter;
  session: ArtifactSession;
}

/**
 * Document handler interface
 */
export interface DocumentHandler<T = ArtifactKind> {
  kind: T;
  onCreateDocument: (args: CreateDocumentCallbackProps) => Promise<void>;
  onUpdateDocument: (args: UpdateDocumentCallbackProps) => Promise<void>;
}
