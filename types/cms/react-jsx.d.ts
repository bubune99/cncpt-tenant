// Global type fix for React 19 JSX element compatibility
// React 19 has stricter JSX element type requirements that cause issues with
// ForwardRefExoticComponent used by many libraries (lucide-react, next/link, etc.)

// The core fix: make JSX.Element accept ReactElement return types
declare global {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Element extends React.ReactElement<any, any> {}
  }
}

// Fix for ForwardRefExoticComponent not being assignable to JSX element type
declare module 'react' {
  // Augment the JSX namespace within React module
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Element extends React.ReactElement<any, any> {}
  }
}

export {};
