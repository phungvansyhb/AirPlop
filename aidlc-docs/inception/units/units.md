# Implementation Units (`units.md`)

- **Phase**: `INCEPTION`
- **Stage**: `Units Generation`

The implementation is decomposed into cohesive, independently verifiable **Units (Bolts)** executed in dependency order.

---

## `UNIT-01`: Project Scaffold, Signaling Server & Peer Model
- **Scope**:
  - Initialize `package.json`, `.gitignore`, and client vendor libraries (`jszip.min.js`, `qrcode.js`).
  - Implement Express static/`/config` server, IP normalization (IPv4/IPv6 private & proxy headers), UA parsing, and WebSocket room/signaling server (`ip`, `secret`, `public`, `signal`, `ws-chunk`).
- **Target Files**:
  - `package.json`, `.gitignore`
  - `server/helper.js`, `server/peer.js`, `server/ws-server.js`, `server/server.js`, `server/index.js`
- **Dependencies**: None (Foundation Unit).
- **Verification Criteria**: `Peer` IP normalization and WebSocket signaling integration tests pass in `npm test`.

---

## `UNIT-02`: WebRTC P2P Engine, IndexedDB Pairing & Client Network
- **Scope**:
  - Implement `PersistentStorage` (`IndexedDB` `airplop-db`) for paired `roomSecrets`.
  - Implement `AirPlopClient` and `RTCPeerSession` (64 KB chunking, backpressure, SDP/ICE handshake, WS fallback).
- **Target Files**:
  - `public/scripts/persistent-storage.js`
  - `public/scripts/network.js`
- **Dependencies**: `UNIT-01`.
- **Verification Criteria**: Peer discovery, pairing, public room, and fallback message flows verified end-to-end.

---

## `UNIT-03`: Glassmorphism UI, Bilingual i18n (`en`/`vi`) & PWA
- **Scope**:
  - Implement Glassmorphism CSS (`Auto`/`Light`/`Dark` modes, animated orbs, radar rings, responsive modals).
  - Implement `en.json` and `vi.json` dictionaries with dynamic `LocalizationManager`.
  - Implement `AirPlopUI` (drag-drop, `Ctrl+V` paste, QR rendering, multi-file `.zip` download) and PWA (`manifest.json`, `service-worker.js`).
- **Target Files**:
  - `public/index.html`, `public/styles/glassmorphism.css`, `public/images/icon.svg`
  - `public/lang/en.json`, `public/lang/vi.json`, `public/scripts/localization.js`
  - `public/scripts/ui.js`, `public/scripts/main.js`, `public/manifest.json`, `public/service-worker.js`
- **Dependencies**: `UNIT-02`.
- **Verification Criteria**: `en.json` and `vi.json` key parity test passes; `/` returns HTTP `200`.

---

## `UNIT-04`: Containerization, Automated Tests & Operations Docs
- **Scope**:
  - Create `Dockerfile`, `docker-compose.yml`, `README.md`, and `tests/airplop.test.js`.
  - Finalize `aidlc-docs/` release and operations artifacts.
- **Target Files**:
  - `Dockerfile`, `docker-compose.yml`, `README.md`, `tests/airplop.test.js`
- **Dependencies**: `UNIT-01`, `UNIT-02`, `UNIT-03`.
- **Verification Criteria**: `npm test` passes 4/4 tests with 0 failures.
