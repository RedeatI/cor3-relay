# COR3 Relay 2.1.0

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

Automatic market work waits for timed challenges and occupied endpoints. An
uncovered current market pool can run after reopening the browser. Markets are
not refreshed during the batch; completion rechecks cached deadlines against
the system clock. Unknown outcomes remain available for review rather than
being blindly replayed. Expedition selection, budgets and saved settings remain
account scoped; automatic expeditions require the user's configured settings.

The public import includes no personal settings, account migrations or live logs.
All regression tests are isolated fixtures. Live rewards and long-running browser
behavior require separate authorized verification.
