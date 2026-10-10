# V1.6 Verification · 2026-10-11

- Node syntax checks: app.js and extensions.js passed.
- 14 existing business invariants passed: region scope, historical events, date aggregation, service binding, no-authority behavior.
- 8 extension invariants passed: ticket current scope/service relation, draft privacy, task ownership/full scope, zero-authority result and valid lifecycle.
- Chrome: ticket required-field rejection, creation/reload persistence, HQ assignment, assigned regional support reply and messages; announcement draft/publish/withdraw; config rejection of zero, save, dirty keep/discard; responsible readonly config and scoped notice options; nine new pages without warning/error logs.
- Public prototype uses fictional records. No production authentication/API, payment, game writes, scheduling, attachment uploads or generated job files. No transfer action.

- Chrome 390px viewport: body width 380px, mobile page selector visible, table remains internally scrollable; viewport reset. Local test changes reset through application confirmation.
