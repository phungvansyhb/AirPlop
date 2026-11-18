# Application Design (`application-design.md`)

## 1. High-Level Architecture

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
    A->>B: transfer-request (file metadata)
    B-->>A: files-transfer-response (accepted: true)
    loop 64 KB Chunks
        A->>B: binary chunk (ArrayBuffer)
    end
    A->>B: file-transfer-complete
    B-->>A: transfer-completed-ack
```

## 3. Component Boundaries
- **Server (`server/`):** Zero business-data persistence. Only maintains active WebSocket connections, ephemeral room maps (`ip`, `secret`, `public`), and relays JSON signaling messages.
- **Client (`public/scripts/`):** Modular ES6 architecture separating signaling/WebRTC (`network.js`), IndexedDB (`persistent-storage.js`), localization (`localization.js`), UI rendering (`ui.js`), and bootstrap (`main.js`).
