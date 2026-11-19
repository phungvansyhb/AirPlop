# User Stories (`user-stories.md`)

- **Phase**: `INCEPTION`
- **Stage**: `User Stories`
- **Traceability**: Mapped to [`requirements.md`](../requirements/requirements.md)

---

## `US-01`: Instant Local Discovery (`FR-01`)
**As a** user opening AirPlop on two devices on the same Wi-Fi,
**I want** both devices to appear automatically on the radar with device icons and friendly names,
**So that** I can start transferring immediately without logging in.

### Acceptance Criteria
- **Given** two browser clients connect from the same public IP (or private LAN),
- **When** each client emits `join-ip-room`,
- **Then** each peer appears in the other's Glassmorphism radar grid within 2 seconds,
- **And** displays a `Same Network` / `Cùng mạng` badge.

---

## `US-02`: Send & Receive Files via WebRTC P2P (`FR-02`, `FR-04`)
**As a** sender,
**I want** to click a peer (or drag-and-drop / paste files) and send one or multiple files,
**So that** the receiver can review and download them directly without touching a server.

### Acceptance Criteria
- **Given** a sender selects one or more files for a discovered peer,
- **When** the `request` message arrives over `RTCDataChannel`,
- **Then** the receiver sees a Glassmorphism confirmation modal listing file count and sizes,
- **And** upon clicking Accept, chunks stream at 64 KB with live progress and download directly (or as `.zip` if multiple files).

---

## `US-03`: Send & Receive Text Snippets (`FR-03`)
**As a** user sharing a link or snippet across devices,
**I want** to right-click a peer or click `Send Text` and send a message,
**So that** the recipient can copy it with one click.

### Acceptance Criteria
- **Given** a sender types text and presses `Ctrl+Enter`,
- **When** the text arrives on the recipient device,
- **Then** a receive-text modal opens with a one-click `Copy Text` button.

---

## `US-04`: Persistent Device Pairing (`FR-05`)
**As a** user with a phone on 4G and a laptop on Wi-Fi,
**I want** to pair them once via a 6-digit code or QR code,
**So that** they continue to discover each other whenever AirPlop is opened.

### Acceptance Criteria
- **Given** Peer A initiates pairing and Peer B enters the 6-digit code,
- **When** the server validates the code,
- **Then** both peers receive and store the shared `roomSecret` in `IndexedDB`,
- **And** reloading both tabs automatically rejoins the secret room.

---

## `US-05`: Temporary Public Room (`FR-06`)
**As a** remote collaborator,
**I want** to create or join a temporary 5-letter public room (or scan its QR code),
**So that** I can exchange files across different networks without persistent pairing.

### Acceptance Criteria
- **Given** Peer A creates a public room and shares the 5-letter code,
- **When** Peer B joins with that code,
- **Then** both peers see each other with a `Public Room` / `Phòng công khai` badge until leaving or closing the tab.

---

## `US-06`: Bilingual `en` / `vi` & Glassmorphism Theme Switching (`FR-08`, `FR-09`)
**As a** Vietnamese or English speaker,
**I want** to toggle `EN` ↔ `VI` and `Auto` / `Light` / `Dark` glass themes,
**So that** the interface adapts instantly without losing active connections.

### Acceptance Criteria
- **Given** an active AirPlop session,
- **When** the user clicks the language pill (`EN`/`VI`) or theme button,
- **Then** all labels, badges, modals, and toasts update immediately and persist in `localStorage`.
