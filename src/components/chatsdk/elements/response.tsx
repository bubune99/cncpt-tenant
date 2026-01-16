"use client";

import { type ComponentProps, memo } from "react";
import { Streamdown } from "streamdown";
import { cn } from '../../../lib/utils';

type ResponseProps = ComponentProps<typeof Streamdown> & {
  isStreaming?: boolean;
};

// Animated streaming cursor
const StreamingCursor = memo(() => (
  <span
    className="inline-block w-[2px] h-[1.1em] bg-primary ml-0.5 align-text-bottom animate-pulse"
    style={{
      animation: "cursor-blink 1s ease-in-out infinite",
    }}
  />
));
StreamingCursor.displayName = "StreamingCursor";

export const Response = memo(
  ({ className, isStreaming, children, ...props }: ResponseProps) => (
    <span className="relative">
      <Streamdown
        className={cn(
          "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:whitespace-pre-wrap [&_code]:break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto",
          className
        )}
        {...props}
      >
        {children}
      </Streamdown>
      {isStreaming && <StreamingCursor />}
    </span>
  ),
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.isStreaming === nextProps.isStreaming
);

Response.displayName = "Response";
