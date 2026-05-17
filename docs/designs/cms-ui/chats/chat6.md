# Customer Dashboard Views

_Started 2026-05-17 10:00 UTC_

---

## User

Can you build out the rest of teh views for the customer dashboard including the mobile version

## Assistant

_[tool: read_file]_

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: update_todos]_

I'll build out the remaining customer-facing views — orders list, subscriptions, wishlist, returns, loyalty, and settings — plus additional mobile screens. Let me plan and start writing.

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

Now let me add the missing CSS classes (chip, sub-card, link-arrow, sub-thumb, sub-schedule, sched-pip) and wire the new frames into the main HTML file.

_[tool: str_replace_edit]_

Now wire all the new frames into the script tags and main:

_[tool: str_replace_edit]_

Now update the main to include the new frames in the page sequence:

_[tool: str_replace_edit]_

Also update the doc head copy since there are now many more frames:

_[tool: str_replace_edit]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Built out the rest of the customer dashboard — six new desktop views and two additional mobile sets:

**Desktop (D3–D9):**
- Orders list with status/year chip filters
- Subscriptions with schedule strip + skip/swap/pause actions
- Wishlist grid with back-in-stock / sale / OOS / purchased tags
- Returns & exchanges with eligible-window items, how-it-works, past-returns ledger, and a store-credit hero card
- Loyalty with tier hero, points balance, redeemable rewards, and activity log
- Settings · Addresses + Payment (defaults, cards, PayPal)
- Settings · Profile + Notifications (3-channel matrix: email/SMS/app)

**Mobile (M2–M3):** orders list, subscription manage, wishlist, loyalty, addresses/pay, notifications — all using the same phone frame and tab bar as the existing two phones.

All views inherit white-label theming so the Tweaks panel still re-skins everything across all 12 frames at once. New CSS primitives added (`.chip`, `.link-arrow`, `.sub-card`, `.sub-schedule`) so they're reusable.

