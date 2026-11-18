# Functional Design (`functional-design.md`)

## 1. WebSocket Signaling Protocol
All signaling messages are JSON objects with a `type` field:

| Message Type | Direction | Purpose |
|---|---|---|
| `ws-config` | S → C | Sends `rtcConfig` (STUN/TURN) and `wsFallback` flag |
| `display-name` | S → C | Assigns generated `displayName`, `deviceName`, `peerId` |
| `join-ip-room` | C → S | Joins local-network IP room |
| `pair-device-initiate` | C → S | Requests a 6-digit pairing code |
| `pair-device-join` | C → S | Submits 6-digit code to pair and receive shared `roomSecret` |
| `room-secrets` | C → S | Rejoins all previously paired `roomSecrets` from IndexedDB |
| `create-public-room` | C → S | Creates a 5-letter temporary public room |
| `join-public-room` | C → S | Joins an existing 5-letter public room |
| `leave-public-room` | C → S | Leaves the active public room |
| `signal` | C ↔ S ↔ C | Relays WebRTC SDP (`offer`/`answer`) and `ice` candidates |
| `ws-chunk` | C ↔ S ↔ C | Optional base64 chunk relay when `wsFallback` is enabled |

## 2. WebRTC DataChannel File Transfer Protocol
- **Chunk Size:** `64,000` bytes (64 KB) per binary message.
- **Partitioning / Flow Control:** Tracks `bufferedAmount` / partition size to prevent DataChannel buffer overflow on large files.
- **Multi-file Batch:** Sends `request` (file list metadata) → waits for `files-transfer-response` (`accepted: true`) → streams each file (`header` → binary chunks → `partition` / `file-transfer-complete`).
- **ZIP Packaging:** When `files.length > 1`, received blobs are packaged client-side via `JSZip` into `AirPlop_Files_<timestamp>.zip`.

## 3. IndexedDB Schema (`airplop-db`)
- **Object Store:** `roomSecrets` (keyPath: `secret`)
  - `secret`: string (64-char hex)
  - `displayName`: string
  - `deviceName`: string
  - `createdAt`: ISO timestamp

## 4. Bilingual i18n (`en`, `vi`)
- Translation files: `public/lang/en.json`, `public/lang/vi.json`.
- DOM binding via `data-i18n`, `data-i18n-placeholder`, and `data-i18n-title` attributes.
- Programmatic lookups via `Localization.get(key, params)`.
