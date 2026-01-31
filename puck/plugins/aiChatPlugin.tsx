"use client";

import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { usePuck } from "@puckeditor/core";
import { createToolExecutorsWithGetter, type ToolResult } from "@/lib/puck/ai/tools/executors";
import type { PuckEditorContext, SelectedComponent } from "@/lib/puck/ai/types";
import { useHelpModeOptional } from "@/lib/puck/help-mode-context";

// Icons
const SparklesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4" />
    <path d="M22 5h-4" />
    <path d="M4 17v2" />
    <path d="M5 18H3" />
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

const ToolIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const HelpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

const QUICK_PROMPTS = [
  { label: "Add Hero", prompt: "Add a hero section with a heading and call-to-action button" },
  { label: "Add Features", prompt: "Add a features grid with 3 feature cards" },
  { label: "What's here?", prompt: "What components are currently on this page?" },
  { label: "Add CTA", prompt: "Add a call-to-action section at the bottom" },
];

// Help mode prompts shown when help mode is active
// These prompts are explicit about which tools to use and what behavior to expect
const HELP_PROMPTS = [
  {
    label: "How to edit?",
    prompt: `Help me edit this component:

STEP 1: Call \`getComponentHelp\` with the component type to get documentation.
STEP 2: Call \`selectComponent\` to highlight it in the editor.
STEP 3: Explain each prop from the help data and how I can modify them manually in the fields panel.

Complete all steps and explain the editing workflow.`,
  },
  {
    label: "What is this?",
    prompt: `Explain this component using \`getComponentHelp\`:

1. Call \`getComponentHelp\` with this component's type
2. Describe what it does based on the help data
3. List its most important props with descriptions
4. Share any tips from the documentation`,
  },
  {
    label: "Show examples",
    prompt: `Show me example configurations for this component:

1. Call \`getComponentHelp\` to get the examples array
2. Present 2-3 different configurations I could use
3. Explain what each configuration achieves`,
  },
  {
    label: "What can I add?",
    prompt: `Help me understand component composition:

1. Call \`getComponentHelp\` for the selected component
2. Check the relatedComponents list
3. Explain what components work well with this one
4. Suggest a logical structure for the page`,
  },
];

/**
 * Extract selected component info from Puck app state
 * Returns undefined if no component is selected or data is unavailable
 */
function getSelectedComponentInfo(appState: {
  ui?: { itemSelector?: { index: number; zone?: string | null } | null };
  data?: { content?: Array<{ type: string; props: Record<string, unknown> }> };
}): SelectedComponent | undefined {
  // Guard against missing data
  if (!appState?.ui?.itemSelector) return undefined;
  if (!appState?.data?.content) return undefined;

  const selector = appState.ui.itemSelector;
  const { index, zone } = selector;
  const content = appState.data.content;

  // Guard against invalid index
  if (!Array.isArray(content) || index < 0 || index >= content.length) return undefined;

  const component = content[index];
  if (!component) return undefined;

  return {
    id: (component.props?.id as string) || `component-${index}`,
    type: component.type,
    props: component.props || {},
    zone: zone || undefined,
    index,
  };
}

// Get page ID from URL for unique chat sessions
function getPageId(): string {
  if (typeof window === "undefined") return "default";
  const path = window.location.pathname;
  // Match multiple patterns for different editor URLs
  const patterns = [
    /\/editor\/([^/]+)/,
    /\/admin\/pages\/([^/]+)\/puck/,
    /\/admin\/pages\/layout\/([^/]+)/,  // Layout editors (header, footer, announcement)
    /\/admin\/email-marketing\/([^/]+)\/design/,
    /\/email\/([^/]+)/,
  ];
  for (const pattern of patterns) {
    const match = path.match(pattern);
    if (match) return match[1];
  }
  return "default";
}

// LocalStorage key for chat history
function getChatStorageKey(pageId: string): string {
  return `puck-ai-chat-${pageId}`;
}

