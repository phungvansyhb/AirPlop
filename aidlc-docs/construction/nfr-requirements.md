# Non-Functional Requirements (`nfr-requirements.md`)

## 1. Security & Privacy
- **Transport Encryption:** WebRTC `RTCDataChannel` enforces DTLS encryption by browser specification; signaling uses WSS in production behind TLS.
- **Zero Persistence on Server:** No files, file metadata, or user identities are written to disk or database on the server.
- **XSS Prevention:** All user-supplied text (display names, received text messages, filenames) is rendered via `textContent` or sanitized DOM nodes — never raw `innerHTML`.
- **Rate Limiting:** Optional `express-rate-limit` on HTTP endpoints and per-peer pairing attempt throttling (max 10 attempts / 10s).

## 2. Performance
- **Low Memory Overhead:** Backend holds only active socket references and room maps.
- **Streaming Chunking:** 64 KB chunks with `bufferedAmountLowThreshold` backpressure handling.
- **Zero Build Step:** Static assets served directly with gzip/cache headers via Express and Service Worker.

## 3. Usability & Accessibility (Glassmorphism)
- **Contrast:** Text over frosted glass maintains ≥ 4.5:1 contrast ratio in both Light Glass and Dark Glass themes.
- **Motion:** Respects `prefers-reduced-motion` for ambient background orbs and radar pulse animations.
- **Responsiveness:** Fluid layout supporting mobile viewports (`360px+`), tablets, and desktop monitors.
