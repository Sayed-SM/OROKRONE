# OROKRONE Storefront UX and Admin Content Implementation Plan

> **For agentic workers:** Use the Native approach in this OpenCode session. Follow the task order, test-first, and do not deploy a database migration without explicit confirmation.

**Goal:** Fix the reported storefront and checkout problems, make shipping and editable home-page content persist through Supabase, and polish responsive interactions without changing OROKRONE’s monochrome brand.

**Architecture:** Keep the existing vanilla ES-module architecture. Use `db.js` for shipping CRUD and a focused storefront-settings module for public reads/admin writes; secure settings with RLS and the existing `is_admin()` function. Keep local/demo behavior explicit and never report a local-only save as a database save.

**Tech Stack:** HTML, CSS, JavaScript ES Modules, Supabase Postgres/Auth/Storage, Node built-in test runner, in-app Chromium browser.

**Spec:** User feedback on storefront/checkout/admin elements in the current OpenCode conversation, plus the project’s `AGENTS.md` and `OROKRONE_KNOWLEDGE_BASE.md`.

## Global Constraints

- Preserve the existing pure HTML/CSS/JS architecture and avoid adding dependencies/build tooling.
- Maintain Arabic/English strings, RTL/LTR layout, keyboard access, visible focus, and reduced-motion behavior.
- Keep the monochrome luxury identity and existing design tokens.
- Never expose a Supabase service-role key in browser code; admin writes rely on RLS and `is_admin()`.
- Local/demo fallback must not be presented as a successful remote save.
- Do not apply/deploy Supabase schema changes without explicit user confirmation.
- Do not discard existing files or user changes; repository was clean before this plan.

## Review Focus

- Checkout selector overlays content while `hidden`; test closed state, outside click, keyboard selection, and text-field entry.
- Empty showroom selection currently falls back to featured products; test that removing all products clears the stage.
- Supabase settings table does not exist yet; test the migration’s RLS/grants and ensure UI reports a missing migration rather than claiming success.
- Shipping values affect client totals and server-side order validation; test edited active rates are consistent and inactive rates are not selectable.
- Responsive/RTL and reduced-motion regressions are possible in custom controls; test keyboard, AR/EN, mobile widths, and reduced-motion.

---

### Task 1: Checkout interaction and storefront navigation fixes

**Files:**
- Modify: `assets/css/components.css`
- Modify: `assets/js/pages/checkout.js`
- Modify: `assets/js/components/header.js`
- Modify: `assets/css/pages.css`
- Test: Browser regression checks on `checkout.html` at desktop/mobile widths

**Interfaces:**
- Existing `#gov-panel[hidden]`, `#gov-trigger`, `#gov-search`, `#gov-list`, and hidden `#governorate` remain the selector contract.
- Existing `validateForm()` and `placeOrder()` behavior remains unchanged.

- [ ] **Step 1: Reproduce the failing behavior** — in Chromium, verify `#gov-panel.hidden === true` while computed display is currently `flex`; confirm it overlays fields and can receive focus.
- [ ] **Step 2: Add/record the failing regression assertion** — closed governorate panel must have `display:none`; selecting an option must close it without preventing city/address entry or checkout submission.
- [ ] **Step 3: Implement the fix** — add an explicit `[hidden]` display rule; outside-click close must not steal focus from the clicked city/address field, while Escape/selection may restore focus to the trigger; preserve keyboard access and improve empty/no-rates feedback.
- [ ] **Step 4: Hide the storefront’s “Admin” entry from the customer mobile drawer** — keep the protected admin URL and existing auth guard intact.
- [ ] **Step 5: Fix offer CTA hit-testing** — ensure decorative pseudo-elements cannot intercept the copy-code button.
- [ ] **Step 6: Verify** — keyboard/pointer checkout in Arabic and English, form typing, required validation, and CTA copy feedback; no console errors.

### Task 2: Supabase-backed shipping-rate management

**Files:**
- Modify: `assets/js/lib/db.js`
- Create: `assets/js/lib/shipping-rates.js` (pure validation/normalization)
- Modify: `assets/js/pages/admin/app.js`
- Modify: `admin/layout.js`
- Create: `admin/shipping.html`
- Modify: `assets/js/i18n/ar.js`, `assets/js/i18n/en.js`
- Test: Node tests for rate normalization; Chromium admin and checkout checks

**Interfaces:**
- Export `normalizeShippingRate(rate)` from `shipping-rates.js`; add `admin.listShippingRates()`, `admin.saveShippingRate(rate, originalGovernorate)`, and `admin.deleteShippingRate(governorate)` in `db.js`.
- Keep public `getShippingRates()` returning only active database rows; never replace an intentionally empty remote result with seed rates.

- [ ] **Step 1: Write failing tests** — validate non-empty governorate names, non-negative finite fees, duplicate/rename handling, and inactive-rate exclusion.
- [ ] **Step 2: Run them and confirm the expected failures.**
- [ ] **Step 3: Implement methods using the existing `shipping_rates` table and admin RLS; update/rename by the original primary key; preserve local demo fallback only in demo mode.**
- [ ] **Step 4: Add an accessible AR/EN admin screen** — list all 27 rates including inactive ones; add/edit/toggle/delete with confirmation, validation, saving feedback, and explicit backend errors.
- [ ] **Step 5: Verify** — edit one rate in a safe test context, reload admin and storefront, confirm the same active value reaches checkout totals and server validation; do not create a real order.

