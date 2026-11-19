# Construction Phase Rules (`instructions/construction/construction-rules.md`)

## Purpose
The **Construction Phase** determines **HOW** to build each approved Unit ("Bolt") and executes code generation, functional/NFR validation, testing, and build verification iteratively per Unit.

---

## Per-Unit Execution Loop (Bolt Cadence)
For each Unit defined in [`aidlc-docs/inception/units/units.md`](../../aidlc-docs/inception/units/units.md):

### 1. Functional & NFR Design Check
- Verify data structures, WebSocket/WebRTC message contracts, error handling, XSS prevention (`textContent` rendering), rate limiting, and edge cases documented in [`aidlc-docs/construction/plans/construction-plan.md`](../../aidlc-docs/construction/plans/construction-plan.md).
- Ensure strict compliance with all `NFR-*` and `CON-*` constraints from `requirements.md` (including `en.json` / `vi.json` key parity).

### 2. Code Generation
- Write clean, modular ES6 code inside `server/`, `public/`, `tests/`, and root config files — NEVER inside `aidlc-docs/`.
- Respect architectural boundaries from `architecture.md` and Glassmorphism design tokens from `ui-design.md`.

### 3. Build & Test Verification
- Run the project verification suite:
  ```bash
  npm test
  ```
- Fix any errors before marking the Unit complete.
- Mark the completed Unit `[x]` in `aidlc-docs/aidlc-state.md` and `aidlc-docs/construction/plans/construction-plan.md`.
- Append a completed log entry in `aidlc-docs/audit.md`.
