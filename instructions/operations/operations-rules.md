# Operations Phase Rules (`instructions/operations/operations-rules.md`)

## Purpose
The **Operations Phase** governs Docker/Node.js packaging, reverse-proxy/TLS deployment readiness, STUN/TURN configuration, release verification, and ongoing maintenance of **AirPlop**.

---

## Stage 1: Build, Packaging & Deployment Verification
- Verify `npm test` passes and `npm start` / `npm run start:prod` serves `/config` (`HTTP 200`) and WebSocket signaling cleanly.
- Ensure target deployment steps (Node.js, Docker, Docker Compose, reverse proxy headers, free PaaS notes, and STUN/TURN tuning) documented in [`aidlc-docs/operations/release-and-packaging.md`](../../aidlc-docs/operations/release-and-packaging.md) are verified.

## Stage 2: Continuous Feedback Loop
- Any bug report, UI adjustment, or new feature request (e.g. proxy trust fixes, TURN setup, new language packs) triggers a new scoped Unit (e.g., `UNIT-05`) recorded in `aidlc-docs/inception/units/units.md`, `aidlc-docs/construction/plans/construction-plan.md`, `aidlc-docs/aidlc-state.md`, and `aidlc-docs/audit.md`.
