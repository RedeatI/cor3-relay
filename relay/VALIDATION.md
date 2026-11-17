# Validation of the public import

2026-11-17, Node.js 24, Windows.

| Check | Result |
| --- | --- |
| Chrome production-function regression fixtures | 470 passed |
| Edge production-function regression fixtures | 470 passed |
| Upstream TypeScript rewrite tests | 445 passed, 93 files |
| Upstream strict typecheck, lint and build | Passed |
| Relay tooling typecheck and lint | Passed |
| Runtime JavaScript syntax and 78-file inventory | Passed |
| Public-input checks and synthetic account fixtures | Passed |

No real browser account or installed extension was operated for this import.
Live task rewards, puzzle completion, long background operation, OS sleep and
real CPU/FPS effects were not verified. These results describe the public source
snapshot, not an acceptance test on an account.

GitHub Actions repeats the upstream checks and both browser suites on pushes and
pull requests. Its downloadable artifact contains only Chrome and Edge packages.
