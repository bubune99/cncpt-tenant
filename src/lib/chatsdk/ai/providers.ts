/**
 * AI providers for chatsdk artifacts
 * Configured to use Anthropic Claude models
 * - Sonnet 4: Main chat and artifacts (balanced intelligence and speed)
 * - Sonnet 4 + Reasoning: Extended thinking for complex tasks
 * - Haiku 4: Title generation (fast, cost-effective)
 */

import { anthropic } from "@ai-sdk/anthropic";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";

// Claude model IDs (valid as of 2025)
const CLAUDE_SONNET_4 = "claude-sonnet-4-20250514";
const CLAUDE_HAIKU_4 = "claude-haiku-4-20250414";

// Use Anthropic Claude models for the chat SDK
export const myProvider = customProvider({
  languageModels: {
    "chat-model": anthropic(CLAUDE_SONNET_4),
    "chat-model-reasoning": wrapLanguageModel({
      model: anthropic(CLAUDE_SONNET_4),
      middleware: extractReasoningMiddleware({ tagName: "thinking" }),
    }),
    "title-model": anthropic(CLAUDE_HAIKU_4), // Fast model for simple title generation
    "artifact-model": anthropic(CLAUDE_SONNET_4),
  },
});
