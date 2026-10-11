# V1.7 Verification 2026-10-11

- TypeScript noEmit and Vinext production build passed.
- SQLite literal SQL and D1 bound statement imports: 28 tables, 2,510 seed rows, no foreign-key violations; repeat import and interrupted initialization recover.
- 23 real local HTTP API checks passed: persistence, visitor isolation, revision conflicts, origin rejection, readonly source events, pagination, inaccessible private tables, concurrent first saves, Cookie-bound session fingerprints and rotating sandbox reset.
- Client transport checks (including rotating reset and flat error codes), 12 recovery-modal checks and 20 UI bundle checks passed.
- Browser: actual GET DB load, config POST, reload persisted value, real reference counts and downloads rendered. Existing public source data remains unchanged.
- OpenAPI 3.0.3 JSON, local references and unique operationId checks: 55 operations (49 business designs and 6 implemented demo operations). Apifox import not yet performed; user selected import file delivery.
- MySQL 8 schema and seed generated; not executed against a MySQL server.

Production user auth, source-system calls, formal entity transactions and payment actions are not implemented. Demo Cookie is an anonymous sandbox capability, not a production account.

- Independent code review findings were fixed and re-reviewed: first-save concurrency, failed/conflicting reload confirmation, and rotating reset response handling.

## Production Sites evidence

- Site: https://mahjong-operations-demo.polite-chord-7994.chatgpt.site/
- Final saved version: 4; deployment `appgdep_6acafcb3f7908191ace442a0ee65edc3` returned `succeeded`.
- Sites source commit: `76ccdf037472c8b7990d4febcf1e24dd86a4499e`. Version 4 deploys the same runtime archive hash as the version 3 bundle that passed 23 production HTTP checks; only the test-source Cookie selector changed.
- Production HTTP verification: `node scripts/test-api.mjs https://mahjong-operations-demo.polite-chord-7994.chatgpt.site` passed all 23 checks. The test selects only the application `maliu_sandbox` Cookie; Cloudflare platform cookies are not interpreted as sandbox rotation.
- Browser showed actual Cloudflare D1 reference counts. GitHub Pages serves the development reference landing page and public downloads, not the D1 API.

## Open-source package checks

- Public checkout independently passed Vinext production build and TypeScript noEmit with a placeholder `DB` binding and no maintenance project ID.
- 138 runtime/source attachment files matched the final Sites source exactly; three files only removed blank lines at EOF for a clean Git whitespace check. Public content scan found no secret markers, private source-system domain, Word or reference screenshot files.
- All landing-page local links existed; 55 unique OpenAPI operation IDs, 28 tables and 2,510 seed rows were verified.
- Chrome visual check passed for the landing page; 390px mobile viewport showed no horizontal overflow. The landing page loads no application script or static mock of a D1 API.
