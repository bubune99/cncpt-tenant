/**
 * Which features a new site starts with, by the owner's plan. Moved out of the WHERE clause in
 * app/api/dashboard/subdomain (walk 2026-11-22, thin route); same rule. Asserted by tier-features.assert.ts.
 */

const RANK: Record<string, number> = { free: 0, pro: 1, enterprise: 2 }

/** A feature whose minimum plan is `minimumTier` is on for an owner on `tierName`. An unknown minimum is never on. */
export function tierAllows(minimumTier: string | null | undefined, tierName: string): boolean {
  if (minimumTier === "free") return true
  const need = minimumTier ? RANK[minimumTier] : undefined
  const have = RANK[tierName]
  return need !== undefined && have !== undefined && have >= need
}

/** The features (each with its minimum plan) a new site on `tierName` starts with; no plan reads as free. */
export function featuresForTier<T extends { minimum_tier: string | null }>(features: readonly T[], tierName: string | null | undefined): T[] {
  const tier = tierName || "free"
  return features.filter((f) => tierAllows(f.minimum_tier, tier))
}
