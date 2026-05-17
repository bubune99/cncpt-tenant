# Tenant Admin Dashboard

_Started 2026-05-17 02:42 UTC_

---

## User

I need to now visualize the tenant admin dashboard and the necessary views for managing the subdomains team role based permissions and communications

## Assistant

_[tool: list_files]_

_[tool: local_ls]_

_[tool: read_file]_

_[tool: local_ls]_

_[tool: local_ls]_

_[tool: local_read]_

_[tool: local_read]_

_[tool: local_read]_

_[tool: local_read]_

_[tool: local_ls]_

_[tool: local_read]_

_[tool: local_read]_

_[tool: local_read]_

I see context now — the user wants the **tenant** admin views (different from the super-admin work already done). Let me look at the tenant-specific pages and the existing design vocabulary, then ask focused questions.

_[tool: questions_v2]_

Good — I have a thorough picture now. Before I design, I want to make sure I build the right thing. The existing wireframes you have are **super-admin** views; you're now asking for the **tenant admin** surface (the merchant-facing dashboard a customer uses to manage their own subdomains, team, and customer comms). Let me ask focused questions so I don't guess.

## User

Questions answered:
- scope: Subdomains & domains (list / create / DNS / visibility), Team & role-based permissions (members, roles, per-subdomain access), Communications inbox (support tickets / announcements / customer messaging), Tenant overview / home (KPI dash for the merchant), AI credits usage, Branding / white-label settings, Billing & subscription tier, Notifications & activity feed
- fidelity: mid/hi-fi on the artboard with the cncpt brand palette
- output: Brand-new canvas file just for tenant-admin (keeps super-admin work separate)
- comms_meaning: Support tickets the tenant's customers raise (inbound), Announcements / broadcast banners the tenant publishes to their customers, In-app messages between tenant team members, Notifications the tenant receives from CNCPT platform (system messages, billing, etc.), Email campaigns / newsletter to the tenant's customer list, Customer feedback (votes, feature requests) submitted on the tenant's site
- subdomain_depth: List of subdomains (all the tenant owns), Create-new flow (slug + initial settings), Custom domain / DNS management, Per-subdomain detail page (settings tabs), Visibility (public / private / coming soon), Per-subdomain branding (logo, colors, typography), Hosting / deployment status
- role_model: Both custom roles AND per-subdomain overrides (most expressive)
- permissions_ui: Simple list of toggles per role (clean, beginner-friendly)
- variations: 1
- persona: This is a web platform for ecommerce. Think shopify in that it is neutral to the industry or generalized commerce or blogging
- density: Spacious — generous whitespace, big cards, fewer items visible at once
- include_states: Invite-flow modal, Empty states (no subdomains, no team members yet), Confirmation / destructive-action dialogs (remove member, delete subdomain), Error / banner states
- extras: dns settings to be valid as to how it will look. We will also have an AI chat that will be useful in aiding users to fill out these details.

## Assistant

_[tool: update_todos]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: snip]_

Now let me build it. I'll create one new file: `Tenant Admin Canvas.html`, with chrome + screens split across a few JSX modules to keep files readable.

_[tool: write_file]_

Now the tenant shell — sidebar, topbar, AI helper dock, mock data:

_[tool: write_file]_

Now the screens. Starting with overview + subdomain views:

_[tool: write_file]_

Now team & permissions screens:

_[tool: write_file]_

Now communications and settings screens:

_[tool: write_file]_

Now settings: AI credits, billing, branding/white-label, workspace settings:

_[tool: write_file]_

Now the main canvas HTML file that wires everything together:

_[tool: write_file]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Built the tenant admin canvas — `Tenant Admin Canvas.html`. **18 screens + 4 modal states** across 6 sections, all on the brand-blue palette:

- **Top level** — Overview (KPIs, sites, activity, support, credits) + Notifications
- **Sites** — list, empty state, create wizard, detail with 5 tabs (Overview / Visibility / DNS / Branding / Hosting / Danger), DNS error state, delete confirm
- **Team** — Members list, Roles & Permissions toggle matrix, per-site access overrides matrix, invite modal, remove-member confirm, activity log
- **Communications** — Support inbox (3-pane with AI suggested reply), Announcements (banner preview), Email campaigns + automations, Team messages (channels + DMs), Customer feedback kanban
- **Account** — AI Credits pool, Billing & plan with invoice history, Workspace branding (white-label), Workspace settings

A contextual **"Ask CNCPT"** AI helper sits in the bottom-right of every screen — expanded on DNS, permissions, branding, tickets, and invite flows; collapsed elsewhere. DNS records are realistic (A / CNAME / MX / SPF / DKIM / DMARC) with a verification-fail variant.

Open on the **Sitemap** cover, then pan/zoom around the canvas. Let me know which screen you'd like to push to hi-fi first or what to add.

