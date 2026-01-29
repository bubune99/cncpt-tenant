"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _chunkHQVSQ2EOjs = require('./chunk-HQVSQ2EO.js');


var _chunkPWJHQH3Pjs = require('./chunk-PWJHQH3P.js');


var _chunkSKQV2OMQjs = require('./chunk-SKQV2OMQ.js');




var _chunkHY7GTCJMjs = require('./chunk-HY7GTCJM.js');

// src/components/admin-chat/chat-panel.tsx
var _react = require('react');
var _navigation = require('next/navigation');
var _react3 = require('@ai-sdk/react');
var _ai = require('ai');
var _framermotion = require('framer-motion');
var _reactmarkdown = require('react-markdown'); var _reactmarkdown2 = _interopRequireDefault(_reactmarkdown);
var _remarkgfm = require('remark-gfm'); var _remarkgfm2 = _interopRequireDefault(_remarkgfm);






















var _lucidereact = require('lucide-react');

// src/components/ui/textarea.tsx
var _jsxruntime = require('react/jsx-runtime');
function Textarea(_a) {
  var _b = _a, { className } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, ["className"]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "textarea",
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      "data-slot": "textarea",
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )
    }, props)
  );
}

// src/components/ui/tooltip.tsx
var _reacttooltip = require('@radix-ui/react-tooltip'); var TooltipPrimitive = _interopRequireWildcard(_reacttooltip);

function TooltipProvider(_a) {
  var _b = _a, {
    delayDuration = 0
  } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, [
    "delayDuration"
  ]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    TooltipPrimitive.Provider,
    _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      "data-slot": "tooltip-provider",
      delayDuration
    }, props)
  );
}
function Tooltip(_a) {
  var props = _chunkHY7GTCJMjs.__objRest.call(void 0, _a, []);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TooltipProvider, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TooltipPrimitive.Root, _chunkHY7GTCJMjs.__spreadValues.call(void 0, { "data-slot": "tooltip" }, props)) });
}
function TooltipTrigger(_a) {
  var props = _chunkHY7GTCJMjs.__objRest.call(void 0, _a, []);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TooltipPrimitive.Trigger, _chunkHY7GTCJMjs.__spreadValues.call(void 0, { "data-slot": "tooltip-trigger" }, props));
}
function TooltipContent(_a) {
  var _b = _a, {
    className,
    sideOffset = 0,
    children
  } = _b, props = _chunkHY7GTCJMjs.__objRest.call(void 0, _b, [
    "className",
    "sideOffset",
    "children"
  ]);
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TooltipPrimitive.Portal, { children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    TooltipPrimitive.Content,
    _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {
      "data-slot": "tooltip-content",
      sideOffset,
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "bg-foreground text-background animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
        className
      )
    }, props), {
      children: [
        children,
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TooltipPrimitive.Arrow, { className: "bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" })
      ]
    })
  ) });
}

// src/lib/ai/chat-store.ts
var _zustand = require('zustand');
var _middleware = require('zustand/middleware');
var useChatStore = _zustand.create.call(void 0, )(
  _middleware.persist.call(void 0, 
    (set, get) => ({
      // Panel state
      mode: "collapsed",
      setMode: (mode) => set({ mode }),
      togglePanel: () => {
        const current = get().mode;
        if (current === "collapsed") {
          set({ mode: "side" });
        } else {
          set({ mode: "collapsed" });
        }
      },
      // Current conversation
      conversationId: null,
      messages: [],
      isLoading: false,
      error: null,
      // Context
      context: { type: "general" },
      setContext: (context) => set({ context }),
      // Message actions
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
      })),
      updateMessage: (id, updates) => set((state) => ({
        messages: state.messages.map(
          (msg) => msg.id === id ? _chunkHY7GTCJMjs.__spreadValues.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, msg), updates) : msg
        )
      })),
      setMessages: (messages) => set({ messages }),
      clearMessages: () => set({ messages: [] }),
      // Conversation actions
      setConversationId: (id) => set({ conversationId: id }),
      startNewConversation: () => {
        const newId = crypto.randomUUID();
        set({
          conversationId: newId,
          messages: [],
          error: null
        });
      },
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      // History
      conversationHistory: [],
      addToHistory: (conversation) => set((state) => {
        const filtered = state.conversationHistory.filter(
          (c) => c.id !== conversation.id
        );
        return {
          conversationHistory: [
            _chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, conversation), { updatedAt: /* @__PURE__ */ new Date() }),
            ...filtered
          ].slice(0, 50)
          // Keep last 50 conversations
        };
      }),
      removeFromHistory: (id) => set((state) => ({
        conversationHistory: state.conversationHistory.filter(
          (c) => c.id !== id
        )
      })),
      loadConversation: (id) => {
        const history = get().conversationHistory.find((c) => c.id === id);
        if (history) {
          set({
            conversationId: id,
            messages: [],
            // Messages will be loaded from the useChat hook via transport
            error: null,
            context: history.context || { type: "general" }
          });
        }
      },
      clearHistory: () => set({ conversationHistory: [] })
    }),
    {
      name: "admin-chat-storage",
      partialize: (state) => ({
        // Only persist these fields
        mode: state.mode,
        conversationId: state.conversationId,
        messages: state.messages,
        conversationHistory: state.conversationHistory
      })
    }
  )
);
var useChatPanel = () => {
  const mode = useChatStore((s) => s.mode);
  const setMode = useChatStore((s) => s.setMode);
  const togglePanel = useChatStore((s) => s.togglePanel);
  return { mode, setMode, togglePanel };
};
var useChatContext = () => {
  const context = useChatStore((s) => s.context);
  const setContext = useChatStore((s) => s.setContext);
  return { context, setContext };
};