### Task 3: Database-backed homepage settings and manager editing

**Files:**
- Create: `assets/js/lib/storefront-settings.js`
- Create: `assets/js/lib/storefront-settings-schema.js` (pure defaults/sanitization, Node-testable)
- Modify: `assets/js/lib/db.js`, `assets/js/pages/home.js`, `assets/js/pages/admin/app.js`, `admin/layout.js`
- Create: `admin/content.html`
- Modify: `admin/showcase.html` if the shared renderer requires it
- Modify: `assets/js/i18n/ar.js`, `assets/js/i18n/en.js`
- Create: `C:\Users\opencode2.SAYED\_private_project_files\supabase\migrations\005_storefront_settings.sql` (the existing migration bundle lives outside the Git worktree)
- Test: `tests/storefront-settings.test.js`; Node tests; Chromium admin/home checks

**Interfaces:**
- Export `normalizeStorefrontSettings(raw)` and `DEFAULT_STOREFRONT_SETTINGS` from `storefront-settings-schema.js`.
- `getStorefrontSettings()` returns sanitized settings from the public-read Supabase row, merging missing fields with defaults.
- `saveStorefrontSettings(settings)` validates and upserts the singleton settings row; remote failures are surfaced, not silently saved to localStorage.
- Settings schema contains bilingual announcement, trust-strip items, craft copy/features/stats, and showcase heading/lead/theme/background/product IDs.

- [ ] **Step 1: Write failing unit tests first** — defaults, unknown/malformed values, bilingual content, `productIds: []` as an intentional empty selection, and URL/file validation.
- [ ] **Step 2: Run tests and confirm they fail for the missing settings contract.**
- [ ] **Step 3: Implement the pure normalization/default API and make its tests pass.**
- [ ] **Step 4: Add the `storefront_settings` singleton migration** — JSONB settings, updated timestamp, public SELECT, authenticated admin-only writes through `is_admin()`, and explicit grants; do not put secrets in settings.
- [ ] **Step 5: Connect public home rendering to asynchronous database reads** — render announcement, trust, craft, and showcase from the same row; keep safe defaults when the migration is absent; do not silently use stale localStorage as production truth.
- [ ] **Step 6: Connect admin forms** — content screen for announcement/trust/craft, showcase editor for current showcase; add upload/preview/remove using the existing `product-images` bucket; save selected-product removals exactly (including empty selection).
- [ ] **Step 7: Verify** — admin edits persist after refresh and appear in a separate public tab; unauthorized writes are denied; missing-table state is a clear actionable error; image selection/removal visibly updates the public hero; no production order or destructive data changes.

### Task 4: Visual and responsive polish

**Files:**
- Modify: `assets/css/components.css`, `assets/css/pages.css`, `assets/css/showcase.css`
- Modify: `assets/js/pages/shop.js`, `shop.html`, and `assets/js/i18n/ar.js`/`en.js` for the accessible custom sort menu
- Modify: `assets/js/components/header.js` only for footer information hierarchy
- Test: Chromium screenshots and keyboard checks at desktop/tablet/mobile, AR/EN, reduced motion

**Interfaces:**
- Preserve existing sorting values: `featured`, `new`, `price_asc`, `price_desc`, `rating`.
- The custom sort menu retains those values and exposes menu/menuitemradio semantics, keyboard navigation, Escape, outside-click close, and a visible selected value.

- [ ] **Step 1: Capture baseline screenshots and write behavior checks for sort selection, card hover/focus, stage overflow, and footer density.**
- [ ] **Step 2: Tune category/product card hover and keyboard-focus states to share one restrained motion language; respect `prefers-reduced-motion`.**
- [ ] **Step 3: Make the showroom scale and controls usable across viewport widths without changing product selection behavior.**
- [ ] **Step 4: Replace the native select popup with an accessible custom popover** — retain an underlying form value for existing sort logic, expose a menu button with radio menu items, support arrows/Enter/Space/Escape/outside click, focus management, and AR/EN labels.
- [ ] **Step 5: Simplify footer columns, repeated links, spacing, and contact hierarchy while preserving useful navigation.**
- [ ] **Step 6: Verify** — screenshot and test at 360px, 768px, and desktop widths; verify no horizontal overflow, focus obscuration, or AR/EN regressions.

### Task 5: Integration verification and handoff

**Files:** all files above; no additional code unless verification finds a defect.

- [ ] Run the new Node tests and any runnable existing tests; report the existing private-folder test harness issue if it remains.
- [ ] Run an AR/EN browser pass across home, shop, checkout, and admin content/shipping pages.
- [ ] Confirm live Supabase has 13 products and 27 shipping rates; verify the new settings table only after user authorizes migration deployment.
- [ ] Check `git status`, preserve untracked/user files, and list the exact files changed.
- [ ] Clearly separate locally verified behavior, database migration written but not deployed, and any task blocked on credentials/authorization.
