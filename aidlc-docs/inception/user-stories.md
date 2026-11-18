# User Stories (`user-stories.md`)

## Personas
- **Local User (Lan/Wi-Fi):** Wants to send photos/documents from phone to laptop instantly without cables or chat apps.
- **Remote Collaborator:** Wants to send files to a colleague on a different network without uploading to third-party cloud drives.
- **Self-Hoster / DevOps:** Wants to deploy AirPlop in a private LAN or Docker environment with minimal configuration.

## Stories & Acceptance Criteria

### US-01: Instant Local Discovery
- **As a** user opening AirPlop on two devices on the same Wi-Fi,
- **I want** both devices to appear automatically on the radar with device icons and friendly names,
- **So that** I can start transferring immediately without logging in.
- **Acceptance Criteria:** Opening two browser tabs on the same host/IP displays each peer in the other's radar within 2 seconds.

### US-02: Send & Receive Files (P2P)
- **As a** sender,
- **I want** to click a peer (or drag-and-drop / paste files) and send one or multiple files,
- **So that** the receiver can preview/accept and download them directly.
- **Acceptance Criteria:** Receiver sees a Glassmorphism confirmation modal with file count/size; accepting streams chunks with live progress and triggers download (`.zip` for multiple files).

### US-03: Persistent Device Pairing
- **As a** user with a phone on 4G and a laptop on Wi-Fi,
- **I want** to pair them once via a 6-digit code or QR code,
- **So that** they continue to see each other whenever AirPlop is opened.
- **Acceptance Criteria:** Entering the 6-digit code creates a shared `roomSecret` saved in `IndexedDB`; reloading both tabs reconnects them in the secret room.

### US-04: Temporary Public Room
- **As a** remote user,
- **I want** to create a 5-letter public room and share the code/QR,
- **So that** someone outside my network can send me files temporarily.
- **Acceptance Criteria:** Joining the 5-letter code shows all peers in that room; closing the tab leaves the room.

### US-05: Language Switcher (`en` / `vi`) & Glassmorphism Theme
- **As a** Vietnamese or English speaker,
- **I want** to toggle between `EN` and `VI` and switch between Auto/Light/Dark glass themes,
- **So that** the interface is comfortable and localized in real time.
- **Acceptance Criteria:** Toggling language updates all visible labels, modals, and toasts without reloading the page.
