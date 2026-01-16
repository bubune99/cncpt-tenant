"use client";

import type { ToolUIPart } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  WrenchIcon,
  XCircleIcon,
  Loader2Icon,
  SparklesIcon,
} from "lucide-react";
import type React from "react";
import type { ComponentProps, ReactNode } from "react";
import { Badge } from '../../ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../ui/collapsible';
import { cn } from '../../../lib/utils';
import { CodeBlock } from "./code-block";

export type ToolProps = ComponentProps<typeof Collapsible> & {
  isExecuting?: boolean;
};

export const Tool = ({ className, isExecuting, ...props }: ToolProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
  >
    <Collapsible
      className={cn(
        "not-prose mb-4 w-full rounded-xl border overflow-hidden",
        "bg-gradient-to-b from-muted/30 to-muted/10",
        "backdrop-blur-sm shadow-sm",
        "transition-all duration-300",
        "hover:shadow-md hover:border-border/80",
        isExecuting && "border-primary/30 shadow-primary/5",
        className
      )}
      {...props}
    />
  </motion.div>
);

export type ToolHeaderProps = {
  type: ToolUIPart["type"];
  state: ToolUIPart["state"];
  className?: string;
};

const getStatusBadge = (status: ToolUIPart["state"]) => {
  const labels: Record<ToolUIPart["state"], string> = {
    "input-streaming": "Preparing",
    "input-available": "Running",
    "approval-requested": "Waiting",
    "approval-responded": "Approved",
    "output-available": "Done",
    "output-error": "Failed",
    "output-denied": "Denied",
  };

  const isRunning = status === "input-available" || status === "input-streaming";
  const isSuccess = status === "output-available" || status === "approval-responded";
  const isError = status === "output-error" || status === "output-denied";
  const isWaiting = status === "approval-requested";

  const getIcon = () => {
    if (isRunning) {
      return <Loader2Icon className="size-3.5 animate-spin" />;
    }
    if (isSuccess) {
      return <CheckCircleIcon className="size-3.5" />;
    }
    if (isError) {
      return <XCircleIcon className="size-3.5" />;
    }
    if (isWaiting) {
      return <ClockIcon className="size-3.5 animate-pulse" />;
    }
    return <CircleIcon className="size-3.5" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Badge
        className={cn(
          "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
          "transition-all duration-300",
          isRunning && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse",
          isSuccess && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
          isError && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
          isWaiting && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
          !isRunning && !isSuccess && !isError && !isWaiting && "bg-muted text-muted-foreground"
        )}
        variant="secondary"
      >
        {getIcon()}
        <span>{labels[status]}</span>
      </Badge>
    </motion.div>
  );
};

// Format tool type to human-readable name
const formatToolName = (type: string): string => {
  // Remove "tool-" prefix and convert camelCase to Title Case
  const name = type.replace("tool-", "");
  return name
    .replace(/([A-Z])/g, " $1") // Add space before capitals
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();
};

export const ToolHeader = ({
  className,
  type,
  state,
  ...props
}: ToolHeaderProps) => {
  const isRunning = state === "input-available" || state === "input-streaming";

  return (
    <CollapsibleTrigger
      className={cn(
        "group flex w-full min-w-0 items-center justify-between gap-3 p-4",
        "transition-colors duration-200",
        "hover:bg-muted/50",
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          "bg-gradient-to-br from-primary/10 to-primary/5",
          "ring-1 ring-primary/20",
          isRunning && "animate-pulse"
        )}>
          {isRunning ? (
            <SparklesIcon className="size-4 text-primary" />
          ) : (
            <WrenchIcon className="size-4 text-primary" />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="truncate font-medium text-sm">{formatToolName(type)}</span>
          <span className="text-xs text-muted-foreground">
            {isRunning ? "Executing tool..." : "Tool execution"}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {getStatusBadge(state)}
        <ChevronDownIcon className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </div>
    </CollapsibleTrigger>
  );
};

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
  <CollapsibleContent
    className={cn(
      "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-hidden data-[state=closed]:animate-out data-[state=open]:animate-in",
      className
    )}
    {...props}
  />
);

export type ToolInputProps = ComponentProps<"div"> & {
  input: ToolUIPart["input"];
};

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => (
  <div className={cn("space-y-2 overflow-hidden p-4", className)} {...props}>
    <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
      Parameters
    </h4>
    <div className="rounded-md bg-muted/50">
      <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
    </div>
  </div>
);

export type ToolOutputProps = ComponentProps<"div"> & {
  output: ReactNode;
  errorText: ToolUIPart["errorText"];
};

export const ToolOutput = ({
  className,
  output,
  errorText,
  ...props
}: ToolOutputProps) => {
  if (!(output || errorText)) {
    return null;
  }

  return (
    <div className={cn("space-y-2 p-4", className)} {...props}>
      <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {errorText ? "Error" : "Result"}
      </h4>
      <div
        className={cn(
          "overflow-x-auto rounded-md text-xs [&_table]:w-full",
          errorText
            ? "bg-destructive/10 text-destructive"
            : "bg-muted/50 text-foreground"
        )}
      >
        {errorText && <div>{errorText}</div>}
        {output && <div>{output}</div>}
      </div>
    </div>
  );
};
