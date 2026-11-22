# COR3 Relay

[简体中文](README.zh-CN.md) · [Upstream](https://github.com/SaltApocalypse/cor3-helper) · [MIT license](LICENSE)

A Chrome and Edge companion for [COR3](https://cor3.gg): page-local puzzle
automation, account-scoped settings, market batches, Daily scheduling,
expeditions and diagnostics.

An independent public fork of **SaltApocalypse/cor3-helper**, originally based
on **Femtoce11/cor3-helper**. Upstream history and copyright notices are retained.
This is not an official COR3 or Salta release.

Relay **2.3.0** lives in [`relay/`](relay/README.md). The upstream **2.0.5**
TypeScript rewrite remains in `src/` as a separately buildable reference.
The [architecture decision](docs/architecture/relay-runtime-import.md) explains
the compatibility boundary and remaining technical debt. Only **Chrome and
Edge** distributions are published here.

## Build

Requires Node.js 24 or newer.

```sh
npm ci
npm run relay:check
npm run relay:lint
npm run relay:test
npm run relay:build
```

Load `build/relay/Chrome/extension` or `build/relay/Edge/extension` as an unpacked
extension. Keep an installation's folder and identity stable for future updates;
changing the path or uninstalling can separate or remove saved configuration.
No personal profiles, account data, logs or extension signing keys are included.
Publishing this source does not update existing installations.

## Relay 2.3

[2.3.0 release notes](relay/RELEASE-2.3.0.md)

- Account/document isolation, persistent browser-account binding and serialized
  settings writes. Explicit off values remain authoritative.
- Three puzzle solvers operate on their current page without waiting for
  account identification.
- Daily and market automation defaults, missed-refresh catch-up after reopening,
  and one batch per uncovered current task pool. Timed challenges and occupied
  endpoints defer new work.
- Market reads pause during a batch. Completion checks cached absolute deadlines
  against the system clock. Unknown outcomes are retained for review.
- Coalesced reads, compact summaries, bounded log persistence, correlated progress
  and responsive in-page controls.

2.1.1 adds a remembered **CN / EN** choice at the end of the toolbar popup,
reuses fresh C3 reads and displays hardware comparisons, software abilities and
resource demands. Selected 2.0.5 job-claim, decrypt-analysis, plan-cache and slow
loadout fixes are adapted alongside scoped Simple Decrypt improvements from
1.11.0n. See the [review](relay/UPSTREAM-REVIEW.md).

Tests use isolated fixtures and production functions. They do not prove live
rewards, real CPU/FPS improvements, long background operation or OS sleep recovery.
See [`relay/README.md`](relay/README.md).

## Upstream reference

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

These check and build the original typed rewrite into `dist/`, separately from
Relay. See [ARCHITECTURE.md](ARCHITECTURE.md), [MODULES.md](MODULES.md),
[upstream releases](https://github.com/SaltApocalypse/cor3-helper/releases)
and [contributor instructions](AGENTS.md).
