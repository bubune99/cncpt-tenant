# Atlas Product Editor — navigation walkthrough

A guided tour of the per-tenant admin product editor
(`/admin/products/[id]`). The editor follows the Atlas design memo:
**tabs are workspaces, edits happen inline in the grid, single-row deep
edits open a drawer, and modals are only for confirmations.**

The masthead (top) shows the product type pill, title, status
(`ACTIVE`/`DRAFT`), `N variants · M custom fields`, **Preview ↗**, the
save state, and **⌘S Save / Create**. The bottom action bar shows
context shortcuts (`T switch type · P pricing · V variants`).

---

## 1 · DETAIL
The core record. **§1 Core details** — title, slug (with **Auto**
generate), base SKU, barcode, description, status, and the **Featured**
toggle. **§2 Categories** — storefront collection chips (multi-select).
This is the only tab a brand-new product opens with; save it before the
variant/field/media surfaces unlock.

## 2 · MEDIA
Two sections:
- **§1 Images** — the product gallery (Add image, reorder, alt text, remove).
- **Bulk assign to variants** (design **F3**, variable products) — a library
  strip + a variant×slot grid grouped **by colour** (Cover · Alt 1 · Alt 2 ·
  Detail · Studio), a **Bulk assign** panel, and a **Coverage** read-out
  (e.g. "Cover · 0/9 · 9 missing"). Select library images + target colour
  groups, then **Assign** to set each variant's cover image. *(Schema stores
  one image per variant, so only the Cover slot persists today.)*

## 3 · VARIANTS  *(variable products)*
The heart of the editor. A **View switch** (top-right) flips between three
co-equal views; the filter/sort/columns toolbar sits to the left.

- **LIST** — an Excel-style spreadsheet. **Double-click** a cell to edit
  price, cost, stock, weight or SKU. **⌘/Shift-click** rows to select, then
  the **bulk bar** appears (Set price · Set stock). Attached custom fields
  show as extra **FIELD** columns. Shortcuts: `↵ edit · ⌫ clear · ⌘D fill
  down · ⌘F find · Esc deselect`. **Save persists every variant edit.**
- **MATRIX** — a crosstab of the two option axes (e.g. **Colour × Size**)
  with stock-heat colouring (sold-out = accent, low = gold). Toggle the cell
  metric (stock / price / pace / cost). Click a cell to select; click a row
  or column header to bulk-select; **Set stock** writes through. Row, column
  and grand totals update live. Single-option products collapse to one axis.
- **CARDS** — a browsable card grid (option label, SKU, price/cost,
  colour-coded on-hand, status, custom-field chips). Browse here; edit in
  List or Matrix.

## 4 · FIELDS  *(design F5)*
A **global custom-field library** attached per product, with per-variant
values. Left: the **type palette** (Text · Number · Toggle · Select · Multi
· Color · Image · Date · URL · Long) + saved-field library. Middle:
**Attached to this product** — each row toggles **Required** and **In grid**
(show as a Variants column) and can be detached. Right: the **new-field
editor**. Values are set per-variant in the Variants grid's FIELD columns,
so two variants can hold different values for the same field.

## 5 · PRICING
Base price + margin, quantity/member tier pricing, a live **sale schedule**
with a calendar strip, and linked **discount codes**. Tier and schedule CRUD
persist; member pricing + linked discounts are read/light-write.

## 6 · INVENTORY
Track-inventory toggle, stock, low-stock threshold, backorder, and the
**Shipping** section (weight + L/W/H).

## 7 · CHANNELS
Web publish status, **Stripe sync** (push product + variant prices to
Stripe), and read-only Shopify sync status.

## 8 · SEO
Meta title + description with live character counters and a Google result
preview.

## 9 · TYPE
Switch product type (Simple · Variable · Digital · Service · Subscription ·
Bundle). Each type reshapes which tabs appear; destructive switches
(e.g. → Bundle archives variants) warn first. Type-specific tabs:
**Contents** (Bundle), **Files/Licenses** (Digital), **Schedule** (Service),
**Billing** (Subscription).

---

### What's wired & verified (June 2026)
Variant persistence, Matrix crosstab, spreadsheet bulk price/stock, Cards
view, Fields tab (F5), Media bulk-assign (F3), Pricing tiers + sale
schedules, Stripe sync, Detail/Inventory/Channels/SEO.

### Known gaps (not yet wired)
Bundle item add/remove/qty (Contents), Digital license-key generation (no
backing API yet), in-editor option creation for brand-new variable products
(options are created via the product PUT), spreadsheet fill-handle drag, and
the single-row inspector drawer.
