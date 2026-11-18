# Relay 2.2.0 validation

Verified locally on Windows with Node 24.14.1. The Chrome and Edge builds each
passed 559 regression tests. The separate upstream reference passed 448 tests
across 93 files. Both projects passed type checking and lint, and both builds
completed. The public runtime inventory covers 81 files per browser.

- A burst of 12 session notifications caused one Daily state request in the fixture.
  A stale response after a session change could not overwrite the new session.
  A 503 or malformed payload did not overwrite the last good result.
- A simulated startup at rest scheduled its next local check 60 seconds later.
  Readiness after account revocation woke the new scope immediately.
- Four markets with current compact summaries required no full market rows for
  the status count. A legacy summary fetched only that market's rows.
- Repair acknowledgements could not satisfy a drone status reader. Twenty
  concurrent log opens shared one IndexedDB open. An obsolete connection's
  close event left its replacement usable.
- A simulated expiry on one game socket left its peers open. The paused and
  timed-puzzle cases did not initiate recovery of unrelated sockets.
- In isolated Chrome (500 CSS px) and Edge (492 CSS px) windows, the production
  C3 controls and toolbar markup ran with synthetic data. Switching CN/EN and
  opening Tasks, Operations and Status produced the expected labels and no panel
  overflow, page errors or game actions. Closing C3 collapsed the panel.

The real game, credentials, rewards, long-duration outages and OS sleep were
outside this offline acceptance run. No GitHub Actions result is claimed.

## Previous 2.1.1 checks


2026-11-18, Node.js 24, Windows. Local checks only; this update was not pushed.

| Check | Result |
| --- | --- |
| Chrome production-function regression fixtures | 525 passed |
| Edge production-function regression fixtures | 525 passed |
| Upstream 2.0.5 TypeScript rewrite tests | 448 passed, 93 files |
| Upstream strict typecheck, lint and build | Passed |
| Relay tooling typecheck and lint | Passed |
| Runtime JavaScript syntax and 81-file inventory | Passed |
| Public-input checks and synthetic account fixtures | Passed |

The isolated browser fixture uses production C3 and original-popup renderers
against mock ports. CN/EN, language persistence across popup recreation, native
submenus, CPU/GPU/RAM/PSU and ability categories, candidate spec previews,
per-category drafts, binding-loss cleanup and 320px/640px layouts were checked.
No current-page errors were observed in the final fixture. The fixture's view-read
counter is not a game-request counter. The fixture uses mock ports; no equipment command or task was sent to a real game.

Cache fixtures check initial automatic reads, closed-panel expiry, fast reopening,
per-kind freshness and market-deadline invalidation. A 500-item closed chooser
creates no option nodes; reopening reuses its rendered nodes. Repeated unchanged
live text produces one DOM write. These are behavioral measurements, not FPS
benchmarks.

No real browser account was operated for this update.
Live task rewards, puzzle completion, long background operation, OS sleep and
real CPU/FPS effects were not verified. These results describe the public source
snapshot, not an acceptance test on an account.

GitHub Actions is configured for upstream checks and both browser suites. No
cloud result is claimed for this unpushed update. Public artifacts remain limited
to Chrome and Edge.
