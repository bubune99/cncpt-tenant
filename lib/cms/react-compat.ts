import type { ForwardRefExoticComponent, RefAttributes } from 'react';

/**
 * React 19 compatibility utilities.
 *
 * React 19's ComponentRef<T> and ComponentProps<T> require T to satisfy
 * ElementType, but ForwardRefExoticComponent doesn't meet that constraint.
 * These helpers extract types directly via conditional inference.
 */

/** Extract the ref element type (e.g. HTMLDivElement) from a ForwardRefExoticComponent. */
export type ForwardRefElement<T> = T extends ForwardRefExoticComponent<infer P>
  ? P extends RefAttributes<infer R>
    ? R
    : never
  : never;

/** Extract the props type (excluding ref) from a ForwardRefExoticComponent. */
export type ForwardRefProps<T> = T extends ForwardRefExoticComponent<infer P>
  ? Omit<P, keyof RefAttributes<unknown>>
  : never;
