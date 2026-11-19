# Application Architecture & Technical Design (`architecture.md`)

- **Phase**: `INCEPTION`
- **Stage**: `Application Design`

---

## 1. High-Level System Architecture

```mermaid
flowchart TB
    subgraph ClientA["Browser / PWA (Peer A)"]
        UIA["Glassmorphism UI + i18n (EN/VI)"]
        IDBA["IndexedDB (Paired Secrets)"]
        RTCA["WebRTC Engine (64KB Chunker)"]
        WSA["WebSocket Client"]
    end

    subgraph Server["Node.js Signaling Server (AirPlop)"]
        EXP["Express Static & /config"]
        WSS["AirPlopWsServer (IP / Secret / Public Rooms)"]
    end

    subgraph Network["NAT Traversal"]
        STUN["STUN Server"]
        TURN["TURN Relay (Optional)"]
    end

    subgraph ClientB["Browser / PWA (Peer B)"]
        UIB["Glassmorphism UI + i18n (EN/VI)"]
        IDBB["IndexedDB (Paired Secrets)"]
        RTCB["WebRTC Engine (64KB Digester)"]
        WSB["WebSocket Client"]
    end

    WSA <-->|"Signaling (SDP/ICE)"| WSS
    WSB <-->|"Signaling (SDP/ICE)"| WSS
    RTCA <-->|"Encrypted P2P DataChannel (DTLS)"| RTCB
    RTCA -.->|"ICE/NAT"| STUN
    RTCA -.->|"Relay if Symmetric NAT"| TURN
    RTCB -.->|"Relay if Symmetric NAT"| TURN
```

---

## 2. Signaling & File Transfer Sequence

```mermaid
sequenceDiagram
    participant A as Peer A (Sender)
    participant S as AirPlop WS Server
    participant B as Peer B (Receiver)

    A->>S: Connect WS + join-ip-room / room-secrets
    B->>S: Connect WS + join-ip-room / room-secrets
    S-->>A: peers list (includes Peer B)
    S-->>B: peer-joined (Peer A)
    A->>B: WebRTC Offer / ICE (relayed via S)
    B->>A: WebRTC Answer / ICE (relayed via S)
    Note over A,B: Direct RTCDataChannel Established
    A->>B: request (file metadata)
    B-->>A: files-transfer-response (accepted: true)
    loop 64 KB Chunks
        A->>B: binary chunk (ArrayBuffer)
    end
    A->>B: file-transfer-complete
```

---

## 3. Component Boundaries & Data Contracts

### 3.1 Module Map
- **`server/`**: Express HTTP static/config server (`server.js`, `index.js`), peer IP normalization & UA parsing (`peer.js`, `helper.js`), and WebSocket signaling/room hub (`ws-server.js`).
- **`public/scripts/`**: Signaling & WebRTC session manager (`network.js`), `IndexedDB` wrapper (`persistent-storage.js`), dynamic EN/VI translator (`localization.js`), Glassmorphism UI controller (`ui.js`), and PWA bootstrapper (`main.js`).
- **`tests/`**: Automated Node test runner suite (`airplop.test.js`).

### 3.2 WebSocket Signaling & IndexedDB Contracts
- **Rooms**: `ip` (derived from normalized client IP), `secret` (64-char hex paired device token), `public` (5-letter uppercase room code).
- **IndexedDB (`airplop-db` / `roomSecrets`)**: `{ secret, displayName, deviceName, createdAt }` keyed by `secret`.
- **WebRTC Chunking**: `64,000` bytes (`CHUNK_SIZE`), `bufferedAmountLowThreshold = 256 KB`, flow-paused if `bufferedAmount > 1 MB`.

### 3.3 Security, Isolation & Failure Modes
- Mandatory DTLS encryption on `RTCDataChannel`; zero server-side file persistence.
- `ws-chunk` base64 fallback available when `WS_FALLBACK=true` if WebRTC fails.
- Per-peer rate limit (`10` pairing attempts / `10s`) and optional Express rate limiter.
