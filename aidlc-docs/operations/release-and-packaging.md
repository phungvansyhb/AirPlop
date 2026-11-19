# Operations Phase: Release & Packaging (`release-and-packaging.md`)

- **Phase**: `OPERATIONS`
- **Target Environments / Platforms**: `Node.js >= 18`, `Docker / Docker Compose`, `Free PaaS (Render / Koyeb / Fly.io)`, `Self-Hosted VPS + Coturn`

---

## 1. Build & Verification Pipeline
```bash
npm install
npm test
npm start
```
Production startup with rate limiting and auto-restart:
```bash
PORT=3000 RATE_LIMIT=true WS_FALLBACK=true node server/index.js --rate-limit --auto-restart
```

## 2. Environment Variables & Flags
- `PORT`: HTTP/WebSocket listening port (default `3000`).
- `RATE_LIMIT` / `--rate-limit`: Enable Express rate limiting.
- `WS_FALLBACK` / `--ws-fallback`: Allow WebSocket chunk relay when WebRTC is blocked.
- `RTC_CONFIG`: Path to JSON file containing custom `iceServers` (STUN/TURN).
- `IPV6_LOCALIZE`: Number of IPv6 segments to group peers (1–8).

## 3. Release & Deployment Matrix

| Target / Environment | Artifact / Config | Verification & Release Steps |
| :--- | :--- | :--- |
| **Local Node.js** | `package.json`, `server/index.js` | Run `npm test` then `npm start`; verify `GET /config` returns HTTP `200`. |
| **Docker / Compose** | `Dockerfile`, `docker-compose.yml` | Run `docker compose up -d --build`; place behind HTTPS/WSS reverse proxy (Nginx/Caddy/Traefik). |
| **Free PaaS (Render/Koyeb)** | `Dockerfile` / Node runtime | Configure a free TURN server in `RTC_CONFIG` for cross-NAT transfers; forward `X-Forwarded-For` cleanly. |

## 4. Operations Runbook

| Symptom | Cause | Resolution |
| :--- | :--- | :--- |
| Peers on same Wi-Fi don't see each other | Reverse proxy not forwarding client IP | Configure Nginx/Caddy to set `X-Forwarded-For` or `CF-Connecting-IP`. |
| Cross-network transfer hangs on "Connecting" | Symmetric NAT blocking P2P | Configure a TURN server (`coturn` / Metered / Cloudflare Calls) in `RTC_CONFIG`, or set `WS_FALLBACK=true`. |
| PWA Install button not visible | Served over plain HTTP (non-localhost) | Enable HTTPS via TLS reverse proxy. |
| Pairing fails with rate-limit error | >10 attempts within 10 seconds | Wait 10 seconds and retry with a fresh 6-digit code. |
