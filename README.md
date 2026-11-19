# AirPlop

Cross-platform P2P file & text transfer in your web browser — inspired by AirDrop & PairDrop, featuring a **Glassmorphism UI**, **English & Vietnamese (`en` / `vi`)** localization, and **AI-DLC** documentation.

## Features
- **Local Network Discovery:** Devices on the same Wi-Fi/LAN see each other automatically.
- **WebRTC P2P Transfer:** Direct encrypted browser-to-browser file & text transfer (64 KB chunks, multi-file `.zip` download).
- **Persistent Device Pairing:** Pair across different networks with a 6-digit code or QR code (`IndexedDB`).
- **Temporary Public Rooms:** Share a 5-letter room code or QR code for instant Internet transfers.
- **Bilingual (`en` / `vi`):** Instant language switching with browser locale auto-detection.
- **Glassmorphism Theme:** Frosted-glass cards, animated ambient gradient background, Auto / Light / Dark modes.
- **PWA Ready:** Installable on desktop and mobile.

## Quick Start
```bash
npm install
npm start
# Open http://localhost:3000
```

## Run Tests
```bash
npm test
```

## AI-DLC Documentation
Full lifecycle governance and documentation following the **AI-Driven Development Life Cycle (AI-DLC)** standard (`AGENTS.md`, `instructions/`, and [`aidlc-docs/`](./aidlc-docs/aidlc-state.md)):
- **Steering Rules:** [`AGENTS.md`](./AGENTS.md) & [`instructions/`](./instructions/core-workflow.md)
- **Inception:** `inception/requirements/requirements.md`, `inception/user-stories/user-stories.md`, `inception/application-design/architecture.md`, `inception/application-design/ui-design.md`, `inception/units/units.md`, `inception/plans/execution-plan.md`
- **Construction:** `construction/plans/construction-plan.md`
- **Operations:** `operations/release-and-packaging.md`