// src/hooks/use-chat-context.ts


async function fetchEntityTitle(type, id) {
  try {
    let endpoint = "";
    switch (type) {
      case "product":
        endpoint = `/api/admin/products/${id}`;
        break;
      case "order":
        endpoint = `/api/admin/orders/${id}`;
        break;
      case "page":
        endpoint = `/api/admin/pages/${id}`;
        break;
      case "blog":
        endpoint = `/api/admin/blog/${id}`;
        break;
      case "user":
        endpoint = `/api/admin/customers/${id}`;
        break;
      default:
        return null;
    }
    const response = await fetch(endpoint);
    if (!response.ok) return null;
    const data = await response.json();
    switch (type) {
      case "product":
        return data.name || data.title || null;
      case "order":
        return `Order #${data.orderNumber || id.slice(0, 8)}`;
      case "page":
        return data.title || data.name || null;
      case "blog":
        return data.title || null;
      case "user":
        return data.name || data.email || null;
      default:
        return null;
    }
  } catch (error) {
    console.error("Failed to fetch entity title:", error);
    return null;
  }
}
function useAutoChatContext() {
  const pathname = _navigation.usePathname.call(void 0, );
  const params = _navigation.useParams.call(void 0, );
  const { context, setContext } = useChatContext();
  const lastFetchedRef = _react.useRef.call(void 0, null);
  _react.useEffect.call(void 0, () => {
    if (!pathname) return;
    const newContext = detectContextFromPath(pathname, params);
    if (newContext.type !== context.type || newContext.id !== context.id) {
      setContext(newContext);
      lastFetchedRef.current = null;
    }
  }, [pathname, params, setContext, context.type, context.id]);
  _react.useEffect.call(void 0, () => {
    const fetchTitle = async () => {
      if (!context.id || context.title || context.type === "general") return;
      const cacheKey = `${context.type}-${context.id}`;
      if (lastFetchedRef.current === cacheKey) return;
      lastFetchedRef.current = cacheKey;
      const title = await fetchEntityTitle(context.type, context.id);
      if (title) {
        setContext(_chunkHY7GTCJMjs.__spreadProps.call(void 0, _chunkHY7GTCJMjs.__spreadValues.call(void 0, {}, context), {
          title
        }));
      }
    };
    fetchTitle();
  }, [context, setContext]);
}
function detectContextFromPath(pathname, params) {
  if (pathname.startsWith("/admin/products/")) {
    const id = extractId(pathname, "/admin/products/");
    if (id && id !== "new") {
      return { type: "product", id };
    }
    return { type: "product" };
  }
  if (pathname === "/admin/products") {
    return { type: "product" };
  }
  if (pathname.startsWith("/admin/orders/")) {
    const id = extractId(pathname, "/admin/orders/");
    if (id) {
      return { type: "order", id };
    }
    return { type: "order" };
  }
  if (pathname === "/admin/orders") {
    return { type: "order" };
  }
  if (pathname.startsWith("/admin/pages/")) {
    const id = extractId(pathname, "/admin/pages/");
    if (id && id !== "new") {
      return { type: "page", id };
    }
    return { type: "page" };
  }
  if (pathname === "/admin/pages") {
    return { type: "page" };
  }
  if (pathname.startsWith("/admin/blog/")) {
    const id = extractId(pathname, "/admin/blog/");
    if (id && id !== "new") {
      return { type: "blog", id };
    }
    return { type: "blog" };
  }
  if (pathname === "/admin/blog") {
    return { type: "blog" };
  }
  if (pathname.startsWith("/admin/customers/")) {
    const id = extractId(pathname, "/admin/customers/");
    if (id) {
      return { type: "user", id };
    }
    return { type: "user" };
  }
  if (pathname === "/admin/customers") {
    return { type: "user" };
  }
  return { type: "general" };
}
function extractId(pathname, prefix) {
  const remaining = pathname.slice(prefix.length);
  const parts = remaining.split("/");
  const id = parts[0];
  if (!id || id === "new" || id === "edit") {
    return null;
  }
  return id;
}

