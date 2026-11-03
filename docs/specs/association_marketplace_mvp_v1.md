# Association Commerce Marketplace — MVP Build Specification v1.0

**Status:** Build-ready initial specification; intentionally iterative, not a frozen scope.  
**Primary market:** Denmark. **Language:** Danish UI initially.  
**Purpose:** Build a real, maintainable multi-sided platform enabling businesses to discover and purchase exposure and activation products from associations, with campaign planning, approvals, delivery evidence, and post-campaign invoicing.

## 0. Mandatory instructions for Claude

1. **Build working software, not a mockup.** Persist real records in a database, implement authentication/authorization, enforce server-side validation, and provide executable setup instructions.
2. **The specification is changeable after coding starts.** Treat all non-final business decisions as configurable defaults. Never argue that an early implementation is immutable. For each new change request: summarize impact, propose smallest safe implementation, implement after approval where consequential, add tests, update docs, and commit.
3. **Do not build everything in one pass.** Begin with a brief implementation plan, proposed architecture and repo structure, and questions limited to genuine blockers. Then deliver vertical slices, with a runnable application at each milestone.
4. **Developer handover is a primary deliverable.** The project must be comprehensible and operable by a professional developer independent of Claude. No proprietary opaque builder lock-in, no hidden runtime-only business logic.
5. **Owner controls the repository, infrastructure, domain, accounts, secrets and data.** Never commit credentials. Provide `.env.example` and deployment/runbooks.
6. **Keep a `README.md`, `DECISIONS.md`, `CHANGELOG.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `BACKLOG.md` and `docs/CHANGE_PROCESS.md`.** Document changes as they occur. Keep this original specification under `docs/specs/`.
7. **Separate decided requirements from assumptions.** If unresolved, choose a reversible and explicitly labeled default, or ask only if the issue blocks development. Do not silently invent contractual or financial policies.
8. **Protect existing records.** Use migration scripts, backups, stable IDs, soft-delete/archive where needed, and immutable snapshots of confirmed campaign terms, line-item prices, fees and deliverables. Changes to catalogs must not retroactively alter agreed campaigns.
9. **Run automated checks** for auth, permissions, matching, budgets, campaign status transitions, financial calculations, and data migrations. Provide tests and a concise test report per milestone.
10. **Use clear Danish UI copy**, responsive layouts and accessible controls. No invented performance or reach metrics presented as factual.

## 1. Product vision and principles

Associations (initially sports clubs, potentially cultural and other associations later) have under-monetized channels and local relationships. Businesses need an easy way to buy standardized or bespoke local marketing opportunities across one or many associations. The platform makes inventory searchable, comparable, purchasable through campaigns, executable, documented and financially settled.

**Design priorities:**
- Fast first purchase of local exposure, not over-engineered optimization.
- Inclusion: avoid excluding small or new associations due to missing historic reach/performance data.
- Standardized products plus custom association products.
- Two purchasing journeys: recommended campaign package **and** manual discovery/product selection, sharing one campaign builder.
- Both map and list discovery, sharing filters and cart.
- Company self-service **and** founder-assisted campaign creation, using same backend and editor. No salaried campaign/sales team assumed for MVP.
- Association self-service onboarding by default; optional **book a video onboarding appointment** using an external scheduling link; founder assists together with association. Not an admin-created-profile-first model.
- Companies pay **after** campaign completion; signed/accepted campaign terms before execution.
- Configurable rules, modular architecture, developer handover, iterative delivery.

## 2. Personas and roles

- **Association owner/admin:** creates and edits own association profile, channels, products, category exclusions, campaign invitations, deliverables, evidence and payment details (sensitive details only when necessary).
- **Company owner/admin:** company profile, campaigns, search, basket, approvals, reporting and invoice status.
- **Platform admin:** approves associations/custom products, manages catalog and pricing rules, assists campaigns, manages statuses, documentation, invoice records, payouts, and audit trail.
- **Optional future roles:** association collaborators, company team members, supplier accounts. Do not fully implement unless necessary for MVP.

Enforce tenant isolation: users must never read/write another association's or company's private records. Admin privileges must be server-enforced and audited.

## 3. Association onboarding (self-service first)

Onboarding should target 5–10 minutes for essential setup (aspirational, validate in pilot). Save draft at each step; resume later. Only essential fields required upfront.

Steps:
1. Register account and association identity: name, type, address/region, contact, CVR if available; verify email.
2. Profile: description, activity type, membership count (optional), member age bands if appropriate and aggregated, facilities, locality.
3. Channels and inventory: website, social media links and follower counts, newsletter audience, physical locations, events. Distinguish audience counts from actual measured reach.
4. Choose standard catalog products and configure deliverability/capacity; optionally propose custom products.
5. Declare excluded advertiser industries / sponsorship category conflicts, optionally expiration dates; other constraints.
6. Preview, submit, activate after necessary checks.

Offer a visible **Book onboarding help** action at relevant steps. MVP may link to an externally configured booking page (e.g. Calendly or Microsoft Bookings); no custom scheduling engine. An admin may guide the association over a call and use authorized editing tools; never share passwords.

Allow association to edit after onboarding; historical confirmed campaign snapshots remain unchanged.

## 4. Catalog and inventory

Catalog category seeds (data, not hard-coded enums):
1. Digital exposure: social posts, newsletter placements, website visibility.
2. Physical exposure: banners, posters, clubhouse visibility.
3. Member activation: competitions, samples, local activities.
4. Member offers/sales: discounts, offers, affiliate or tracked codes.
5. Events: tournaments, community events, local activations.
6. Bespoke partnerships: association-defined products and custom opportunities.

**Two product types:**
- Platform-standard template, with standardized description, minimum deliverables, suggested/controlled pricing rules and required evidence.
- Association-created custom product, with title, category, description, unit, price proposal, capacity, availability and evidence expectations; admin approval before publication in MVP.

Each sellable association offering references a catalog template (or custom definition) and contains association-specific availability, channel metrics, capacity, optional media and delivery requirements. Store monetary values in integer minor units and currency; use explicit tax treatment. Product and category records are editable and archivable; never delete records referenced by confirmed campaigns.

**Pricing:** Initial standardized price approach is a product direction, but final authority for custom pricing and commission mechanics is OPEN. Implement pricing configuration and record actual agreed price snapshots. Illustrative prototype prices are NOT contractual or final.

## 5. Company experience and campaign builder

Company creates profile and may choose:
- **Get a campaign recommendation:** goal(s), geography (specific municipality/region/radius), budget range, dates/duration, company industry, target audience where relevant, preferred products, notes.
- **Browse and build yourself:** map/list toggle; common geographic/category/product filters; view individual association profile and products; add specific offerings to campaign cart.
- **Get help:** request founder assistance; admin uses the same builder to prepare a draft on behalf of the company, company reviews and confirms.

Both flows converge into a **professional campaign workspace**, not a bare quantity-only shopping cart. Must show:
- Selected associations with names, locations, descriptions, available products and availability.
- Product-level quantities, prices, delivery dates/period, estimated vs measured reach distinctions, obligations, and evidence requirements.
- Editable selection: add/remove/swap associations and products; live recalculation of totals; clear budget comparison.
- Map/list synchronization, simple filters, optional explanations for recommendations.
- Draft save/resume; campaign summary and explicit confirmation checkpoints.
- A clean responsive UI with meaningful empty/loading/error states.

Do not require detailed marketing analytics for initial purchase. Do not make a fictitious map or fictional association inventory look real in production.

## 6. Matching and recommendations

**Chosen optimization principle:** best overall campaign value (balanced exposure, activation, geographic coverage, cost and feasible delivery). **Critical nuance:** do not over-filter or over-optimize; businesses must still be able to discover and purchase from smaller or new associations.

MVP recommendation engine:
1. Hard-exclude only clear impossibilities: association inactive/unapproved, explicit industry exclusion, unavailable offering, impossible date/capacity, or out-of-scope geography when explicitly constrained.
2. Rank available offerings using simple configurable heuristics: objective/product match, geography, affordable price, optional audience indicators, capacity. Historical results must NOT be required.
3. Produce an understandable, editable campaign suggestion within the selected budget, preferably with some diversity of association types and locations.
4. Always offer **Browse all available opportunities** and manual additions outside the recommended package where feasible.
5. Show grounded reasons for suggested matches. Do not claim predictive performance.
6. Keep weights/rules in a well-isolated service/configuration; write deterministic tests. No AI dependency required in MVP.

Note: ranking weights previously discussed (30/25/20/15/10) were illustrative and **not approved as fixed requirements**.

## 7. Campaign lifecycle and approvals

Model states with explicit transitions and permission checks. Suggested statuses:
`draft` → `submitted` → `awaiting_association_responses` → `ready_for_company_confirmation` → `confirmed` → `active` → `delivery_review` → `completed` → `invoiced` → `paid` → `settled`; plus `cancelled`, `disputed` as applicable.

- Company submits campaign request; not yet a binding order.
- Association receives invitation for specific offerings and terms; accepts, declines, or requests clarification. Suggested 72-hour response window is a **configurable proposal, not final policy**.
- Unaccepted items may be replaced; company sees changes and approves the final scope and commercial terms before execution.
- **Binding agreement/terms** must be captured before the campaign begins, even though payment is post-campaign. Exact legal wording and contract method need legal review; MVP may capture an auditable explicit acceptance with timestamp, identity and versioned terms.
- For confirmed campaigns, capture snapshots of line items, quantities, prices, dates, fee split, terms, and association acceptance.
- Prevent accidental status skips and duplicate invitations/charges. Notify participants (email integration can be minimal and replaceable).

## 8. Execution and evidence

For each confirmed campaign line, create delivery tasks with due dates, instructions, creative assets and evidence requirements.
- Association dashboard: tasks, deadlines, campaign assets, status, expected remuneration.
- Evidence: links, screenshots/files, notes, basic counts when measurable. Store upload metadata and access controls.
- Admin review: approve evidence, request changes, mark exceptions/shortfalls.
- Company dashboard: campaign progress, confirmed associations, committed vs completed deliverables, documented results, and final summary.
- Do not present follower totals as impressions or estimated reach as verified reach. Avoid collection of children's personal data; privacy/consent compliance must be reviewed for member targeting, leads and competitions.

## 9. Finance: post-campaign billing

**Decided:** company payment happens **after campaign completion**, not at checkout. Prior to execution company accepts binding commercial terms. MVP tracks money; actual invoices may be issued manually in an external accounting system.

- Store agreed line item gross prices and all fee allocations at confirmation.
- On delivery review, admin determines final billable amount and adjustments, retaining audit history.
- Admin records invoice reference, issue date, due date, amount, paid date/status; no fake payment processing.
- Track association payable and settlement status; payout trigger and timing must be configurable and documented.
- **Open:** platform take rate (15% was illustrative only), whether company or association bears fees, VAT treatment, payment terms, partial delivery/refunds, credit approval, collections and liability. Do not silently finalize these policies.
- Default risk control for pilot: manual company review and no association payout before company payment, subject to explicit contractual confirmation.
- Build no automatic Stripe checkout for MVP.

## 10. Platform admin

Admin can: review profiles/custom offerings, manage standard catalog, set configurable business rules, see all campaigns and invitations, assist with company campaign drafts, review evidence, record invoices and payouts, export basic CSV, manage disputes, and see an audit log of consequential changes. Maintain access segregation and avoid impersonation shortcuts.

## 11. MVP vs later

**MVP:** real authentication and tenant roles; association onboarding; catalog and custom product approval; company onboarding; list and map discovery; basic recommendation; professional shared campaign builder; admin-assisted campaign editing; invitation/acceptance; confirmed contract snapshot; delivery tasks/evidence; reporting; manual invoicing/payout ledger; admin console; tests/docs/deploy.

**Later:** advanced AI optimization, automated ad-platform integrations, payments and accounting automation, supplier marketplace, sophisticated sponsor CRM, affiliate/lead attribution, automated performance forecasts, cross-border localization and multi-currency. Preserve extension points but do not build speculative complexity.

## 12. Proposed technical architecture (validate before implementation)

- **Frontend/full stack:** Next.js (App Router) + TypeScript, accessible component system.
- **Database:** PostgreSQL, managed via Supabase or equivalent.
- **Authentication:** Supabase Auth or equivalent, with server-side authorization and row-level security where appropriate.
- **Business services:** clear modules for `associations`, `catalog`, `discovery`, `matching`, `campaigns`, `fulfillment`, `finance`, `admin`; avoid mixing financial logic into UI.
- **Geospatial:** geocoded association coordinates/regions and a map provider such as Mapbox; list mode remains fully functional without map. Protect provider tokens and usage budgets.
- **File storage:** access-controlled object storage for evidence/assets.
- **Hosting:** Vercel or equivalent, with distinct development/staging/production configs.
- **Source:** GitHub repository owned by founder; documented branches, commits and releases.
- **Tests:** unit + integration tests; end-to-end happy-path tests for both purchasing journeys and onboarding.
- **Monitoring:** structured logs, error monitoring and basic health checks.

These are **recommendations, not approved mandatory vendors**. Claude should present a compact final stack proposal with tradeoffs, avoiding unnecessary infrastructure.

## 13. Initial logical data model

At minimum, model:
- `users`, `organizations`, `organization_memberships` (role, association/company/platform)
- `associations`, `association_locations`, `association_channels`, `industry_exclusions`
- `catalog_categories`, `product_templates`, `association_offerings`, `offering_availability`, `offering_media`
- `companies`, `campaigns`, `campaign_briefs`, `campaign_items`, `campaign_invitations`, `campaign_approvals`
- `campaign_terms_versions`, `campaign_confirmation_snapshots`
- `delivery_tasks`, `delivery_evidence`, `delivery_reviews`
- `invoice_records`, `payables`, `payout_records`, `financial_adjustments`
- `audit_events`, `configuration_versions`

Use normal relational constraints, indexed foreign keys, UUIDs, timestamps, status transition rules, and explicit money types. Distinguish draft mutable data from confirmed immutable commercial snapshots. Avoid premature schema proliferation if a simpler structure meets the same needs.

## 14. Security, privacy and legal requirements

- GDPR-conscious data minimization, lawful processing and appropriate retention; provide privacy/consent requirements for review rather than making unsupported legal claims.
- Restrict evidence/assets to relevant organizations and admins; validate uploads and limit file types/sizes.
- Secure authentication, authorization, server-side validation, rate limiting on public endpoints, CSRF/session protections per framework, and secure secrets management.
- Audit commercial confirmations, price overrides, invoice adjustments, admin actions and permissions.
- No collection of individual minors' data for targeting in MVP. Marketing consent/lead-generation capabilities require separate legal and product approval.
- Contractual and VAT/payment decisions need professional review before real money is transacted.

## 15. Delivery plan and acceptance gates

**Milestone 0 — Foundation:** architecture proposal, repository, environment setup, schema migration framework, auth/roles, docs, CI, seeded development data. *Gate:* founder/developer can run app locally and sign in as each role.

**Milestone 1 — Supply:** association self-onboarding, profile edit, channel inventory, standard/custom offerings, approval, external booking-help link. *Gate:* a real association can register and publish approved products without developer intervention.

**Milestone 2 — Demand:** company account, map/list search, filters, offering detail, manual campaign builder and draft persistence. *Gate:* company can select actual seeded/registered association offerings and save a priced campaign draft.

**Milestone 3 — Recommendation:** simple editable suggested package, budget validation, exclusion rules, manual overrides. *Gate:* deterministic tests show small/new clubs remain eligible unless a genuine hard exclusion applies.

**Milestone 4 — Contracting:** submit, invite, accept/decline, alternative selection, company final confirmation, immutable snapshots. *Gate:* no campaign can become active without necessary approvals.

**Milestone 5 — Fulfillment and finance:** tasks, uploads, reviews, company report, manual invoice/payout ledger, audit trail. *Gate:* full end-to-end campaign can run from registration through completion and post-campaign invoicing with correct financial snapshots.

**Milestone 6 — Handover:** regression/security checks, staging deployment, backup/restore drill, operations runbook, final README/API/data-model docs and known limitations. *Gate:* a professional developer can clone, configure, run, test and deploy the system independently.

At each milestone: demonstrate working screens, provide test results, list unresolved decisions and request feedback. Do not start later milestones before acceptance when significant changes are pending.

## 16. Iterative change protocol (critical)

After development begins, user may submit requests such as “change pricing,” “add a new category,” “make campaign builder more advanced,” “change approvals,” or “modify matching.” Claude must:
1. Identify affected modules, database fields, tests, interfaces and existing confirmed campaigns.
2. Separate visual changes from business-logic and data migrations.
3. Offer the least disruptive maintainable solution, explicitly noting migration risks and backwards compatibility.
4. Implement on a branch/commit, test, document and present a demo.
5. Never mutate confirmed contractual data retrospectively without a deliberate audited adjustment flow.
6. Update `DECISIONS.md`, `CHANGELOG.md`, relevant specs and acceptance tests.

**Original spec is a starting point, not a permanent constraint.** Current agreed decisions in `DECISIONS.md` govern, with a traceable history.

## 17. Decisions vs open items

### Confirmed decisions
- Both recommended packages and individual product shopping.
- Both map and list views.
- Balanced campaign value is recommendation goal, but inclusivity and simplicity take precedence over sophisticated scoring.
- Both standard and custom association products.
- Association self-onboarding by default; optional booked online assistance, not default admin-created profiles.
- Company self-service and founder-assisted campaign creation using shared builder.
- Company invoiced/charged after campaign, with final agreement before delivery.
- Continuous editability and professional developer handover.

### Proposed, configurable defaults (NOT yet approved)
- Association response window: 72 hours.
- Custom offering requires admin approval.
- Platform-managed standard-product price list.
- Manual review of company creditworthiness for pilot.
- Payout only after company payment.
- Suggested technical stack above.

### Open business decisions
- Final platform fee/commission, payer, VAT and contractual structure.
- Payment due dates, bad debt, cancellations, underdelivery and refunds.
- Whether association approval is required for every campaign or certain offerings may be pre-approved.
- How custom product prices are set and approved.
- Minimum pilot catalog and product-specific evidence templates.
- Specific map provider, calendar provider, notifications, terms of service and privacy policy.

Open decisions must not block scaffolding unless necessary. Build configurable defaults, flag assumptions in the UI/admin and docs, and seek founder approval before production financial commitments.

## 18. First response Claude should give

Do **not** immediately output thousands of lines of code. Start with:
1. A short summary confirming the two non-negotiables: iterative edits after coding begins and professional handover.
2. Recommended stack and repository structure, highlighting any deviations from this spec.
3. Milestone 0 implementation plan and definition of done.
4. No more than five truly blocking questions; otherwise explicitly list assumptions and proceed.
5. Once approved, create actual files and begin implementing milestone 0, then present a runnable build for review.

**Success criterion:** a working, evolvable, professionally maintainable marketplace MVP capable of demonstrating real businesses purchasing association marketing inventory and completing campaigns, without a rebuild being the default next step.
