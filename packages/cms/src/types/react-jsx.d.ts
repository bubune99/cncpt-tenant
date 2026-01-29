// Global type fix for React 19 JSX element compatibility
// React 19 has stricter JSX element type requirements that cause issues with
// ForwardRefExoticComponent used by many libraries (lucide-react, next/link, etc.)

import type { ReactElement, JSXElementConstructor } from 'react';

// Override the JSX.Element type to be more permissive
declare global {
  namespace JSX {
    interface Element extends ReactElement<any, any> {}
  }
}

// Fix for ForwardRefExoticComponent not being assignable to JSX element type
// This is a known issue with React 19's stricter types
declare module 'react' {
  interface FunctionComponent<P = {}> {
    (props: P): ReactElement<any, any> | null;
  }
}

export {};
