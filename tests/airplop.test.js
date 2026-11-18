import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { WebSocket } from "ws";
import Peer from "../server/peer.js";
import AirPlopServer from "../server/server.js";
import AirPlopWsServer from "../server/ws-server.js";

function waitForMessage(ws, predicate) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Timeout waiting for WS message")), 4000);
        const handler = (raw) => {
            const msg = JSON.parse(raw.toString());
            if (predicate(msg)) {
                clearTimeout(timer);
                ws.off("message", handler);
                resolve(msg);
            }
        };
        ws.on("message", handler);
    });
}

describe("AirPlop Unit & Integration Tests", () => {
    let httpSrv;
    let wsSrv;
    let baseUrl;
    let wsUrl;

    before(async () => {
        const conf = {
            port: 0,
            wsFallback: true,
            rtcConfig: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }
        };
        httpSrv = new AirPlopServer(conf);
        wsSrv = new AirPlopWsServer(httpSrv.server, conf);
        await new Promise((resolve) => {
            httpSrv.server.listen(0, "127.0.0.1", () => {
                const { port } = httpSrv.server.address();
                baseUrl = `http://127.0.0.1:${port}`;
                wsUrl = `ws://127.0.0.1:${port}`;
                resolve();
            });
        });
    });

    after(async () => {
        wsSrv.close();
        await new Promise((resolve) => httpSrv.server.close(resolve));
    });

    it("i18n: en.json and vi.json have identical key sets", () => {
        const en = JSON.parse(fs.readFileSync(path.resolve("public/lang/en.json"), "utf8"));
        const vi = JSON.parse(fs.readFileSync(path.resolve("public/lang/vi.json"), "utf8"));
        assert.deepEqual(Object.keys(en).sort(), Object.keys(vi).sort());
    });

    it("Peer: normalizes private IPv4 and IPv6 addresses to 127.0.0.1", () => {
        const p1 = new Peer(null, { headers: { "x-forwarded-for": "192.168.1.42" }, socket: {} });
        const p2 = new Peer(null, { headers: { "cf-connecting-ip": "10.0.0.5" }, socket: {} });
        const p3 = new Peer(null, { headers: {}, socket: { remoteAddress: "fe80::1" } });
        assert.equal(p1.ip, "127.0.0.1");
        assert.equal(p2.ip, "127.0.0.1");
        assert.equal(p3.ip, "127.0.0.1");
    });

    it("HTTP: serves /config and index.html", async () => {
        const resCfg = await fetch(`${baseUrl}/config`);
        assert.equal(resCfg.status, 200);
        const cfg = await resCfg.json();
        assert.equal(cfg.wsFallback, true);

        const resHtml = await fetch(`${baseUrl}/`);
        assert.equal(resHtml.status, 200);
        const html = await resHtml.text();
        assert.match(html, /AirPlop/);
    });

    it("WS: local IP room discovery, pairing, public room, and signal relay", async () => {
        const ws1 = new WebSocket(wsUrl);
        const ws2 = new WebSocket(wsUrl);

        const [dn1, dn2] = await Promise.all([
            waitForMessage(ws1, (m) => m.type === "display-name"),
            waitForMessage(ws2, (m) => m.type === "display-name")
        ]);
        assert.ok(dn1.peerId && dn2.peerId);

        // Join IP room
        ws1.send(JSON.stringify({ type: "join-ip-room" }));
        await waitForMessage(ws1, (m) => m.type === "peers");

        const joinedPromise = waitForMessage(ws1, (m) => m.type === "peer-joined" && m.peer.id === dn2.peerId);
        ws2.send(JSON.stringify({ type: "join-ip-room" }));
        await joinedPromise;

        // Signal relay
        const sigPromise = waitForMessage(ws2, (m) => m.type === "signal" && m.sender.id === dn1.peerId);
        ws1.send(JSON.stringify({ type: "signal", to: dn2.peerId, roomType: "ip", sdp: { type: "offer", sdp: "dummy" } }));
        const sig = await sigPromise;
        assert.equal(sig.sdp.type, "offer");

        // Device Pairing
        ws1.send(JSON.stringify({ type: "pair-device-initiate" }));
        const initMsg = await waitForMessage(ws1, (m) => m.type === "pair-device-initiated");
        assert.match(initMsg.pairKey, /^\d{6}$/);

        const pairJoin1 = waitForMessage(ws1, (m) => m.type === "pair-device-joined");
        const pairJoin2 = waitForMessage(ws2, (m) => m.type === "pair-device-joined");
        ws2.send(JSON.stringify({ type: "pair-device-join", pairKey: initMsg.pairKey }));
        const [pj1, pj2] = await Promise.all([pairJoin1, pairJoin2]);
        assert.equal(pj1.roomSecret, pj2.roomSecret);

        // Public Room
        ws1.send(JSON.stringify({ type: "create-public-room" }));
        const roomMsg = await waitForMessage(ws1, (m) => m.type === "public-room-created");
        assert.match(roomMsg.roomId, /^[A-Z]{5}$/);

        const pubJoined = waitForMessage(ws1, (m) => m.type === "peer-joined" && m.roomType === "public");
        ws2.send(JSON.stringify({ type: "join-public-room", publicRoomId: roomMsg.roomId }));
        await pubJoined;

        ws1.close();
        ws2.close();
    });
});
