/**
 * The CNCPT workspace (cncptweb.com/dashboard) as seen from a site's CMS on any host: a tenant subdomain,
 * a client's own domain, a preview/staging tenant (tenant---deployment.vercel.app) or localhost.
 * Pure; check: workspace-href.assert.ts.
 */
export function workspaceHref(host: string, rootDomain: string): string {
  const h = host.toLowerCase()
  if (h.includes("---") && h.endsWith(".vercel.app")) return `https://${h.split("---").slice(1).join("---")}/dashboard`
  const root = rootDomain.replace(/^https?:\/\//, "").replace(/\/$/, "")
  const local = root.startsWith("localhost") || root.startsWith("127.0.0.1")
  return `${local ? "http" : "https"}://${root}/dashboard`
}
