"use client";

import { ArrowDownIcon } from "lucide-react";
import type * as React from "react";
import type { ComponentProps } from "react";
import { useCallback } from "react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import type { StickToBottomProps } from "use-stick-to-bottom";
import { Button } from '../../ui/button';
import { cn } from '@/lib/cms/utils';

// use-stick-to-bottom's components return ReactNode, which @types/react@18
// rejects as a JSX component (React 19 types allow it). Re-type locally —
// zero runtime change.
const StickToBottomRoot = StickToBottom as unknown as React.FC<StickToBottomProps>;
const StickToBottomContent = StickToBottom.Content as unknown as React.FC<StickToBottom.ContentProps>;

export type ConversationProps = StickToBottomProps;

export const Conversation = ({ className, ...props }: ConversationProps) => (
  <StickToBottomRoot
    className={cn(
      "relative flex-1 touch-pan-y overflow-y-auto will-change-scroll",
      className
    )}
    initial="smooth"
    resize="smooth"
    role="log"
    {...props}
  />
);

export type ConversationContentProps = StickToBottom.ContentProps;

export const ConversationContent = ({
  className,
  ...props
}: ConversationContentProps) => (
  <StickToBottomContent className={cn("p-4", className)} {...props} />
);

export type ConversationScrollButtonProps = ComponentProps<typeof Button>;

export const ConversationScrollButton = ({
  className,
  ...props
}: ConversationScrollButtonProps) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  return (
    !isAtBottom && (
      <Button
        className={cn(
          "-translate-x-1/2 absolute bottom-4 left-1/2 z-10 rounded-full shadow-lg",
          className
        )}
        onClick={handleScrollToBottom}
        size="icon"
        type="button"
        variant="outline"
        {...props}
      >
        <ArrowDownIcon className="size-4" />
      </Button>
    )
  );
};
