# Construction Phase Plan (`construction-plan.md`)

- **Phase**: `CONSTRUCTION`
- **Cadence**: `Per-Unit (Bolt) Execution`

---

## Unit Checklist & Functional Specifications

### [x] `UNIT-01`: Project Scaffold, Signaling Server & Peer Model
- **Files**: `package.json`, `.gitignore`, `server/helper.js`, `server/peer.js`, `server/ws-server.js`, `server/server.js`, `server/index.js`
- **Key Interfaces / Contracts**:
  - `Peer(socket, request, conf)` — normalizes IPv4/IPv6 private IPs to `127.0.0.1`, parses UA into device metadata, generates deterministic friendly name via `cyrb53`, throttles pairing attempts (`10 / 10s`).
  - `AirPlopWsServer(server, conf)` — handles `join-ip-room`, `pair-device-initiate`, `pair-device-join`, `room-secrets`, `create-public-room`, `join-public-room`, `leave-public-room`, `signal`, and optional `ws-chunk`.
  - `AirPlopServer(conf)` — serves `public/` and `GET /config`.
- **Verification Gate**: `npm test` (Peer IP normalization + HTTP + WS signaling tests pass).

### [x] `UNIT-02`: WebRTC P2P Engine, IndexedDB Pairing & Client Network
- **Files**: `public/scripts/persistent-storage.js`, `public/scripts/network.js`
- **Key Interfaces / Contracts**:
  - `PersistentStorage` — `savePairedDevice`, `getAllPairedDevices`, `deletePairedDevice` in IndexedDB `airplop-db`.
  - `AirPlopClient` & `RTCPeerSession` — `64,000` byte chunking, `bufferedAmountLowThreshold = 256 KB`, `FileBatchReceiver`, and `ws-chunk` fallback.
- **Verification Gate**: WebSocket signaling, pairing, public room, and signal relay tests pass.

### [x] `UNIT-03`: Glassmorphism UI, Bilingual i18n (`en`/`vi`) & PWA
- **Files**: `public/index.html`, `public/styles/glassmorphism.css`, `public/images/icon.svg`, `public/lang/en.json`, `public/lang/vi.json`, `public/scripts/localization.js`, `public/scripts/ui.js`, `public/scripts/main.js`, `public/manifest.json`, `public/service-worker.js`
- **Key Interfaces / Contracts**:
  - `LocalizationManager` — detects `navigator.language`, toggles `en` / `vi`, applies `[data-i18n]` attributes dynamically.
  - `AirPlopUI` — renders Glassmorphism radar cards, modals, QR codes (`qrcode.js`), `.zip` bundling (`jszip.min.js`), drag-drop & `Ctrl+V` paste.
- **Verification Gate**: `i18n: en.json and vi.json have identical key sets` passes in `npm test`.

### [x] `UNIT-04`: Containerization, Automated Tests & Operations Docs
- **Files**: `Dockerfile`, `docker-compose.yml`, `README.md`, `tests/airplop.test.js`
- **Verification Gate**:
  - `npm test` → **4/4 passed (`0` failed)**.

---

## Future Maintenance Units (Template)
- Add `UNIT-05+` below whenever new features or fixes (e.g., `trust proxy: 1` for free PaaS reverse proxies, TURN presets) are requested after Gate approval.
