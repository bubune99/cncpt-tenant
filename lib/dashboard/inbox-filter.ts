/** The Support inbox's status channels (asserted by inbox-filter.assert.ts). */
export type ChannelId = "all" | "open" | "in_progress" | "resolved" | "closed"
export const CHANNELS: { id: ChannelId; label: string }[] = [
  { id: "all", label: "All tickets" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In progress" },
  { id: "resolved", label: "Resolved" },
  { id: "closed", label: "Closed" },
]
export interface InboxStats { open: number; inProgress: number; resolved: number; closed: number; total: number }

export function ticketsIn<T extends { status: string }>(tickets: T[], channel: ChannelId): T[] {
  return channel === "all" ? tickets.slice() : tickets.filter((t) => t.status === channel)
}

/** null while the stats are not known: the count is then not shown, never as 0. */
export function channelCount(stats: InboxStats | null, channel: ChannelId): number | null {
  if (!stats) return null
  return channel === "all" ? stats.total : channel === "in_progress" ? stats.inProgress : stats[channel]
}
