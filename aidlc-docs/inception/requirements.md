# Requirements Analysis (`requirements.md`)

## 1. Project Overview
**AirPlop** is a browser-based, cross-platform peer-to-peer (P2P) file and text sharing web application inspired by Apple AirDrop and PairDrop. It requires zero installation and zero user registration.

## 2. Functional Requirements

| ID | Requirement | Priority | Details |
|---|---|---|---|
| FR-01 | Local Network Discovery | P0 | Devices sharing the same public IP (or private LAN when self-hosted) automatically discover each other via WebSocket IP rooms. |
| FR-02 | WebRTC P2P File Transfer | P0 | Direct browser-to-browser file transfer over `RTCDataChannel` with 64 KB chunking, backpressure control, and accept/decline confirmation. |
| FR-03 | WebRTC P2P Text Transfer | P0 | Send and receive text snippets/URLs with one-click copy to clipboard. |
| FR-04 | Multi-File & ZIP Packaging | P1 | Transfer multiple files in one batch with overall progress indicator; offer single-click `.zip` download via `JSZip`. |
| FR-05 | Persistent Device Pairing | P1 | Pair devices across different networks using a 6-digit code or QR code; store `roomSecrets` persistently in `IndexedDB`. |
| FR-06 | Temporary Public Rooms | P1 | Create or join temporary 5-letter public rooms (with QR code / shareable URL) to transfer files over the Internet without pairing. |
| FR-07 | WebSocket Fallback | P2 | Optional server-relayed chunk transfer (`ws-chunk`) when WebRTC is blocked by strict corporate firewalls or unsupported browsers. |
| FR-08 | Bilingual i18n (`en`, `vi`) | P0 | Full English and Vietnamese localization with instant UI switcher, `localStorage` persistence, and `navigator.language` auto-detection. |
| FR-09 | Glassmorphism UI Theme | P0 | Frosted-glass aesthetic (`backdrop-filter: blur`), translucent surfaces, specular borders, animated ambient gradient background, and Auto/Light/Dark mode. |
| FR-10 | PWA & Productivity UX | P1 | Installable PWA (`manifest.json`, `service-worker.js`), Drag & Drop, `Ctrl+V` paste-to-send, editable display name, and sound notifications. |

## 3. Out of Scope (v1.0)
- Server-side file storage or offline async inbox.
- User accounts, passwords, or cloud database persistence.
