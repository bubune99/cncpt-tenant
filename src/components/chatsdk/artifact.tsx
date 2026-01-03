/**
 * Artifact Types and Definitions
 *
 * Defines the UIArtifact type and artifact kinds for the ChatSDK.
 * Adapted from ChatSDK for Prisma/Stack Auth.
 */

import type { ReactNode } from 'react';

export const artifactKinds = ['text', 'code', 'image', 'sheet'] as const;
export type ArtifactKind = (typeof artifactKinds)[number];

/**
 * Artifact action params for onClick and isDisabled handlers
 */
export type ArtifactActionParams = {
  content: string;
  handleVersionChange: (direction: 'prev' | 'next') => void;
  currentVersionIndex: number;
  isCurrentVersion: boolean;
  sendMessage: (message: string) => void;
  onSaveContent: (content: string) => void;
  [key: string]: unknown;
};

/**
 * Artifact action type
 */
export type ArtifactAction = {
  icon: ReactNode;
  label?: string;
  description: string;
  onClick: (params: ArtifactActionParams) => void;
  isDisabled?: (params: ArtifactActionParams) => boolean;
};

/**
 * Toolbar context type for onClick handlers
 */
export type ToolbarContext = {
  sendMessage: (message: { role: 'user'; parts: Array<{ type: 'text'; text: string }> }) => void;
};

/**
 * Toolbar item type
 */
export type ToolbarItem = {
  icon: ReactNode;
  description: string;
  onClick: (context: ToolbarContext) => void;
};

/**
 * Stream part for artifact updates
 */
export type StreamPart = {
  type: string;
  data?: unknown;
  [key: string]: unknown;
};

/**
 * Artifact definition type for handlers
 */
export type ArtifactDefinition = {
  kind: ArtifactKind;
  label?: string;
  description?: string;
  icon?: ReactNode;
  content?: React.ComponentType<unknown>;
  actions?: ArtifactAction[];
  toolbar?: ToolbarItem[];
  onStreamPart?: (params: {
    streamPart: StreamPart;
    setArtifact: (updater: (draft: UIArtifact) => UIArtifact) => void;
    setMetadata?: (updater: (metadata: unknown) => unknown) => void;
  }) => void;
  initialize?: (params: {
    documentId: string;
    setMetadata: (updater: (metadata: unknown) => unknown) => void;
  }) => void;
};

/**
 * Placeholder artifact definitions
 * These can be overridden by importing actual artifact handlers
 */
export const artifactDefinitions: ArtifactDefinition[] = [];

export type UIArtifact = {
  title: string;
  documentId: string;
  kind: ArtifactKind;
  content: string;
  isVisible: boolean;
  status: 'streaming' | 'idle';
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
};
