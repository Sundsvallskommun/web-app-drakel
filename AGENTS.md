# AGENTS.md — web-app-drakel

Instructions for AI agents (and humans) working in this repository. Read this
before making changes.

## What this repo is

`web-app-drakel` is a **slimmed-down** handläggar-application built from
`web-app-starter`. It reuses the **look & feel** and the **errand-handling
frontend** of `web-app-draken-public` (the supportmanagement part), but talks to
the **caremanagement** API instead of `casedata` or `supportmanagement`.

The guiding goal of this work is to **remove the technical debt** carried by
draken: keep files small, keep typing correct end-to-end, and reuse components
rather than copying monoliths.

### Reference repositories (local, read-only)
- `../web-app-starter` — the base this repo was forked from.
- `../web-app-draken-public` — source of the theme and the supportmanagement
  frontend we are porting. **Copy patterns, not tech debt.** When a future
  feature is needed that caremanagement does not yet support, the intended path
  is to port it from draken at that time.

## Architecture: end-to-end typing via generated data contracts

Typing must be correct the whole way through. The flow is:

1. **Upstream APIs → backend data-contracts.**
   `backend/src/config/api-config.ts` lists the subscribed APIs (`APIS`). Running
   `npm run generate:contracts` in `backend/` downloads each API's OpenAPI doc
   (`{API_BASE_URL}/{name}/{version}/api-docs`) and generates
   `backend/src/data-contracts/{name}/data-contracts.ts` (models only,
   `--no-client`). **These files are generated — never edit them by hand.**

2. **Backend responses & DTOs (hand-written, in separate files).**
   The backend builds its own request DTOs and response types **in dedicated
   files** (`backend/src/responses/*.response.ts`, plus DTO files), consuming the
   generated upstream data-contracts. One concern per file. The backend exposes
   its own OpenAPI/swagger describing these.

3. **Backend API → frontend interfaces.**
   Running `yarn generate:contracts` in `frontend/` downloads the **backend's**
   swagger (`{NEXT_PUBLIC_API_URL}/swagger.json`) and generates
   `frontend/src/data-contracts/backend/data-contracts.ts`. The frontend's
   interfaces therefore derive from the backend's real API surface.

Result: upstream API → backend data-contract → backend response/DTO →
frontend interface. Correct types at every hop, no hand-maintained duplicates.

**When the upstream API changes:** regenerate backend contracts → update backend
responses/DTOs → regenerate frontend contracts. Do not patch generated files.

## Scope (v1)

caremanagement is a **much leaner** errand API than supportmanagement. We only
build what caremanagement supports and keep the rest out for now.

**In scope** (caremanagement has it): errand list + filtering, errand detail
(basics/details), stakeholders/contacts, attachments, metadata/lookups
(`CATEGORY`/`STATUS`/`TYPE`/`ROLE`/`CONTACT_REASON`), parameters & external tags.

**Removed from the draken supportmanagement port** (no caremanagement support):
messages/conversations, generic notes, history/revisions, billing/invoice/
attestation, escalation, notifications, recruitment tab, services tab,
facilities/real-estate. If one of these is needed later, port it from draken
then.

**Set aside for now** (caremanagement-specific, no draken equivalent — revisit
later): `decisions` (decision log / audit trail) and Operaton/BPMN process
handling.

## Frontend architecture

The frontend is a **clean App Router rebuild**, not a wholesale copy of draken.

- **Keep drakel's App Router** (`src/app`) and its modern, store-light foundation.
  draken-public is also App Router, so its supportmanagement views port over.
- **Reuse draken's UI components** by copying and adapting them — but do **not**
  drag in draken's heavy zustand stores or its `common`/`config` coupling. Use a
  lighter data layer: typed services hitting the backend + React Query/hooks.
- **Theme** comes from the shared `@sk-web-gui/core` tailwind preset plus the
  Raleway font (already shipped in `public/fonts`), so the base chrome already
  matches draken. Distinctive draken styling lives in the ported screens
  (errand overview/list, errand detail with tabs).
- **Build UI from `@sk-web-gui/react` components — the same library draken uses
  — instead of hand-rolling markup.** Reach for the design-system component
  first: `Table`, `Tabs`, `Button`, `Select`, `Input`, `Textarea`, `FormControl`/
  `FormLabel`, `Label`, `Badge`, `Divider`, `Spinner`, `Pagination`, `Logo`,
  `UserMenu`, `PopupMenu`, `RadioButton`, `Tooltip`, `cx`, etc. When porting a
  draken screen, mirror its sk-web-gui usage and props; only drop to plain
  elements when no component fits. This keeps drakel visually consistent with
  draken and the Sundsvall design system.
- Tenant-agnostic on the frontend: it never knows `municipalityId` or
  `namespace` — the backend injects those.

## Backend configuration & auth

Config lives in `backend/.env.{NODE_ENV}.local` (currently
`.env.development.local`). Frontend must stay agnostic of tenant details.

- **caremanagement is called directly, NOT through the shared API gateway.**
  Other APIs go via `API_BASE_URL` (e.g. `api-test.sundsvall.se`) with an OAuth2
  client-credentials bearer token (`ApiService` + `ApiTokenService`).
  caremanagement instead uses its own host and (in dev) no auth — see
  `CaremanagementApiService` and `caremanagementUrl`.
- `CAREMANAGEMENT_BASE_URL` — caremanagement host, e.g.
  `https://cm.drakel.sundsvall.dev`. The backend builds
  `{CAREMANAGEMENT_BASE_URL}/{MUNICIPALITY_ID}/{CAREMANAGEMENT_NAMESPACE}/...`.
- `MUNICIPALITY_ID` = `2281`. **Backend only** — never sent from or known by the
  frontend.
- `CAREMANAGEMENT_NAMESPACE` (e.g. `FINANCIAL_ASSISTANCE`) — **Backend only** —
  the frontend never knows the namespace. Injected into the caremanagement URL.
- Authorization groups (mirrors draken's `authorization.service`):
  - `AUTHORIZED_GROUPS` — comma-separated groups allowed to use the app.
  - `ADMIN_GROUP` — admin access.
  - **Not used now:** `SUPERADMIN_GROUP`, `DEVELOPER_GROUP`. Do not add them.

## Conventions

- **Small, single-purpose files.** Split by concern. No monoliths.
- **Correct typing end-to-end.** Derive types from generated data-contracts;
  never hand-duplicate API shapes. Avoid `any`.
- **Reuse components and utilities** before writing new ones. Prefer composition.
  Check this repo and the draken reference for an existing pattern first.
- **Descriptive names** — no single-letter variables or functions.
- **Never hand-edit generated files** under `*/data-contracts/`.
- **When in doubt, ask** before introducing a new pattern, dependency, or scope.