function AIChatPluginPanel() {
  const { appState, dispatch } = usePuck();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get page-specific chat ID
  const pageId = useMemo(() => getPageId(), []);
  const chatId = useMemo(() => `puck-ai-chat-${pageId}`, [pageId]);

  // Manage input state ourselves since useChat v6 doesn't provide it
  const [input, setInput] = useState("");

  // Help mode from shared context (set via header button)
  const { helpMode, helpTarget } = useHelpModeOptional();

  // Track recent user actions for context
  const recentActionsRef = useRef<PuckEditorContext["recentActions"]>([]);

  // Get currently selected component - use optional chaining in dependencies to prevent errors
  const selectedComponent = useMemo(
    () => getSelectedComponentInfo(appState),
    [appState?.ui?.itemSelector, appState?.data?.content]
  );

  // Build editor context for AI
  const editorContext: PuckEditorContext = useMemo(() => ({
    selectedComponent,
    helpMode,
    helpTarget: helpTarget ? {
      componentId: helpTarget.componentId,
      componentType: helpTarget.componentType,
      action: "explain" as const,
    } : undefined,
    recentActions: recentActionsRef.current?.slice(0, 5),
    canUndo: (appState as { history?: { hasPast?: boolean } }).history?.hasPast ?? false,
    canRedo: (appState as { history?: { hasFuture?: boolean } }).history?.hasFuture ?? false,
  }), [selectedComponent, helpMode, helpTarget, appState]);

  // CRITICAL: Keep a ref that always points to current appState
  // This prevents stale closures when multiple tools execute in sequence
  // Update synchronously during render, not in useEffect (which runs after render)
  const appStateRef = useRef(appState);
  appStateRef.current = appState; // Sync update on every render

  // Create tool executors that always read from the ref for fresh state
  const toolExecutors = useMemo(() => {
    const wrappedDispatch = (action: { type: string; [key: string]: unknown }) => {
      dispatch(action as Parameters<typeof dispatch>[0]);
    };
    // Pass a getter function instead of static state
    const getAppState = () => appStateRef.current;
    return createToolExecutorsWithGetter(getAppState, wrappedDispatch);
  }, [dispatch]); // Note: appState removed - we use the ref instead

  // Handle tool calls via the onToolCall callback (AI SDK v6 pattern)
  // This is called automatically when a tool call is received
  // IMPORTANT: Must RETURN the result, not call addToolOutput
  // Note: AI SDK v6 uses different property names, so we accept unknown and extract
  const handleToolCall = useCallback(async ({ toolCall }: { toolCall: unknown }) => {
    // Extract properties - AI SDK v6 may use 'args' or 'input' depending on version
    const tc = toolCall as { toolCallId?: string; toolName?: string; args?: Record<string, unknown>; input?: unknown };
    const toolName = tc.toolName ?? "";
    const args = (tc.args ?? tc.input ?? {}) as Record<string, unknown>;

    console.log("Tool call received:", toolName, args);

    const executor = toolExecutors[toolName as keyof typeof toolExecutors];
    if (!executor) {
      console.warn("No executor for tool:", toolName);
      return { success: false, message: `Unknown tool: ${toolName}` };
    }

    try {
      const result = await executor(args as never);
      console.log("Tool result:", result);
      // Return the result - AI SDK will handle sending it back
      return result;
    } catch (error) {
      console.error("Tool execution error:", error);
      return { success: false, message: `Tool execution failed: ${error}` };
    }
  }, [toolExecutors]);

  // Use the official useChat hook with transport for AI SDK v6
  // Note: maxSteps is configured server-side in the route handler
  const {
    messages,
    status,
    sendMessage,
    setMessages,
  } = useChat({
    id: chatId,
    transport: new DefaultChatTransport({
      api: "/api/puck/chat",
      prepareSendMessagesRequest(request) {
        return {
          body: {
            ...request.body,
            pageData: appState.data,
            editorContext,
          },
        };
      },
    }),
    // Cast to bypass strict type checking - runtime behavior is correct
    onToolCall: handleToolCall as never,
  });

  // Track if initial load has happened
  const hasLoadedRef = useRef(false);

  // Load messages from localStorage on mount
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    try {
      const stored = localStorage.getItem(getChatStorageKey(pageId));
      if (stored) {
        const parsedMessages = JSON.parse(stored) as UIMessage[];
        if (parsedMessages.length > 0) {
          setMessages(parsedMessages);
        }
      }
    } catch (e) {
      console.error("Failed to load chat history:", e);
    }
  }, [pageId, setMessages]);

  const isLoading = status === "streaming" || status === "submitted";

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(getChatStorageKey(pageId), JSON.stringify(messages));
      } catch (e) {
        console.error("Failed to save chat history:", e);
      }
    }
  }, [messages, pageId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear chat history
  const handleClearHistory = useCallback(() => {
    try {
      localStorage.removeItem(getChatStorageKey(pageId));
      setMessages([]);
    } catch (e) {
      console.error("Failed to clear chat history:", e);
    }
  }, [pageId, setMessages]);

  // Handle quick prompt click
  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  // Handle form submit
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageText = input;
    setInput("");

    // Send message using the text format
    await sendMessage({ text: messageText });
  };

  // Handle Enter to submit, Shift+Enter for new line
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
    // Shift+Enter allows default behavior (new line)
  };

  // Get text content from message
  const getMessageText = (message: UIMessage) => {
    if (!message.parts) return "";
    return message.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map(p => p.text)
      .join("");
  };

  // Get tool parts from message (handles multiple AI SDK formats)
  const getToolParts = (message: UIMessage) => {
    if (!message.parts) return [];
    // Check for various tool part type formats
    // Cast to string to handle various SDK versions
    return message.parts.filter(p => {
      const typeStr = p.type as string;
      return typeStr.startsWith("tool-") ||
        typeStr === "tool_call" ||
        typeStr === "tool-call" ||
        typeStr === "tool-invocation";
    });
  };

  return (
    <div className="ai-chat-panel">
      {/* Header with selected component and clear button */}
      <div className="ai-chat-header">
        <div className="ai-chat-header-left">
          {selectedComponent && (
            <span className="ai-chat-selected-indicator" title={`Selected: ${selectedComponent.type}`}>
              {selectedComponent.type}
            </span>
          )}
          {!selectedComponent && (
            <span className="ai-chat-header-hint">Select a component to edit</span>
          )}
        </div>
        {messages.length > 0 && (
          <div className="ai-chat-header-right">
            <span className="ai-chat-header-title">
              {messages.length} messages
            </span>
            <button
              className="ai-chat-clear-btn"
              onClick={handleClearHistory}
              title="Clear chat history"
            >
              <TrashIcon />
            </button>
          </div>
        )}
      </div>

      {/* Help mode banner */}
      {helpMode && (
        <div className="ai-chat-help-banner">
          <HelpIcon />
          <span>
            <strong>Help Mode Active</strong>
            {selectedComponent
              ? ` - Ask about ${selectedComponent.type}`
              : " - Select a component to get help"}
          </span>
        </div>
      )}

      {/* Messages area */}
      <div className="ai-chat-messages">
        {messages.length === 0 ? (
          <div className="ai-chat-empty">
            <div className={`ai-chat-empty-icon ${helpMode ? "help-mode" : ""}`}>
              {helpMode ? <HelpIcon /> : <SparklesIcon />}
            </div>
            <p className="ai-chat-empty-title">
              {helpMode ? "Help Mode" : "AI Page Builder"}
            </p>
            <p className="ai-chat-empty-desc">
              {helpMode
                ? selectedComponent
                  ? `Ask about the selected ${selectedComponent.type} component. I'll explain how to edit it manually.`
                  : "Select a component in the editor, then ask me how to edit it manually."
                : "Ask me to add components, edit content, or generate layouts for your page."
              }
            </p>
            <div className="ai-quick-prompts">
              {(helpMode && selectedComponent ? HELP_PROMPTS : QUICK_PROMPTS).map((item) => (
                <button
                  key={item.label}
                  className={`ai-quick-btn ${helpMode ? "help-mode" : ""}`}
                  onClick={() => handleQuickPrompt(item.prompt)}
                  disabled={helpMode && !selectedComponent}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`ai-chat-message ${message.role === "user" ? "ai-chat-message-user" : "ai-chat-message-assistant"}`}
              >
                {message.role === "assistant" && (
                  <div className="ai-chat-avatar">
                    <SparklesIcon />
                  </div>
                )}
                <div className="ai-chat-content">
                  {/* Show tool calls if any */}
                  {getToolParts(message).length > 0 && (
                    <div className="ai-chat-tools">
                      {getToolParts(message).map((part, idx) => {
                        const toolPart = part as unknown as { type: string; toolName?: string; state?: string; output?: { success?: boolean } };
                        return (
                          <div key={idx} className="ai-chat-tool">
                            <ToolIcon />
                            <span className="ai-chat-tool-name">
                              {formatToolName(toolPart.toolName || "unknown")}
                            </span>
                            {toolPart.state === "output-available" && (
                              <span className={`ai-chat-tool-status ${toolPart.output?.success ? "success" : "error"}`}>
                                {toolPart.output?.success ? "\u2713" : "\u2717"}
                              </span>
                            )}
                            {(toolPart.state === "input-available" || toolPart.state === "input-streaming") && (
                              <span className="ai-chat-tool-status pending">...</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Message content */}
                  {getMessageText(message) && (
                    <div className="ai-chat-text">{getMessageText(message)}</div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="ai-chat-message ai-chat-message-assistant">
                <div className="ai-chat-avatar">
                  <SparklesIcon />
                </div>
                <div className="ai-chat-content">
                  <div className="ai-chat-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <form onSubmit={onSubmit} className="ai-chat-input-area">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI to edit your page..."
          className="ai-chat-input"
          rows={2}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="ai-chat-submit"
          disabled={!input.trim() || isLoading}
        >
          <SendIcon />
        </button>
      </form>

      <style>{`
        .ai-chat-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #fafafa;
        }

        .ai-chat-help-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: linear-gradient(135deg, #ede9fe, #ddd6fe);
          border-bottom: 1px solid #c4b5fd;
          font-size: 13px;
          color: #5b21b6;
        }

        .ai-chat-help-banner svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .ai-chat-help-banner strong {
          font-weight: 600;
        }

        .ai-chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-bottom: 1px solid #e5e7eb;
          background: white;
          min-height: 44px;
        }

        .ai-chat-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ai-chat-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ai-chat-header-title {
          font-size: 11px;
          font-weight: 500;
          color: #9ca3af;
        }

        .ai-chat-header-hint {
          font-size: 11px;
          color: #9ca3af;
          font-style: italic;
        }

        .ai-chat-selected-indicator {
          display: inline-flex;
          padding: 3px 8px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          color: #059669;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ai-chat-clear-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: transparent;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          color: #9ca3af;
          cursor: pointer;
          transition: all 0.15s;
        }

        .ai-chat-clear-btn:hover {
          background: #fef2f2;
          border-color: #fecaca;
          color: #ef4444;
        }

        .ai-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .ai-chat-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          padding: 20px;
        }

        .ai-chat-empty-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-bottom: 16px;
        }

        .ai-chat-empty-icon.help-mode {
          background: linear-gradient(135deg, #7c3aed, #a78bfa);
        }

        .ai-chat-empty-icon.help-mode svg {
          width: 24px;
          height: 24px;
        }

        .ai-chat-empty-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .ai-chat-empty-desc {
          font-size: 13px;
          color: #6b7280;
          margin: 0 0 20px 0;
          line-height: 1.5;
        }

        .ai-quick-prompts {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }

        .ai-quick-btn {
          padding: 8px 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          font-size: 12px;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s;
        }

        .ai-quick-btn:hover {
          background: #f3f4f6;
          border-color: #6366f1;
          color: #6366f1;
        }

        .ai-quick-btn.help-mode {
          border-color: #ddd6fe;
        }

        .ai-quick-btn.help-mode:hover {
          background: #ede9fe;
          border-color: #a78bfa;
          color: #7c3aed;
        }

        .ai-quick-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ai-quick-btn:disabled:hover {
          background: white;
          border-color: #e5e7eb;
          color: #374151;
        }

        .ai-chat-message {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
        }

        .ai-chat-message-user {
          justify-content: flex-end;
        }

        .ai-chat-message-user .ai-chat-content {
          background: #6366f1;
          color: white;
          border-radius: 16px 16px 4px 16px;
        }

        .ai-chat-message-assistant .ai-chat-content {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px 16px 16px 4px;
          color: #1f2937;
        }

        .ai-chat-avatar {
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .ai-chat-avatar svg {
          width: 14px;
          height: 14px;
        }

        .ai-chat-content {
          padding: 10px 14px;
          max-width: 85%;
        }

        .ai-chat-text {
          font-size: 13px;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .ai-chat-tools {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 8px;
        }

        .ai-chat-tool {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: #f3f4f6;
          border-radius: 4px;
          font-size: 11px;
          color: #6b7280;
        }

        .ai-chat-tool-name {
          font-weight: 500;
        }

        .ai-chat-tool-status {
          font-weight: 600;
        }

        .ai-chat-tool-status.success {
          color: #22c55e;
        }

        .ai-chat-tool-status.error {
          color: #ef4444;
        }

        .ai-chat-tool-status.pending {
          color: #f59e0b;
        }

        .ai-chat-typing {
          display: flex;
          gap: 4px;
          padding: 4px 0;
        }

        .ai-chat-typing span {
          width: 6px;
          height: 6px;
          background: #9ca3af;
          border-radius: 50%;
          animation: typing 1.4s ease-in-out infinite;
        }

        .ai-chat-typing span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .ai-chat-typing span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }

        .ai-chat-input-area {
          display: flex;
          gap: 8px;
          padding: 12px;
          border-top: 1px solid #e5e7eb;
          background: white;
        }

        .ai-chat-input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          font-size: 13px;
          font-family: inherit;
          resize: none;
          min-height: 40px;
          max-height: 120px;
          color: #1f2937;
          background: white;
        }

        .ai-chat-input::placeholder {
          color: #9ca3af;
        }

        .ai-chat-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .ai-chat-input:disabled {
          background: #f9fafb;
          color: #6b7280;
        }

        .ai-chat-submit {
          width: 40px;
          height: 40px;
          background: #6366f1;
          border: none;
          border-radius: 10px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
          flex-shrink: 0;
          align-self: flex-end;
        }

        .ai-chat-submit:hover:not(:disabled) {
          background: #4f46e5;
        }

        .ai-chat-submit:disabled {
          background: #d1d5db;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

// Helper to format tool names for display
function formatToolName(name: string): string {
  return name
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase()
    .replace(/^./, (s) => s.toUpperCase());
}

// Export the plugin
export const aiChatPlugin = {
  name: "ai-chat",
  label: "AI",
  icon: <SparklesIcon />,
  render: AIChatPluginPanel,
};
