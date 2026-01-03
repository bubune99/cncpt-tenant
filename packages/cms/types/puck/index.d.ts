/**
 * Puck editor components types
 */

import * as React from 'react';

export interface PuckConfig {
  components: Record<string, any>;
  categories?: Record<string, { components: string[] }>;
  root?: any;
}

export declare const blogConfig: PuckConfig;
export declare const pagesConfig: PuckConfig;
export declare const emailConfig: PuckConfig;

export declare function PuckEditor(props: {
  config: PuckConfig;
  data: any;
  onPublish: (data: any) => void;
}): React.JSX.Element;
