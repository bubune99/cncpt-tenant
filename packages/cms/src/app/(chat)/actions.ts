"use server";

import { cookies } from "next/headers";

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

export async function deleteTrailingMessages(messageId: string) {
  // TODO: Implement message deletion logic
  // This would typically interact with your database to delete messages
  console.log("Deleting trailing messages after:", messageId);
  return { success: true };
}