// src/components/admin-chat/chat-panel.tsx

var TypingDots = () => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex items-center gap-1", children: [0, 1, 2].map((i) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
  _framermotion.motion.span,
  {
    className: "size-1.5 rounded-full bg-primary",
    animate: { scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] },
    transition: { duration: 1, repeat: Infinity, delay: i * 0.2 }
  },
  i
)) });
function isTextPart(part) {
  return part.type === "text" && "text" in part;
}
function isToolPart(part) {
  return (part.type.startsWith("tool-") || part.type === "tool-invocation") && "toolCallId" in part && "state" in part;
}
function isReasoningPart(part) {
  return part.type === "reasoning" && "text" in part;
}
function getToolName(part) {
  if (part.toolName) return part.toolName;
  if (part.type.startsWith("tool-")) return part.type.slice(5);
  return "unknown";
}
function processMessageParts(message) {
  const parts = message.parts || [];
  return {
    textParts: parts.filter(isTextPart),
    toolParts: parts.filter(isToolPart),
    reasoningParts: parts.filter(isReasoningPart)
  };
}
function getMessageText(message) {
  const { textParts } = processMessageParts(message);
  return textParts.map((part) => part.text).join("");
}
var SUGGESTED_ACTIONS = [
  { label: "Show dashboard stats", icon: "\u{1F4CA}" },
  { label: "Search products", icon: "\u{1F50D}" },
  { label: "Recent orders", icon: "\u{1F4E6}" },
  { label: "Help me navigate", icon: "\u{1F9ED}" }
];
function getContextIcon(type) {
  switch (type) {
    case "product":
      return _lucidereact.Package;
    case "order":
      return _lucidereact.ShoppingCart;
    case "page":
      return _lucidereact.FileText;
    case "blog":
      return _lucidereact.PenLine;
    case "user":
      return _lucidereact.Users;
    default:
      return _lucidereact.MessageSquare;
  }
}
function formatRelativeTime(date) {
  const now = /* @__PURE__ */ new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 6e4);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}
