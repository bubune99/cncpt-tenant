export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Claude Sonnet",
    description: "Balanced intelligence and speed for everyday tasks",
  },
  {
    id: "chat-model-reasoning",
    name: "Claude Sonnet (Extended Thinking)",
    description: "Uses extended thinking for complex reasoning tasks",
  },
];
