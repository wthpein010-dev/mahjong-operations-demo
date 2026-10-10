# V1.5 verification 2026-10-10

- Bundled Node syntax check succeeded. Fourteen business invariants passed: regional authorization, no-scope zero data, local role limits, current-service binding, full-region monetary reconciliation, cross-region player deduplication, date aggregation and stable unique event identifiers.
- Chrome UI: default two-region manager total ¥2,970, 40 distinct active players; region totals 34 and 28 do not incorrectly sum to 62. Changsha-only ¥1,650. Two-region selection returns the combined total.
- Responsible ordinary-agent creation: required-field failure, authorized-region choices only, successful creation with regional attribution and refresh persistence. Local support has one-region creation only, no reward navigation or exports.
- Reward form rejects 21%, saves pending 2.75% while retaining current 3% and historical event rates.
- Migration A1002 from Changsha to Wuhan updates current agent and tea-house region and regional support binding; historical recharge C0-1 remains Changsha. Reference backend was observed only; no production operation submitted.
- All nineteen secondary navigation pages opened and displayed their heading, with no captured warning/error logs at that check. The overview was also exercised. Shared search, no-result handling and pagination are available.
- 390×844 mobile viewport: native feature selector usable, document scrollWidth equals clientWidth (380 CSS pixels in observed Chrome layout); table scroll stays inside its wrapper. Temporary viewport reset.
- Export uses authorized scope and all filtered rows, omits operation column, disallows player/account relationship exports and regional-support exports; CSV formula prefixes escaped. Chrome download-event waiting timed out, so downloaded file content was not verified through that API.
- Strict premium UI audit passed with zero findings after shared native selector/date/scope/form owners were recorded. This is a static prototype review, not production security or load testing.

DOCX V1.5 maintained separately in the workspace: 26 rendered pages visually reviewed, prior highlights cleared, current edits highlighted and red limits retained. No generated DOCX, private research image or rendered QA PDF is included in this public repository.
