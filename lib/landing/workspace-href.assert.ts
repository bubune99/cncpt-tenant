/**
 * From a site's CMS, the way back to the CNCPT workspace (walk 2026-11-20, agency-overview: inside
 * dzidzor.cncptweb.com/admin nothing led back). Run: tsx lib/landing/workspace-href.assert.ts
 */
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { workspaceHref } from "./workspace-href"

assert.equal(workspaceHref("dzidzor.cncptweb.com", "cncptweb.com"), "https://cncptweb.com/dashboard")
assert.equal(workspaceHref("www.cncptweb.com", "cncptweb.com"), "https://cncptweb.com/dashboard")
// A staging or preview tenant (tenant---host.vercel.app) goes back to that same deployment.
assert.equal(workspaceHref("dzidzor---cncpt-staging-far-grace.vercel.app", "cncptweb.com"), "https://cncpt-staging-far-grace.vercel.app/dashboard")
assert.equal(workspaceHref("dzidzor.localhost:3000", "localhost:3000"), "http://localhost:3000/dashboard")
// A client's own domain still goes to the platform.
assert.equal(workspaceHref("www.projectdzidzor.org", "cncptweb.com"), "https://cncptweb.com/dashboard")
const shell = readFileSync(new URL("../../app/s/[subdomain]/admin/AdminShell.tsx", import.meta.url), "utf8")
assert.match(shell, /data-tour-id="header-all-sites"/, "the top bar has All sites")
assert.match(shell, /data-tour-id="nav-all-sites"/, "the account area has All sites")
assert.match(shell, /data-tour-id="header-visit-site"/, "the top bar has Visit site (owner note 2026-05-04)")
assert.match(shell, /<ThemeToggleAdmin \/>/, "the top bar has the light/dark switch (owner note 2026-06-17)")
const overview = readFileSync(new URL("../../app/dashboard/canvas/canvas-overview.tsx", import.meta.url), "utf8")
const shellDash = readFileSync(new URL("../../app/dashboard/canvas/canvas-shell.tsx", import.meta.url), "utf8")
assert.match(overview, /data-ui="overview.open_site"[\s\S]{0,300}new CustomEvent\("open-site"/, "Overview site rows open the site")
assert.match(shellDash, /addEventListener\("open-site"/, "the dashboard shell opens the site page")
assert.match(overview, /aria-label="Dismiss"[^>]*onClick=\{\(\) => setBannerDismissed\(true\)\}/, "the setup banner's close button has a name")
console.log("ok - a site's CMS links back to the workspace; Overview rows open their site; the banner close is named\n\n3 checks passed")
