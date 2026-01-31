export const DEFAULT_CHAT_MODEL: string = "anthropic/claude-sonnet-4.5";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "anthropic/claude-sonnet-4.5",
    name: "Claude 4.5 Sonnet",
    description: "Balanced performance and cost for most tasks",
  },
  {
    id: "anthropic/claude-haiku-4.5",
    name: "Claude 4.5 Haiku",
    description: "Fast and cost-effective for simple tasks",
  },
  {
    id: "anthropic/claude-opus-4.5",
    name: "Claude 4.5 Opus",
    description: "Most capable model for complex tasks",
  },
];
