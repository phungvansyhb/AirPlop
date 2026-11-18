# Operations Runbook (`runbook.md`)

## 1. Common Issues & Resolution

| Symptom | Cause | Resolution |
|---|---|---|
| Peers on same Wi-Fi don't see each other | Reverse proxy not forwarding client IP | Ensure Nginx/Caddy sets `X-Forwarded-For` or `CF-Connecting-IP`. |
| Cross-network transfer hangs on "Connecting" | Symmetric NAT blocking P2P | Configure a TURN server (e.g. `coturn`) in `RTC_CONFIG` or enable `WS_FALLBACK=true`. |
| PWA Install button not visible | Served over plain HTTP (non-localhost) | Enable HTTPS via reverse proxy. |
| Pairing fails with rate-limit error | >10 attempts within 10 seconds | Wait 10 seconds and retry with a fresh 6-digit code. |

## 2. Health Check
- `GET /config` returns HTTP `200` with JSON `{ "signalingServer": ..., "wsFallback": ... }`.
