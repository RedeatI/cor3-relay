# ADR: Relay compatibility runtime

Date: 2026-11-18

## Decision

COR3 Relay is a public fork of SaltApocalypse/cor3-helper. The upstream `src/`
TypeScript architecture and its 2.0.5 history remain intact. Relay 2.2.1 is a
separate compatibility distribution under `relay/`, built for Chrome and Edge.
Do not claim that the upstream TypeScript build generates the Relay runtime.
The import is based on upstream `v2` commit
`056a5999e5483ab8bdb08ffb767bce038622cb81` (`v2.0.5-salta`).

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

## Daily run ownership

The account store serializes Daily lock acquisition, release and schedule
writes with preference updates. A refreshed document may replace a lock from
the preceding document in its tab. A lock from another tab remains until the
browser verifies the tab has closed or the lease expires. Legacy locks without
document metadata keep the original lease. A disabled Daily setting suppresses
wakeup writes and cancels the stored schedule.

## Automatic market triggers

Market jobs replies use an explicit market ID or the matching socket request.
Ambiguous replies do not complete a market read or overwrite its job list.
The sender records the market identity once, including when the request is
encoded as MessagePack.
Automatic market rounds compare the current document's verified jobs receipt
with the list it identifies. Options and lot updates preserve the jobs
revision in their merged cache. The page wakes the scheduler after the receipt
is persisted and again when the matching refresh ticket releases the endpoint.
The scheduler still waits for timed activity, respects explicit off settings
and retains a reservation when dispatch is uncertain.
Batch running markers are stamped with their document by the account store.
On page admission, the store can clear the running flag and pending list from
a previous document without changing its results or market coverage records.
This check is serialized with batch writes and preserves the current document's
marker, including while a batch is being admitted. A confirmed missing prerequisite
rules out repeated attempts through the same node. Independent alternatives
remain eligible. If every path is ruled out for missing software, the batch
records that reason and skips the job.
When the batch still holds an expired endpoint lease, the panel shows this
state and waits for completion acknowledgement before allowing another batch.

## Terminal puzzle support lists

The page watcher accepts repeated support lists only when each complete copy
matches the original in field order, labels and choices. The visible control
count determines the expected size. Conflicting or partial copies leave the
puzzle untouched.

## Visible ICE Wall matches

Multiple complete SVG matches can occur for the same target. Select one in
board order. A new, explicit mismatch allows one other complete match in that
same round. An unconfirmed result leaves the first submission pending rather
than resubmitting.

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

The 2.1.1 import adds TypeScript modules for language, loadout details and a pure
planner memo. `relay/tools/compile-language.ts` generates their browser artifacts.
Language alone uses the profile-wide `cor3RelayUiLanguage` storage key; account
settings retain the scoped store. Only owned extension documents and C3 shadows
are translated, never the game DOM. The language setting exists only in the
toolbar footer.

Data freshness is five minutes for loadout/Daily, one minute for expedition/drone,
and five minutes or the actual market deadline for markets. Initial page startup
still reads automatically; a closed C3 does not start full reads on expiry. Queue,
permission, progress and manual refresh do not use these freshness windows.

Relay 2.1.5 shares an in-flight C3 view read while the same document is open
or reopened. It discards obsolete views when the document changes or an action
starts, and rereads confirmed settings after the action settles. The scoped
store still verifies every request. Read transport deadlines release client-side
read slots, and the page loader backs off after a read transport error.
Mutations retain their existing queue, scope checks and acknowledgement rules.

Relay 2.1.7 checks the sender and its pinned document synchronously at the
scoped store boundary. The storage guard still takes a fresh proof before and
after the operation. Privileged UI keeps its post-response proof. A partial startup data read
gets one late-cache check per attempt, then waits for the existing retry deadline.
The first C3 view reads small status values and the larger local caches in one
request. Subsequent views reuse the larger data until their scope or stamp changes.

Relay 2.1.8 prioritizes relevant DOM mutations, page return and on-demand proofs
for account identity. Its connected idle fallback is one local scan per minute.
Unconfirmed binding announcements use separate monotonic retry timers. For a
market whose cached deadline has not advanced, automatic refresh uses per-market
retry intervals of 1, 2, 4, 8, and at most 15 minutes. Other markets retain their
own deadlines. Existing endpoint ownership and manual refresh still apply.
Concurrent drone option reads on the same transport generation share one request.
The minute fallback skips a recent response from the same document. A drone
options read that returns a busy error waits for the existing read schedule.

Relay 2.2 leaves the settled bootstrap on a one-minute fallback. Ready events
interrupt that wait; revocation fences a pending read before the next document
can consume it. A status snapshot reads compact market counts saved in the
same write as the rows, with a scoped fallback for older caches. A repair
acknowledgement never completes a drone status request. Log writers share a
pending IndexedDB open and close only the connection that changed version.

Daily session credentials reside in the content script for the admitted account
and document. Storage contains the synchronization timestamp and document ID.
A verified new session removes its account's former credential key. Concurrent
notifications share initialization. Replacing a session invalidates its pending
result. An expired socket cannot close other game sockets.

The C3 loadout view projects a fixed set of resource readings from the existing
account-scoped cache. Missing usage and capacities stay unknown. Candidate cards
use local selection drafts, retain their DOM nodes across polling, and use the
existing verified equipment actions for changes.

The planner memo is in-memory, bounded and generation-aware. It cannot dispatch
commands or bypass the existing execution service. See the selected changes and
deliberate deviations in [the upstream review](../../relay/UPSTREAM-REVIEW.md).

The compatibility runtime still has its older global bridge composition and
session/storage conventions. The rewrite and the retained runtime still have separate composition roots.

`npm run build` continues to build the upstream reference into `dist/`.
`npm run relay:build` builds Relay into `build/relay/{Chrome,Edge}/extension`.
`npm run relay:test` runs the retained production-function fixtures against both
generated browser packages. Upstream typecheck, lint, tests and build are checked
separately. No account is accessed by these commands.

Offline fixtures cover routing, queue tickets, races, settings, solver algorithms,
timers and recovery. They do not prove live task rewards, actual CPU/FPS gains,
long background operation, sleep recovery, or account progression.

## Background waits and startup roster reads

Startup and automatic panel reads request the mercenary roster and location configuration. A price quote is only requested by a caller that needs one. A roster result cannot stand in for a launch quote. The browser schedules transport and UI waits with positive-delay timers; a resumed tab checks the existing packet expiry and generation before sending. No timer catch-up replays an expired command.

## Relay 2.3.0 background lifetime

A refresh owns its listener until its ticket is released. Cancellation removes
the listener, while a timeout with an unknown outcome keeps the lease. A late
acknowledgement from a cancelled ticket has no effect. Correcting the system
clock cannot extend the socket pacing interval; packet age and generation are
checked again before a send.

Console batches from a bound document are appended under the same serialized
store guard as settings. Each subscriber materializes its own log copy only if
it requests that key. Database maintenance uses bounded timestamp-index reads
and trims by primary key atomically; aborts settle the pending operation.
The upstream selection and mapping ports are documented in relay/UPSTREAM-REVIEW.md.
