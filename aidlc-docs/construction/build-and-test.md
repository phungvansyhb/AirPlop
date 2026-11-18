# Build and Test (`build-and-test.md`)

## Test Strategy
1. **Unit Tests (`Peer` & `helper`):** IPv4/IPv6 private IP detection, proxy header extraction (`cf-connecting-ip`, `x-forwarded-for`), pairing/room code generation.
2. **Integration Tests (`AirPlopWsServer` + `Server`):**
   - HTTP `/config` and `index.html` serving.
   - Local IP room discovery between two WebSocket clients.
   - Device pairing (`pair-device-initiate` → `pair-device-join` → `room-secrets` rejoin).
   - Public room lifecycle (`create-public-room` → `join-public-room` → `leave-public-room`).
   - WebRTC `signal` relay and `ws-chunk` fallback relay.
3. **i18n Parity Test:** Verify `public/lang/en.json` and `public/lang/vi.json` contain identical translation keys.

## Execution Command
```bash
npm test
```

## Results
- **Date:** 2026-11-18
- **Command:** `npm test`
- **Outcome:** 4/4 passed (`0` failed)
  - `i18n: en.json and vi.json have identical key sets` — PASS
  - `Peer: normalizes private IPv4 and IPv6 addresses to 127.0.0.1` — PASS
  - `HTTP: serves /config and index.html` — PASS
  - `WS: local IP room discovery, pairing, public room, and signal relay` — PASS
