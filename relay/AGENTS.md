# Relay runtime

Read `../docs/architecture/relay-runtime-import.md` before changing this boundary.
The imported JavaScript and Node test fixtures are existing compatibility code;
new tooling and extracted modules must be TypeScript. Keep upstream `src/` rules
and layering intact. Document any runtime contract change in the ADR.

Public builds target Chrome and Edge only. Do not import private browser bundles,
profile identifiers, local logs, screenshots, account allowlists or manifest keys.
Use synthetic `FREEL_FFxxxxxx-xxxx` identifiers in fixtures.

Preserve account/document checks, explicit off settings, request correlation,
endpoint leases and unknown-outcome handling. Never test by operating a real
account unless the user explicitly authorizes that account and the operation.

Before publishing: `npm run relay:check`, `npm run relay:lint`,
`npm run relay:test`, plus the upstream checks listed in root `AGENTS.md`.
Update `runtime-integrity.json` only for reviewed runtime changes; do not refresh
it to conceal a failing retained-engine regression.
