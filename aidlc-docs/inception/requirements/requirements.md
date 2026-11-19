# Requirements Analysis (`requirements.md`)

- **Phase**: `INCEPTION`
- **Stage**: `Requirements Analysis`
- **Analysis Depth**: `Comprehensive`
- **Status**: `Approved (Gate 1 Passed — v1.0 Implemented)`

---

## 1. Functional Requirements (`FR-*`)

| ID | Title | Description | Priority |
| :--- | :--- | :--- | :--- |
| **`FR-01`** | **Local Network Discovery** | Devices sharing the same public IP (or private LAN when self-hosted) automatically discover each other via WebSocket IP rooms. | Must Have |
| **`FR-02`** | **WebRTC P2P File Transfer** | Direct browser-to-browser file transfer over `RTCDataChannel` with 64 KB chunking, backpressure control, and accept/decline confirmation. | Must Have |
| **`FR-03`** | **WebRTC P2P Text Transfer** | Send and receive text snippets/URLs with one-click copy to clipboard. | Must Have |
| **`FR-04`** | **Multi-File & ZIP Packaging** | Transfer multiple files in one batch with overall progress indicator; offer single-click `.zip` download via `JSZip`. | Should Have |
| **`FR-05`** | **Persistent Device Pairing** | Pair devices across different networks using a 6-digit code or QR code; store `roomSecrets` persistently in `IndexedDB`. | Should Have |
| **`FR-06`** | **Temporary Public Rooms** | Create or join temporary 5-letter public rooms (with QR code / shareable URL) to transfer files over the Internet without pairing. | Should Have |
| **`FR-07`** | **WebSocket Fallback** | Optional server-relayed chunk transfer (`ws-chunk`) when WebRTC is blocked by strict corporate firewalls or unsupported browsers. | Nice to Have |
| **`FR-08`** | **Bilingual i18n (`en`, `vi`)** | Full English and Vietnamese localization with instant UI switcher, `localStorage` persistence, and `navigator.language` auto-detection. | Must Have |
| **`FR-09`** | **Glassmorphism UI Theme** | Frosted-glass aesthetic (`backdrop-filter: blur`), translucent borders, animated ambient gradient orbs, and Auto/Light/Dark mode. | Must Have |
| **`FR-10`** | **PWA & Productivity UX** | Installable PWA (`manifest.json`, `service-worker.js`), Drag & Drop, `Ctrl+V` paste-to-send, editable display name, and keyboard shortcuts (`Ctrl+Enter`, `Esc`). | Should Have |

---

## 2. Non-Functional Requirements (`NFR-*`)

- **`NFR-01` (Performance)**: 64 KB DataChannel chunking with `bufferedAmountLowThreshold` (256 KB) backpressure handling; zero frontend build step for instant startup.
- **`NFR-02` (Security & Privacy)**: WebRTC enforces DTLS encryption in transit; zero database or file storage on server; all user-supplied text rendered via `textContent` to prevent XSS; optional `express-rate-limit` and per-peer pairing attempt throttling (max 10 attempts / 10s).
- **`NFR-03` (Accessibility & Responsiveness)**: ≥ 4.5:1 contrast over frosted glass in Light and Dark themes; respects `prefers-reduced-motion`; fluid layout for mobile (`360px+`), tablet, and desktop.

---

## 3. Technical Constraints (`CON-*`) & Prerequisites (`PRE-*`)

- **`CON-01`**: Backend built on Node.js (`>=18`), Express, and `ws` without any external database.
- **`CON-02`**: Frontend built on Vanilla HTML5 / ES6 Modules / CSS3 with bundled vendor libs (`jszip.min.js`, `qrcode.js`).
- **`PRE-01`**: HTTPS/WSS reverse proxy required in production for mobile WebRTC and PWA installation on non-localhost origins.

---

## 4. Exclusions (`EX-*`) & Success Criteria (`SC-*`)

- **`EX-01`**: Server-side file storage, async offline inbox, user accounts, or cloud database persistence.
- **`SC-01`**: `npm test` passes 100% (i18n key parity, IP normalization, HTTP endpoints, WebSocket signaling for IP/Pairing/Public rooms).

---

## 5. Clarified Decisions Log

| Question / Topic | Selected Option | Impacted Requirements |
| :--- | :--- | :--- |
| **Frontend Stack** | Vanilla ES6 + CSS3 (zero build step, mirrors PairDrop) | `CON-02`, `NFR-01` |
| **UI Theme & i18n** | Glassmorphism (Auto/Light/Dark) + `en` / `vi` bilingual | `FR-08`, `FR-09` |
| **Governance** | Standard AI-DLC (`AGENTS.md`, `instructions/`, `aidlc-docs/`) | All |