function ChatPanel() {
  useAutoChatContext();
  const router = _navigation.useRouter.call(void 0, );
  const { mode, setMode, togglePanel } = useChatPanel();
  const { context } = useChatContext();
  const conversationId = useChatStore((s) => s.conversationId);
  const startNewConversation = useChatStore((s) => s.startNewConversation);
  const addToHistory = useChatStore((s) => s.addToHistory);
  const conversationHistory = useChatStore((s) => s.conversationHistory);
  const loadConversation = useChatStore((s) => s.loadConversation);
  const removeFromHistory = useChatStore((s) => s.removeFromHistory);
  const clearHistory = useChatStore((s) => s.clearHistory);
  const scrollRef = _react.useRef.call(void 0, null);
  const inputRef = _react.useRef.call(void 0, null);
  const [inputValue, setInputValue] = _react.useState.call(void 0, "");
  const [aiError, setAiError] = _react.useState.call(void 0, null);
  const [showHistory, setShowHistory] = _react.useState.call(void 0, false);
  _react.useEffect.call(void 0, () => {
    if (!conversationId) {
      startNewConversation();
    }
  }, [conversationId, startNewConversation]);
  const transport = _react.useMemo.call(void 0, () => {
    return new (0, _ai.TextStreamChatTransport)({
      api: "/api/chat",
      body: {
        id: conversationId,
        context
      }
    });
  }, [conversationId, context]);
  const {
    messages,
    status,
    sendMessage,
    setMessages,
    stop,
    error
  } = _react3.useChat.call(void 0, {
    id: conversationId || void 0,
    transport,
    onError: (err) => {
      const errorMessage = err.message || "An error occurred";
      if (errorMessage.includes("AI is not enabled") || errorMessage.includes("No API key")) {
        setAiError("AI is not configured. Please add your API key in Settings > AI.");
      } else if (errorMessage.includes("rate limit")) {
        setAiError("Rate limit reached. Please try again later.");
      } else {
        setAiError(errorMessage);
      }
    },
    onFinish: ({ message }) => {
      setAiError(null);
      if (conversationId && messages.length > 0) {
        const firstUserMessage = messages.find((m) => m.role === "user");
        const firstUserText = firstUserMessage ? getMessageText(firstUserMessage) : "";
        const messageText = getMessageText(message);
        addToHistory({
          id: conversationId,
          title: (firstUserText == null ? void 0 : firstUserText.slice(0, 50)) || "New Chat",
          lastMessage: (messageText == null ? void 0 : messageText.slice(0, 100)) || "",
          context
        });
      }
    }
  });
  const handleLoadConversation = _react.useCallback.call(void 0, (id) => {
    loadConversation(id);
    setMessages([]);
    setShowHistory(false);
    setAiError(null);
  }, [loadConversation, setMessages]);
  const isLoading = status === "submitted" || status === "streaming";
  const isStreaming = status === "streaming";
  _react.useEffect.call(void 0, () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  const handleSend = _react.useCallback.call(void 0, async () => {
    var _a;
    if (!inputValue.trim() || isLoading) return;
    const messageContent = inputValue.trim();
    setInputValue("");
    setAiError(null);
    await sendMessage({ text: messageContent });
    (_a = inputRef.current) == null ? void 0 : _a.focus();
  }, [inputValue, isLoading, sendMessage]);
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const handleNewConversation = () => {
    startNewConversation();
    setMessages([]);
    setAiError(null);
  };
  const handleStop = _react.useCallback.call(void 0, () => {
    stop();
  }, [stop]);
  if (mode === "collapsed") {
    return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
      _framermotion.motion.div,
      {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0, opacity: 0 },
        transition: { type: "spring", stiffness: 400, damping: 25 },
        className: "fixed bottom-6 right-6 z-50",
        children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TooltipProvider, { children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, Tooltip, { children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TooltipTrigger, { asChild: true, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
              _chunkPWJHQH3Pjs.Button,
              {
                onClick: togglePanel,
                size: "icon",
                className: _chunkSKQV2OMQjs.cn.call(void 0, 
                  "h-14 w-14 rounded-full shadow-lg",
                  "bg-gradient-to-br from-primary to-primary/80",
                  "hover:scale-110 hover:shadow-xl hover:shadow-primary/20",
                  "active:scale-95",
                  "transition-all duration-200"
                ),
                children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Sparkles, { className: "h-6 w-6" })
              }
            ) }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TooltipContent, { side: "left", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { children: "Open AI Assistant" }) })
          ] }) }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "absolute inset-0 -z-10 rounded-full bg-primary/20 animate-ping" })
        ]
      }
    );
  }
  const isFullScreen = mode === "full";
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    _framermotion.motion.div,
    {
      initial: { x: 400, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 400, opacity: 0 },
      transition: { type: "spring", stiffness: 300, damping: 30 },
      className: _chunkSKQV2OMQjs.cn.call(void 0, 
        "fixed z-50 flex flex-col bg-background/95 backdrop-blur-xl border-l shadow-2xl",
        isFullScreen ? "inset-0" : "top-0 right-0 bottom-0 w-[420px] max-w-full"
      ),
      children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-muted/50 to-transparent", children: [
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Sparkles, { className: "h-4 w-4 text-primary" }) }),
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex flex-col", children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "font-semibold text-sm", children: "AI Assistant" }),
              context.type !== "general" && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "span", { className: "text-xs text-muted-foreground capitalize", children: [
                context.type,
                ": ",
                context.title || context.id
              ] })
            ] })
          ] }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "flex items-center gap-0.5", children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, TooltipProvider, { children: [
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, Tooltip, { children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TooltipTrigger, { asChild: true, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                _chunkPWJHQH3Pjs.Button,
                {
                  variant: "ghost",
                  size: "icon",
                  onClick: () => setShowHistory(!showHistory),
                  className: _chunkSKQV2OMQjs.cn.call(void 0, 
                    "rounded-lg transition-colors h-8 w-8",
                    showHistory ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  ),
                  children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.History, { className: "h-4 w-4" })
                }
              ) }),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TooltipContent, { children: "Conversation history" })
            ] }),
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, Tooltip, { children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TooltipTrigger, { asChild: true, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                _chunkPWJHQH3Pjs.Button,
                {
                  variant: "ghost",
                  size: "icon",
                  onClick: handleNewConversation,
                  className: "rounded-lg hover:bg-muted transition-colors h-8 w-8",
                  children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Plus, { className: "h-4 w-4" })
                }
              ) }),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TooltipContent, { children: "New conversation" })
            ] }),
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, Tooltip, { children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TooltipTrigger, { asChild: true, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                _chunkPWJHQH3Pjs.Button,
                {
                  variant: "ghost",
                  size: "icon",
                  onClick: () => setMode(isFullScreen ? "side" : "full"),
                  className: "rounded-lg hover:bg-muted transition-colors h-8 w-8",
                  children: isFullScreen ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Minimize2, { className: "h-4 w-4" }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Maximize2, { className: "h-4 w-4" })
                }
              ) }),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TooltipContent, { children: isFullScreen ? "Minimize" : "Maximize" })
            ] }),
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, Tooltip, { children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TooltipTrigger, { asChild: true, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                _chunkPWJHQH3Pjs.Button,
                {
                  variant: "ghost",
                  size: "icon",
                  onClick: () => setMode("collapsed"),
                  className: "rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors h-8 w-8",
                  children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.X, { className: "h-4 w-4" })
                }
              ) }),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TooltipContent, { children: "Close" })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _framermotion.AnimatePresence, { children: aiError && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _framermotion.motion.div,
          {
            initial: { height: 0, opacity: 0 },
            animate: { height: "auto", opacity: 1 },
            exit: { height: 0, opacity: 0 },
            className: "border-b border-destructive/20 bg-destructive/5 overflow-hidden",
            children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-3 px-4 py-3", children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.AlertCircle, { className: "h-4 w-4 text-destructive shrink-0" }),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm text-destructive flex-1", children: aiError }),
              aiError.includes("Settings") && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
                _chunkPWJHQH3Pjs.Button,
                {
                  variant: "outline",
                  size: "sm",
                  onClick: () => router.push("/admin/settings"),
                  className: "shrink-0",
                  children: [
                    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Settings, { className: "h-3 w-3 mr-1" }),
                    "Settings"
                  ]
                }
              )
            ] })
          }
        ) }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _framermotion.AnimatePresence, { children: showHistory && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _framermotion.motion.div,
          {
            initial: { opacity: 0, height: 0 },
            animate: { opacity: 1, height: "auto" },
            exit: { opacity: 0, height: 0 },
            className: "border-b bg-muted/30 overflow-hidden",
            children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "p-3", children: [
              /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center justify-between mb-3", children: [
                /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.History, { className: "h-4 w-4 text-muted-foreground" }),
                  /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-sm font-medium", children: "Recent Conversations" }),
                  /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "span", { className: "text-xs text-muted-foreground", children: [
                    "(",
                    conversationHistory.length,
                    ")"
                  ] })
                ] }),
                conversationHistory.length > 0 && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TooltipProvider, { children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, Tooltip, { children: [
                  /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TooltipTrigger, { asChild: true, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                    _chunkPWJHQH3Pjs.Button,
                    {
                      variant: "ghost",
                      size: "sm",
                      onClick: () => {
                        if (confirm("Clear all conversation history?")) {
                          clearHistory();
                        }
                      },
                      className: "h-7 text-xs text-muted-foreground hover:text-destructive",
                      children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Trash2, { className: "h-3 w-3" })
                    }
                  ) }),
                  /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TooltipContent, { children: "Clear history" })
                ] }) })
              ] }),
              conversationHistory.length === 0 ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "text-center py-6 text-muted-foreground", children: [
                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Clock, { className: "h-8 w-8 mx-auto mb-2 opacity-50" }),
                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm", children: "No conversation history yet" }),
                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-xs mt-1", children: "Start a conversation to see it here" })
              ] }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkHQVSQ2EOjs.ScrollArea, { className: "max-h-[200px]", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "space-y-1", children: conversationHistory.map((conv) => {
                const ContextIcon = conv.context ? getContextIcon(conv.context.type) : _lucidereact.MessageSquare;
                const isActive = conv.id === conversationId;
                return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
                  _framermotion.motion.div,
                  {
                    initial: { opacity: 0, x: -10 },
                    animate: { opacity: 1, x: 0 },
                    className: "group relative",
                    children: [
                      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                        "button",
                        {
                          onClick: () => handleLoadConversation(conv.id),
                          className: _chunkSKQV2OMQjs.cn.call(void 0, 
                            "w-full text-left p-2.5 rounded-lg transition-all duration-200",
                            "hover:bg-background/80 hover:shadow-sm",
                            isActive && "bg-primary/5 ring-1 ring-primary/20"
                          ),
                          children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-start gap-2.5", children: [
                            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                              "div",
                              {
                                className: _chunkSKQV2OMQjs.cn.call(void 0, 
                                  "flex size-7 shrink-0 items-center justify-center rounded-md",
                                  "bg-muted/80",
                                  isActive && "bg-primary/10"
                                ),
                                children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                                  ContextIcon,
                                  {
                                    className: _chunkSKQV2OMQjs.cn.call(void 0, 
                                      "h-3.5 w-3.5",
                                      isActive ? "text-primary" : "text-muted-foreground"
                                    )
                                  }
                                )
                              }
                            ),
                            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex-1 min-w-0", children: [
                              /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-2", children: [
                                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                                  "span",
                                  {
                                    className: _chunkSKQV2OMQjs.cn.call(void 0, 
                                      "text-sm font-medium truncate",
                                      isActive && "text-primary"
                                    ),
                                    children: conv.title || "Untitled Chat"
                                  }
                                ),
                                isActive && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full", children: "Active" })
                              ] }),
                              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-xs text-muted-foreground truncate mt-0.5", children: conv.lastMessage || "No messages" }),
                              /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-2 mt-1", children: [
                                conv.context && conv.context.type !== "general" && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "span", { className: "text-[10px] bg-muted px-1.5 py-0.5 rounded capitalize", children: [
                                  conv.context.type,
                                  conv.context.id && `: ${conv.context.id.slice(0, 8)}...`
                                ] }),
                                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-[10px] text-muted-foreground/70", children: formatRelativeTime(conv.updatedAt) })
                              ] })
                            ] })
                          ] })
                        }
                      ),
                      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TooltipProvider, { children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, Tooltip, { children: [
                        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TooltipTrigger, { asChild: true, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                          _chunkPWJHQH3Pjs.Button,
                          {
                            variant: "ghost",
                            size: "icon",
                            onClick: (e) => {
                              e.stopPropagation();
                              removeFromHistory(conv.id);
                            },
                            className: _chunkSKQV2OMQjs.cn.call(void 0, 
                              "absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100",
                              "hover:bg-destructive/10 hover:text-destructive transition-all"
                            ),
                            children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Trash2, { className: "h-3 w-3" })
                          }
                        ) }),
                        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TooltipContent, { children: "Remove from history" })
                      ] }) })
                    ]
                  },
                  conv.id
                );
              }) }) })
            ] })
          }
        ) }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkHQVSQ2EOjs.ScrollArea, { className: "flex-1 p-4", ref: scrollRef, children: messages.length === 0 ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
          _framermotion.motion.div,
          {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.5, delay: 0.2 },
            className: "flex flex-col items-center justify-center h-full text-center py-12",
            children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                _framermotion.motion.div,
                {
                  animate: {
                    boxShadow: [
                      "0 0 0 0 rgba(var(--primary), 0)",
                      "0 0 40px 10px rgba(var(--primary), 0.1)",
                      "0 0 0 0 rgba(var(--primary), 0)"
                    ]
                  },
                  transition: { duration: 3, repeat: Infinity },
                  className: "flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 mb-6",
                  children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Sparkles, { className: "h-8 w-8 text-primary" })
                }
              ),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                _framermotion.motion.p,
                {
                  initial: { opacity: 0 },
                  animate: { opacity: 1 },
                  transition: { delay: 0.4 },
                  className: "text-xl font-semibold",
                  children: "How can I help you?"
                }
              ),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                _framermotion.motion.p,
                {
                  initial: { opacity: 0 },
                  animate: { opacity: 1 },
                  transition: { delay: 0.5 },
                  className: "text-sm mt-2 max-w-[280px] text-muted-foreground",
                  children: "I can help you manage products, orders, content, navigate the admin panel, and more."
                }
              ),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                _framermotion.motion.div,
                {
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 },
                  transition: { delay: 0.6 },
                  className: "mt-6 grid grid-cols-2 gap-2 w-full max-w-[320px]",
                  children: SUGGESTED_ACTIONS.map((action, i) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                    _framermotion.motion.div,
                    {
                      initial: { opacity: 0, scale: 0.9 },
                      animate: { opacity: 1, scale: 1 },
                      transition: { delay: 0.7 + i * 0.1 },
                      children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
                        _chunkPWJHQH3Pjs.Button,
                        {
                          variant: "outline",
                          size: "sm",
                          className: "w-full justify-start text-left h-auto py-2.5 px-3 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200",
                          onClick: () => {
                            var _a;
                            setInputValue(action.label);
                            (_a = inputRef.current) == null ? void 0 : _a.focus();
                          },
                          children: [
                            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "mr-2", children: action.icon }),
                            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "truncate text-xs", children: action.label })
                          ]
                        }
                      )
                    },
                    action.label
                  ))
                }
              )
            ]
          }
        ) : /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "space-y-4", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _framermotion.AnimatePresence, { mode: "popLayout", children: messages.map((message, index) => {
            const { textParts, toolParts, reasoningParts } = processMessageParts(message);
            const isLastMessage = index === messages.length - 1;
            return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
              _framermotion.motion.div,
              {
                initial: { opacity: 0, y: 10, scale: 0.98 },
                animate: { opacity: 1, y: 0, scale: 1 },
                transition: {
                  duration: 0.3,
                  ease: [0.25, 0.46, 0.45, 0.94]
                },
                className: _chunkSKQV2OMQjs.cn.call(void 0, 
                  "flex gap-3",
                  message.role === "user" ? "flex-row-reverse" : ""
                ),
                children: [
                  /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                    "div",
                    {
                      className: _chunkSKQV2OMQjs.cn.call(void 0, 
                        "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center",
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/20"
                      ),
                      children: message.role === "user" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.User, { className: "h-4 w-4" }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Sparkles, { className: "h-4 w-4 text-primary" })
                    }
                  ),
                  /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
                    "div",
                    {
                      className: _chunkSKQV2OMQjs.cn.call(void 0, 
                        "flex-1 max-w-[85%] space-y-2",
                        message.role === "user" ? "flex flex-col items-end" : ""
                      ),
                      children: [
                        reasoningParts.length > 0 && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 border-l-2 border-primary/30", children: [
                          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "flex items-center gap-1 mb-1 font-medium", children: [
                            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Loader2, { className: "h-3 w-3 animate-spin" }),
                            "Thinking..."
                          ] }),
                          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "italic opacity-70", children: reasoningParts.map((p) => p.text).join("") })
                        ] }),
                        toolParts.map((tool, i) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
                          _framermotion.motion.div,
                          {
                            initial: { opacity: 0, x: -10 },
                            animate: { opacity: 1, x: 0 },
                            transition: { delay: i * 0.05 },
                            className: _chunkSKQV2OMQjs.cn.call(void 0, 
                              "text-xs rounded-lg px-3 py-2 flex items-center gap-2",
                              "bg-muted/50 border border-border/50"
                            ),
                            children: [
                              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                                "div",
                                {
                                  className: _chunkSKQV2OMQjs.cn.call(void 0, 
                                    "flex size-5 items-center justify-center rounded-md",
                                    tool.state === "result" ? "bg-green-500/10" : "bg-primary/10"
                                  ),
                                  children: tool.state === "result" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.CheckCircle2, { className: "h-3 w-3 text-green-600" }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Loader2, { className: "h-3 w-3 animate-spin text-primary" })
                                }
                              ),
                              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "font-medium", children: getToolName(tool) }),
                              tool.state === "result" && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-green-600 ml-auto", children: "Done" }),
                              (tool.state === "call" || tool.state === "partial-call") && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-muted-foreground ml-auto", children: tool.state === "partial-call" ? "Preparing..." : "Running..." })
                            ]
                          },
                          tool.toolCallId
                        )),
                        textParts.length > 0 && /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                          "div",
                          {
                            className: _chunkSKQV2OMQjs.cn.call(void 0, 
                              "rounded-2xl px-4 py-3",
                              message.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted/50 rounded-tl-sm"
                            ),
                            children: message.role === "assistant" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "div", { className: "prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-pre:my-2 prose-code:bg-muted prose-code:px-1 prose-code:rounded", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _reactmarkdown2.default, { remarkPlugins: [_remarkgfm2.default], children: textParts.map((p) => p.text).join("") }) }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-sm whitespace-pre-wrap", children: textParts.map((p) => p.text).join("") })
                          }
                        )
                      ]
                    }
                  )
                ]
              },
              message.id
            );
          }) }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _framermotion.AnimatePresence, { children: isLoading && /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
            _framermotion.motion.div,
            {
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: -10 },
              className: "flex gap-3",
              children: [
                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                  _framermotion.motion.div,
                  {
                    animate: { scale: [1, 1.05, 1] },
                    transition: { duration: 2, repeat: Infinity },
                    className: "flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/20 flex items-center justify-center",
                    children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Sparkles, { className: "h-4 w-4 text-primary" })
                  }
                ),
                /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2", children: [
                  /* @__PURE__ */ _jsxruntime.jsx.call(void 0, TypingDots, {}),
                  /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "text-xs text-muted-foreground", children: "Thinking..." })
                ] })
              ]
            }
          ) })
        ] }) }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "p-4 border-t bg-gradient-to-t from-muted/30 to-transparent", children: [
          /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
            _framermotion.motion.div,
            {
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.3, delay: 0.1 },
              className: _chunkSKQV2OMQjs.cn.call(void 0, 
                "flex items-end gap-2 rounded-xl border p-2",
                "bg-background/80 backdrop-blur-sm shadow-lg",
                "transition-all duration-300 ease-out",
                "border-border/50 hover:border-border",
                "focus-within:border-primary/50 focus-within:shadow-xl focus-within:shadow-primary/5",
                "focus-within:ring-2 focus-within:ring-primary/10"
              ),
              children: [
                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                  Textarea,
                  {
                    ref: inputRef,
                    value: inputValue,
                    onChange: (e) => setInputValue(e.target.value),
                    onKeyDown: handleKeyDown,
                    placeholder: "Ask me anything...",
                    className: _chunkSKQV2OMQjs.cn.call(void 0, 
                      "min-h-[44px] max-h-[120px] resize-none flex-1",
                      "border-none bg-transparent shadow-none",
                      "focus-visible:ring-0 focus-visible:outline-none",
                      "placeholder:text-muted-foreground/60"
                    ),
                    rows: 1,
                    disabled: isLoading
                  }
                ),
                /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _framermotion.motion.div, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, children: isStreaming ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                  _chunkPWJHQH3Pjs.Button,
                  {
                    onClick: handleStop,
                    size: "icon",
                    variant: "outline",
                    className: "h-10 w-10 rounded-full shrink-0 border-destructive/50 hover:bg-destructive/10 hover:border-destructive",
                    children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Square, { className: "h-4 w-4 text-destructive" })
                  }
                ) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                  _chunkPWJHQH3Pjs.Button,
                  {
                    onClick: handleSend,
                    disabled: !inputValue.trim() || isLoading,
                    size: "icon",
                    className: _chunkSKQV2OMQjs.cn.call(void 0, 
                      "h-10 w-10 rounded-full shrink-0",
                      "bg-gradient-to-br from-primary to-primary/80",
                      "shadow-md hover:shadow-lg hover:shadow-primary/20",
                      "transition-all duration-200",
                      "disabled:opacity-50 disabled:shadow-none"
                    ),
                    children: status === "submitted" ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _lucidereact.Send, { className: "h-4 w-4" })
                  }
                ) })
              ]
            }
          ),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "text-[10px] text-muted-foreground/50 text-center mt-2", children: "Press Enter to send, Shift+Enter for new line" })
        ] })
      ]
    }
  );
}








exports.Textarea = Textarea; exports.TooltipProvider = TooltipProvider; exports.Tooltip = Tooltip; exports.TooltipTrigger = TooltipTrigger; exports.TooltipContent = TooltipContent; exports.ChatPanel = ChatPanel;
//# sourceMappingURL=chunk-V746VSQL.js.map