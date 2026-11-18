# Upstream review, 2026-11-18

SaltApocalypse `v2` was fetched again after its new release appeared. The latest
reviewed tag is **v2.0.5-salta**, commit
`056a5999e5483ab8bdb08ffb767bce038622cb81`. The typed reference tree, version and
release metadata were updated from that tag; Relay scripts and documentation
were preserved. Prior local files were backed up before the import.

Adapted into the compatibility runtime:

- Fresh, taken, claimable jobs bypass stale completion history and minigame
  lock records. Disabled task types, expiry, document proofs and queue ownership
  still apply; the executor claims without taking another deposit.
- After a verified decrypt loadout, an explicit zero/null-power analysis can
  try opening the exact file and obtain the game's authoritative result. Missing
  analysis, failed loadout verification and positive insufficient power still
  stop before opening. No blind minigame replay was added.
- The planner caches a selection for 60 seconds, with at most 32 entries. Relay
  fingerprints all relevant capacities, demands and abilities as well as inventory,
  current equipment, request/policy and binding generation. Clock rollback expires
  entries. It stores selected ids/scalars and resolves current inventory objects
  on a hit. Fingerprints and request keys have byte limits.
- Loadout reads and equipment observation allow 35 seconds, preserving reply
  correlation and endpoint ownership. Slow replies do not cause mutation replay.
- Post-loadout analysis logs make zero-power fallback distinguishable from
  genuine insufficient power.

The upstream preflight change is not copied as an unconditional lock bypass:
Relay still waits for a live timed challenge before starting a market batch.
The typed reference includes the upstream implementation; runtime behavior uses
Relay's existing page and queue contracts.

The separately supplied **1.11.0n** is a legacy community branch, not a Salta 2.x
release. Its archive was extracted into an ignored review directory and read as
source; the supplied extension was not installed or run.

Adopted in Relay 2.1.1:

- Simple Decrypt searches only inside the identified game container. No
  document-wide or generated-class fallback can reach another dialog.
- Force, brute-force, bypass, skip and cancel controls are excluded, including
  metadata labels. Input values and the semantic styled Decrypt control work.
- An admitted external game can show a localized start control before rendering
  English Decrypt text. The document lifecycle checks remain in force.
- One persistent game appearance is handled once. A new appearance or document
  can start separately. External 100% readings settle for three seconds.
- Loadout display accepts single software spec objects as well as spec arrays.

Kept Relay's existing implementations:

- Account/document binding, correlated replies, leases and explicit off settings.
  The archive's global tab lookup and storage routes would discard these checks.
- Loadout/file analysis verification, scoped Downloads discovery and unconfirmed
  completion reconciliation. Repeated decrypt attempts and unconditional
  download-success messages are not adopted.
- The terminal solver's rendered-parameter and fresh-feedback checks.
- Saved expedition insurance and budgets; no changed insurance default is imposed.
- One C3 surface; extra toast stacks would reintroduce overlapping controls.

No permissions, browser components or dependencies were added. Tests use isolated
data; this comparison does not establish live puzzle success.
