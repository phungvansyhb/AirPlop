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
Full lifecycle documentation following the **AI-Driven Development Life Cycle (AIDLC)** standard is located in [`aidlc-docs/`](./aidlc-docs/aidlc-state.md):
- **Inception:** `requirements.md`, `user-stories.md`, `application-design.md`, `execution-plan.md`
- **Construction:** `functional-design.md`, `nfr-requirements.md`, `code-generation-plan.md`, `build-and-test.md`
- **Operations:** `deployment.md`, `runbook.md`
