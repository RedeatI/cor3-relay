# ADR: Relay compatibility runtime

Date: 2026-11-17

## Decision

COR3 Relay is a public fork of SaltApocalypse/cor3-helper. The upstream `src/`
TypeScript architecture and its 2.0.4 history remain intact. Relay 2.1.0 is a
separate compatibility distribution under `relay/`, built for Chrome and Edge.
Do not claim that the upstream TypeScript build generates the Relay runtime.
The import is based on upstream `v2` commit
`53c1e11e5304d393b95cbac6941356e546c5859a` (`v2.0.4-salta`).

The imported `.js` runtime and `.mjs` regression fixtures are a retained legacy
boundary, an explicit exception to the upstream prohibition on restoring v1
source. They are included to make the working compatibility distribution
inspectable and reproducible. They are not a new replacement of the domain or
application layers in `src/`. New tooling and future extracted modules use
TypeScript; do not expand this exception into new legacy modules or duplicate
static protocol tables.

The import includes existing account/document scoping, three page-local puzzle
solvers, serialized settings writes, endpoint leases, Daily scheduling, expedition
selection, automatic market batches, missed-refresh catch-up, and bounded logs.
Runtime checksums in `relay/runtime-integrity.json` describe this public snapshot.
They are an integrity record, not a signature or proof of live game success.

## Public import changes

- Display name is COR3 Relay; protocol messages and storage namespaces remain
  compatible. No new browser permissions or runtime dependencies were added.
- Only Chrome and Edge manifests are distributed. Browser-specific private
  distributions and their configuration are outside this repository.
- All literal account IDs in test fixtures are synthetic. No browser profiles,
  storage exports, personal logs, screenshots, local paths, or extension signing
  identity were imported.
- The historical r8 preference-reset factory defaults to an empty account list.
  Its old personal allowlist is removed. Tests explicitly inject synthetic
  accounts. The production migration entry remains superseded by the page profile,
  so a later identity probe cannot replay a reset over a user's choices.
- The upstream MIT notice is retained, including the notice bundled with the
  compatibility extension. This is an independent fork, not a Salta release.

## Consequences and follow-up

The compatibility runtime still has its older global bridge composition and
session/storage conventions. In particular it retains a legacy `bearerToken`
storage path; it does not yet satisfy the rewrite's no-persisted-token rule.
No credentials are committed to this repository. Moving the session to a
volatile port and migrating composition to the typed architecture are follow-up
work, with settings and account isolation regression coverage required first.
Do not imply that retaining the typed upstream tree fixes these legacy limits.

`npm run build` continues to build the upstream reference into `dist/`.
`npm run relay:build` builds Relay into `build/relay/{Chrome,Edge}/extension`.
`npm run relay:test` runs the retained production-function fixtures against both
generated browser packages. Upstream typecheck, lint, tests and build are checked
separately. No account is accessed by these commands.

Offline fixtures cover routing, queue tickets, races, settings, solver algorithms,
timers and recovery. They do not prove live task rewards, actual CPU/FPS gains,
long background operation, sleep recovery, or account progression.
