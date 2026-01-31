"use client";
import type { UseChatHelpers } from "@ai-sdk/react";
import equal from "fast-deep-equal";
import { motion } from "framer-motion";
import { memo, useState } from "react";
import { CheckCircle, XCircle, Shield, AlertTriangle } from "lucide-react";
import type { Vote } from '@/lib/cms/chatsdk/db/schema';
import type { ChatMessage } from '@/lib/cms/chatsdk/types';
import { cn, sanitizeText } from '@/lib/cms/utils';
import { Button } from '../ui/button';
import { useDataStream } from "./data-stream-provider";
import { DocumentToolResult } from "./document";
import { DocumentPreview } from "./document-preview";
import { MessageContent } from "./elements/message";
import { Response } from "./elements/response";
import {
  WalkthroughSuggestions,
  WalkthroughStarted,
  ElementExplanation,
  type WalkthroughSuggestionsData,
  type WalkthroughStartedData,
  type ElementExplanationData,
} from "../admin-chat/walkthrough-suggestions";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "./elements/tool";
import { SparklesIcon } from "./icons";
import { MessageActions } from "./message-actions";
import { MessageEditor } from "./message-editor";
import { MessageReasoning } from "./message-reasoning";
import { PreviewAttachment } from "./preview-attachment";

const PurePreviewMessage = ({
  addToolApprovalResponse,
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  regenerate,
  isReadonly,
  requiresScrollPadding,
}: {
  addToolApprovalResponse?: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<"view" | "edit">("view");

  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === "file"
  );

  useDataStream();

  return (
    <motion.div
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="group/message w-full"
      data-role={message.role}
      data-testid={`message-${message.role}`}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
        opacity: { duration: 0.3 }
      }}
    >
      <div
        className={cn("flex w-full items-start gap-2 md:gap-3", {
          "justify-end": message.role === "user" && mode !== "edit",
          "justify-start": message.role === "assistant",
        })}
      >
        {message.role === "assistant" && (
          <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
            <SparklesIcon size={14} />
          </div>
        )}

        <div
          className={cn("flex flex-col", {
            "gap-2 md:gap-4": message.parts?.some(
              (p) => p.type === "text" && p.text
            ),
            "min-h-96": message.role === "assistant" && requiresScrollPadding,
            "w-full":
              (message.role === "assistant" &&
                message.parts?.some(
                  (p) => p.type === "text" && p.text
                )) ||
              mode === "edit",
            "max-w-[calc(100%-2.5rem)] sm:max-w-[min(fit-content,80%)]":
              message.role === "user" && mode !== "edit",
          })}
        >
          {attachmentsFromMessage.length > 0 && (
            <div
              className="flex flex-row justify-end gap-2"
              data-testid={"message-attachments"}
            >
              {attachmentsFromMessage.map((attachment) => (
                <PreviewAttachment
                  attachment={{
                    name: attachment.filename ?? "file",
                    contentType: attachment.mediaType,
                    url: attachment.url,
                  }}
                  key={attachment.url}
                />
              ))}
            </div>
          )}

          {message.parts?.map((part, index) => {
            const { type } = part;
            const key = `message-${message.id}-part-${index}`;

            if (type === "reasoning" && part.text && part.text.length > 0) {
              return (
                <MessageReasoning
                  isLoading={isLoading}
                  key={key}
                  reasoning={part.text}
                />
              );
            }

            if (type === "text") {
              if (mode === "view") {
                const isAssistantStreaming = message.role === "assistant" && isLoading;
                return (
                  <div key={key}>
                    <MessageContent
                      className={cn({
                        "w-fit break-words rounded-2xl px-3 py-2 text-right text-white":
                          message.role === "user",
                        "bg-transparent px-0 py-0 text-left":
                          message.role === "assistant",
                      })}
                      data-testid="message-content"
                      style={
                        message.role === "user"
                          ? { backgroundColor: "#006cff" }
                          : undefined
                      }
                    >
                      <Response isStreaming={isAssistantStreaming}>
                        {sanitizeText(part.text)}
                      </Response>
                    </MessageContent>
                  </div>
                );
              }

              if (mode === "edit") {
                return (
                  <div
                    className="flex w-full flex-row items-start gap-3"
                    key={key}
                  >
                    <div className="size-8" />
                    <div className="min-w-0 flex-1">
                      <MessageEditor
                        key={message.id}
                        message={message}
                        regenerate={regenerate}
                        setMessages={setMessages}
                        setMode={setMode}
                      />
                    </div>
                  </div>
                );
              }
            }

            if (type === "tool-createDocument") {
              const { toolCallId } = part;

              if (part.output && "error" in part.output) {
                return (
                  <div
                    className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-950/50"
                    key={toolCallId}
                  >
                    Error creating document: {String(part.output.error)}
                  </div>
                );
              }

              return (
                <DocumentPreview
                  isReadonly={isReadonly}
                  key={toolCallId}
                  result={part.output}
                />
              );
            }

            if (type === "tool-updateDocument") {
              const { toolCallId } = part;

              if (part.output && "error" in part.output) {
                return (
                  <div
                    className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-950/50"
                    key={toolCallId}
                  >
                    Error updating document: {String(part.output.error)}
                  </div>
                );
              }

              return (
                <div className="relative" key={toolCallId}>
                  <DocumentPreview
                    args={{ ...part.output, isUpdate: true }}
                    isReadonly={isReadonly}
                    result={part.output}
                  />
                </div>
              );
            }

            if (type === "tool-requestSuggestions") {
              const { toolCallId, state } = part;

              return (
                <Tool defaultOpen={true} key={toolCallId}>
                  <ToolHeader state={state} type="tool-requestSuggestions" />
                  <ToolContent>
                    {state === "input-available" && (
                      <ToolInput input={part.input} />
                    )}
                    {state === "output-available" && (
                      <ToolOutput
                        errorText={undefined}
                        output={
                          "error" in part.output ? (
                            <div className="rounded border p-2 text-red-500">
                              Error: {String(part.output.error)}
                            </div>
                          ) : (
                            <DocumentToolResult
                              isReadonly={isReadonly}
                              result={part.output}
                              type="request-suggestions"
                            />
                          )
                        }
                      />
                    )}
                  </ToolContent>
                </Tool>
              );
            }

            // Walkthrough suggestion tool - renders clickable tour cards
            if ((type as string) === "tool-suggestWalkthroughs") {
              const toolPart = part as any;
              const { toolCallId, state, output } = toolPart;

              if (state === "output-available" && output?.action === "suggest_walkthroughs") {
                return (
                  <WalkthroughSuggestions
                    key={toolCallId}
                    data={output as WalkthroughSuggestionsData}
                  />
                );
              }

              return null;
            }

            // Start walkthrough tool - shows tour starting notification
            if ((type as string) === "tool-startWalkthrough" || (type as string) === "tool-generateWalkthrough") {
              const toolPart = part as any;
              const { toolCallId, state, output } = toolPart;

              if (state === "output-available" && output?.action === "start_walkthrough") {
                return (
                  <WalkthroughStarted
                    key={toolCallId}
                    data={output as WalkthroughStartedData}
                  />
                );
              }

              return null;
            }

            // Explain element tool - shows element explanation with optional tour link
            if ((type as string) === "tool-explainElement") {
              const toolPart = part as any;
              const { toolCallId, state, output } = toolPart;

              if (state === "output-available" && output?.action === "explain_element") {
                return (
                  <ElementExplanation
                    key={toolCallId}
                    data={output as ElementExplanationData}
                  />
                );
              }

              return null;
            }

            // Generic handler for all tool calls including VMCP tools
            // Uses native AI SDK v6 needsApproval handling
            if (typeof type === "string" && type.startsWith("tool-")) {
              const toolPart = part as any;
              const { toolCallId, state, input, output, approval } = toolPart;
              const toolName = type.replace("tool-", "");

              // Check for tools requiring human approval (AI SDK v6 native)
              if (state === "approval-requested" && addToolApprovalResponse) {
                const isVmcpTool = toolName.startsWith("vmcp_");
                const isDangerousOperation = ["vmcp_create_tool", "vmcp_iterate_tool", "vmcp_delete_tool", "vmcp_enable_autonomous"].includes(toolName);

                return (
                  <motion.div
                    key={toolCallId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg",
                        isDangerousOperation
                          ? "bg-amber-100 dark:bg-amber-900/50"
                          : "bg-blue-100 dark:bg-blue-900/50"
                      )}>
                        {isDangerousOperation ? (
                          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-amber-900 dark:text-amber-100">
                          Approval Required
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                          The AI wants to execute: <code className="bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded font-mono text-xs">{toolName}</code>
                        </p>

                        {/* Show tool input details */}
                        {input && (
                          <div className="mt-3 rounded border border-amber-200 dark:border-amber-800 bg-white dark:bg-amber-950/30 p-3">
                            <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-2">Parameters:</p>
                            <pre className="text-xs text-amber-700 dark:text-amber-300 overflow-auto max-h-40 whitespace-pre-wrap">
                              {JSON.stringify(input, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Approval/Denial buttons */}
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            onClick={() => {
                              addToolApprovalResponse({
                                id: toolCallId,
                                approved: true,
                              });
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-1.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              addToolApprovalResponse({
                                id: toolCallId,
                                approved: false,
                              });
                            }}
                            className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/50"
                          >
                            <XCircle className="h-4 w-4 mr-1.5" />
                            Deny
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              }

              // Normal tool rendering for approved or non-approval tools
              return (
                <Tool defaultOpen={true} key={toolCallId}>
                  <ToolHeader state={state} type={type as `tool-${string}`} />
                  <ToolContent>
                    {state === "input-available" && input && (
                      <ToolInput input={input} />
                    )}
                    {state === "output-available" && output && (
                      <ToolOutput
                        errorText={output?.error ? String(output.error) : undefined}
                        output={
                          output?.error ? null : (
                            <div className="text-sm text-muted-foreground">
                              {typeof output === "string"
                                ? output
                                : output?.success
                                  ? `${toolName} completed successfully`
                                  : JSON.stringify(output, null, 2).slice(0, 200)}
                            </div>
                          )
                        }
                      />
                    )}
                  </ToolContent>
                </Tool>
              );
            }

            return null;
          })}

          {!isReadonly && (
            <MessageActions
              chatId={chatId}
              isLoading={isLoading}
              key={`action-${message.id}`}
              message={message}
              setMode={setMode}
              vote={vote}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) {
      return false;
    }
    if (prevProps.message.id !== nextProps.message.id) {
      return false;
    }
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding) {
      return false;
    }
    if (!equal(prevProps.message.parts, nextProps.message.parts)) {
      return false;
    }
    if (!equal(prevProps.vote, nextProps.vote)) {
      return false;
    }

    return false;
  }
);

// Animated dot component for typing indicator
const TypingDot = ({ delay }: { delay: number }) => (
  <motion.span
    className="inline-block size-2 rounded-full bg-primary"
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.4, 1, 0.4],
    }}
    transition={{
      duration: 1.4,
      repeat: Infinity,
      delay,
      ease: "easeInOut",
    }}
  />
);

// Modern typing indicator with animated dots
const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 px-4 py-3">
    <TypingDot delay={0} />
    <TypingDot delay={0.2} />
    <TypingDot delay={0.4} />
  </div>
);

export const ThinkingMessage = () => {
  const role = "assistant";

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="group/message w-full"
      data-role={role}
      data-testid="message-assistant-loading"
      exit={{ opacity: 0, y: -10, transition: { duration: 0.3 } }}
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="flex items-start justify-start gap-3">
        <motion.div
          className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 ring-1 ring-primary/20"
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(var(--primary), 0)",
              "0 0 0 8px rgba(var(--primary), 0.1)",
              "0 0 0 0 rgba(var(--primary), 0)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <SparklesIcon size={14} className="text-primary" />
          </motion.div>
        </motion.div>

        <div className="flex flex-col gap-1">
          <motion.div
            className="rounded-2xl bg-muted/50 backdrop-blur-sm border border-border/50"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <TypingIndicator />
          </motion.div>
          <motion.span
            className="text-xs text-muted-foreground/70 ml-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            AI is thinking...
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
};
