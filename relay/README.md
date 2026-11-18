# COR3 Relay 2.2.1

Chrome and Edge compatibility runtime. See the [architecture decision](../docs/architecture/relay-runtime-import.md)
for its relationship to the upstream TypeScript rewrite.

```sh
npm ci
npm run relay:check
npm run relay:lint
npm run relay:test
npm run relay:build
```

Load `build/relay/Chrome/extension` or `build/relay/Edge/extension` as an unpacked
extension. These are separate manifests over the same runtime. The build does
not copy a personal extension key or browser configuration. No native host or
additional browser component is required. The optional native bridge is disabled.

Keep an installation's folder and extension identity stable when updating.
Changing paths, uninstalling, or installing a second copy can give it separate
storage. This source publication does not update existing installations.

The extension reads its current game document automatically. Missing preferences
default the three puzzle solvers, Daily, market refresh and automatic market jobs
on; saved explicit off values remain authoritative. Puzzles use their current
page scope independently of account identification. Account actions require the
matching account and document.

The toolbar popup's final row selects **CN / EN**. First use follows the browser;
a manual choice is remembered for that browser profile and synchronizes C3 and
owned extension pages. C3 has no duplicate language setting.

Opening C3 reuses successful reads: loadout and Daily for up to five minutes,
expeditions and drone data for one minute, and markets for up to five minutes or
their next reset, whichever is sooner. Initial page connection still reads
automatically. Expiry while C3 is closed does not start another full read; the
next open fills expired or missing data. Live queue/permission state and manual
refreshes are independent of this data cache.

Loadout controls show actual hardware parameters, current/selected comparisons,
software ability ranges and resource demands. Missing values are not invented.
A binding change clears old details and progress. Inventory option nodes are
created on demand and reused; unchanged labels skip DOM writes.

Hardware choices are separated into CPU/GPU/RAM/PSU and software into ability
types. Candidate rows show their actual specs or ability ranges before selection.
Category changes are local view operations; saved per-category drafts are bounded
to the current document and cannot restore an item that is no longer owned.
Only the applicable equipment action is shown. Chooser closure happens after a
click so expanding/collapsing details cannot move its target between press/release.

See [the upstream review](UPSTREAM-REVIEW.md) for selected 1.11.0n fixes.

Automatic market work waits for timed challenges and occupied endpoints. An
uncovered current market pool can run after reopening the browser. Markets are
not refreshed during the batch; completion rechecks cached deadlines against
the system clock. Unknown outcomes remain available for review rather than
being blindly replayed. Expedition selection, budgets and saved settings remain
account scoped; automatic expeditions require the user's configured settings.

The public import includes no personal settings, account migrations or live logs.
All regression tests are isolated fixtures. Live rewards and long-running browser
behavior require separate authorized verification.
