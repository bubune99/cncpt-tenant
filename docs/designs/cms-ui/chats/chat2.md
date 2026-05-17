# Editors Layout Structure

_Started 2026-05-16 20:19 UTC_

---

## User

Continuing on with this, I need you to build out wireframs for the different editors. The page details editor page, the orders and product editors page, the customer detail and editor page included

## Assistant

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: update_todos]_

I'll build out four editor wireframes — Page, Order, Product, Customer — in the same Atlas v2 editorial style. Let me set up a todo and start.

_[tool: write_file]_

_[tool: write_file]_

Now the main app file and four editor components. Starting with shared helpers + the Page editor:

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Four editor wireframes in Atlas v2 style, stacked top-to-bottom:

- **E1 · Page editor** — content blocks list with a selected block expanded, page meta/SEO sidebar, activity timeline
- **E2 · Order editor** — line items + totals, pick/pack/ship/deliver tracker, event timeline, internal note, customer/shipping panel
- **E3 · Product editor** — media grid, short/long descriptions, variants table (M flagged sold-out), inventory bricks, pricing/channels sidebar
- **E4 · Customer editor** — five-up KPI bricks, 14-month cadence chart, order history, notes timeline, lifecycle stepper at "Loyal → VIP"

All four share the same masthead (breadcrumb · editable title · status pills · action buttons), tabs row, two-column body, and bottom save bar with keyboard hints and autosave state — so they read as a family.

## User

The pages editor is wrong logic. SO I will have a page builder dedicated to the front end. I need just the look of everything focused on the right side highlighted. A page preview available that is magazine style in a sense, but we don't need to actually edit content of the page. The orders looks alright for now, but I would becurioous how we would change it depending on the type of product if it was something more highly configurable or had any upload attachments. For the sake of myself fulfilling this, it would be nice if there was a way that I could check off different parts of the order as I got those ready and prepared them. the kanban that we saw previously focused on moving a whole order, but I am thinking even on the lines of sub order fulfilment and tracking. I will get to the product editor later on

## Assistant

_[tool: update_todos]_

Good notes. Two reworks:
1. **Page editor** → flip emphasis. Magazine-style preview on the left (read-only), highlighted settings/metadata panel on the right.
2. **Order editor** → support a configurable item with attachments, plus per-line-item sub-fulfillment checkboxes (pick → prepare → customize → pack, with item-level checkoffs).

_[tool: write_file]_

_[tool: write_file]_

_[tool: str_replace_edit]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Reworked both:

**E1 · Page editor** — flipped emphasis. Left is now a magazine-style preview of the rendered page (browser bar → masthead → hero with figure caption → featured grid → editorial pull-quote, all in editorial type with marginal section numbers). Right is the highlighted settings panel — paper-3 background, inset accent rule, "Editing · settings" eyebrow — holding status, SEO, schedule, access, versions, and at-a-glance stats. Copy under the eyebrow points editors to the page builder for actual content work.

**E2 · Order editor** — three line items, mixed states:
- **Custom embroidered apron** (configurable) — chosen-options grid, three attachments (SVG/PDF/IMG pills with download), inline customer note, and a 5-step sub-flow (Pick blank ✓ · Confirm spec ✓ · Embroider · QC · Pack) with the middle step shown active
- **Dahlia tee · M** — standard 3-step flow, only Pick checked
- **Marigold cap** — fully complete, shown muted with a ✓ READY badge

A new aggregate progress strip at the top shows 6/11 sub-tasks across all items, segmented per-item, and the Ship button is disabled "waiting" until everything is checked off. The save bar caption updates with the count.

I left the Customer editor unchanged. Will leave Products for when you're ready.

## User

Verifier agent check completed

## Assistant

Verifier confirmed both reworks check out. Ready for Products whenever.

