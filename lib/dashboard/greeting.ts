/** The dashboard greeting's name (asserted by greeting.assert.ts). */
type UserLike = { displayName?: unknown; name?: unknown; primaryEmail?: unknown; email?: unknown } | null | undefined

export function firstName(user: UserLike): string | null {
  const name = user?.displayName ?? user?.name
  if (typeof name === "string" && name.trim()) return name.trim().split(/\s+/)[0]
  const email = user?.primaryEmail ?? user?.email
  if (typeof email === "string" && email.includes("@")) return email.split("@")[0]
  return null
}
