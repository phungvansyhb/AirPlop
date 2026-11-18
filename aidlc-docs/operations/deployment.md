# Deployment Guide (`deployment.md`)

## 1. Local Development (Node.js)
```bash
npm install
npm start
# Open http://localhost:3000
```

## 2. Production Flags & Environment Variables
```bash
PORT=3000 RATE_LIMIT=true WS_FALLBACK=true node server/index.js --rate-limit --auto-restart
```
- `PORT`: HTTP/WebSocket listening port (default `3000`).
- `RATE_LIMIT`: Enable Express rate limiting (`true` / `false`).
- `WS_FALLBACK`: Allow WebSocket chunk relay when WebRTC is blocked (`true` / `false`).
- `RTC_CONFIG`: Path to JSON file containing custom `iceServers` (STUN/TURN).
- `IPV6_LOCALIZE`: Number of IPv6 segments to group peers (1–8).

## 3. Docker & Docker Compose
```bash
docker compose up -d --build
```
Place behind a TLS reverse proxy (Nginx, Caddy, Traefik) so `https://` and `wss://` work for PWA installation and WebRTC on mobile browsers.
