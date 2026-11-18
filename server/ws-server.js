import { WebSocketServer } from "ws";
import crypto from "crypto";
import Peer from "./peer.js";
import { hasher, randomizer } from "./helper.js";

export default class AirPlopWsServer {
    constructor(server, conf = {}) {
        this._conf = conf;
        this._rooms = {}; // { roomId: { peerId: Peer } }
        this._pairKeys = {}; // { pairKey: { creator: Peer, roomSecret: string } }
        this._keepAliveTimers = {};

        this._wss = new WebSocketServer({ server });
        this._wss.on("connection", (socket, request) => {
            this._onConnection(new Peer(socket, request, conf));
        });
    }

    _onConnection(peer) {
        peer.socket.on("message", (message) => this._onMessage(peer, message));
        peer.socket.on("close", () => this._disconnect(peer));
        peer.socket.on("error", (e) => console.error("WS error:", e));

        this._keepAlive(peer);

        this._send(peer, {
            type: "ws-config",
            wsConfig: {
                rtcConfig: this._conf.rtcConfig,
                wsFallback: Boolean(this._conf.wsFallback)
            }
        });

        this._send(peer, {
            type: "display-name",
            displayName: peer.name.displayName,
            deviceName: peer.name.deviceName,
            peerId: peer.id,
            peerIdHash: hasher.hashCodeSalted(peer.id)
        });
    }

    _onMessage(sender, rawMessage) {
        let message;
        try {
            message = JSON.parse(rawMessage);
        } catch {
            return;
        }

        switch (message.type) {
            case "disconnect":
                this._disconnect(sender);
                break;
            case "pong":
                this._setKeepAliveTimerToNow(sender);
                break;
            case "join-ip-room":
                this._joinRoom(sender, sender.ip, "ip");
                break;
            case "room-secrets":
                this._onRoomSecrets(sender, message);
                break;
            case "room-secrets-deleted":
                this._onRoomSecretsDeleted(sender, message);
                break;
            case "pair-device-initiate":
                this._onPairDeviceInitiate(sender);
                break;
            case "pair-device-join":
                this._onPairDeviceJoin(sender, message);
                break;
            case "pair-device-cancel":
                this._onPairDeviceCancel(sender);
                break;
            case "regenerate-room-secret":
                this._onRegenerateRoomSecret(sender, message);
                break;
            case "create-public-room":
                this._onCreatePublicRoom(sender);
                break;
            case "join-public-room":
                this._onJoinPublicRoom(sender, message);
                break;
            case "leave-public-room":
                this._onLeavePublicRoom(sender);
                break;
            case "display-name-changed":
                if (typeof message.displayName === "string" && message.displayName.trim()) {
                    sender.name.displayName = message.displayName.trim().slice(0, 40);
                    this._broadcastDisplayNameChange(sender);
                }
                break;
            case "signal":
                this._signalAndRelay(sender, message);
                break;
            case "request":
            case "header":
            case "partition":
            case "partition-received":
            case "progress":
            case "files-transfer-response":
            case "file-transfer-complete":
            case "message-transfer-complete":
            case "text":
            case "ws-chunk":
                if (this._conf.wsFallback) {
                    this._signalAndRelay(sender, message);
                }
                break;
        }
    }

    _signalAndRelay(sender, message) {
        const room = message.roomType === "ip" ? sender.ip : message.roomId;
        if (message.to && Peer.isValidUuid(message.to) && this._rooms[room] && this._rooms[room][message.to]) {
            const recipient = this._rooms[room][message.to];
            const relayed = { ...message };
            delete relayed.to;
            relayed.sender = {
                id: sender.id,
                rtcSupported: sender.rtcSupported
            };
            this._send(recipient, relayed);
        }
    }

    _joinRoom(peer, roomId, roomType) {
        if (!roomId) return;
        if (!this._rooms[roomId]) {
            this._rooms[roomId] = {};
        }

        const otherPeers = [];
        for (const otherId in this._rooms[roomId]) {
            const otherPeer = this._rooms[roomId][otherId];
            if (otherPeer.id === peer.id) continue;
            otherPeers.push(otherPeer.getInfo());
            this._send(otherPeer, {
                type: "peer-joined",
                peer: peer.getInfo(),
                roomType,
                roomId
            });
        }

        this._rooms[roomId][peer.id] = peer;

        this._send(peer, {
            type: "peers",
            peers: otherPeers,
            roomType,
            roomId
        });
    }

    _leaveRoom(peer, roomId, roomType) {
        if (!roomId || !this._rooms[roomId] || !this._rooms[roomId][peer.id]) return;

        delete this._rooms[roomId][peer.id];

        for (const otherId in this._rooms[roomId]) {
            const otherPeer = this._rooms[roomId][otherId];
            this._send(otherPeer, {
                type: "peer-left",
                peerId: peer.id,
                roomType,
                roomId
            });
        }

        if (Object.keys(this._rooms[roomId]).length === 0) {
            delete this._rooms[roomId];
        }
    }

    _broadcastDisplayNameChange(sender) {
        const rooms = [
            { id: sender.ip, type: "ip" },
            ...sender.roomSecrets.map((s) => ({ id: s, type: "secret" }))
        ];
        if (sender.publicRoomId) {
            rooms.push({ id: sender.publicRoomId, type: "public" });
        }

        for (const r of rooms) {
            if (!this._rooms[r.id]) continue;
            for (const otherId in this._rooms[r.id]) {
                if (otherId === sender.id) continue;
                this._send(this._rooms[r.id][otherId], {
                    type: "peer-updated",
                    peer: sender.getInfo(),
                    roomType: r.type,
                    roomId: r.id
                });
            }
        }
    }

    _onRoomSecrets(peer, message) {
        if (!Array.isArray(message.roomSecrets)) return;
        for (const secret of message.roomSecrets) {
            if (typeof secret === "string" && secret.length >= 32 && !peer.roomSecrets.includes(secret)) {
                peer.roomSecrets.push(secret);
                this._joinRoom(peer, secret, "secret");
            }
        }
    }

    _onRoomSecretsDeleted(peer, message) {
        if (!Array.isArray(message.roomSecrets)) return;
        for (const secret of message.roomSecrets) {
            peer.roomSecrets = peer.roomSecrets.filter((s) => s !== secret);
            this._leaveRoom(peer, secret, "secret");
        }
    }

    _onRegenerateRoomSecret(peer, message) {
        const oldSecret = message.roomSecret;
        if (!oldSecret || !this._rooms[oldSecret]) return;
        const newSecret = crypto.randomBytes(32).toString("hex");
        const peersInRoom = Object.values(this._rooms[oldSecret]);
        for (const p of peersInRoom) {
            this._leaveRoom(p, oldSecret, "secret");
            p.roomSecrets = p.roomSecrets.filter((s) => s !== oldSecret);
            p.roomSecrets.push(newSecret);
            this._send(p, {
                type: "secret-room-deleted",
                roomSecret: oldSecret
            });
            this._send(p, {
                type: "pair-device-joined",
                roomSecret: newSecret,
                peers: peersInRoom.filter((o) => o.id !== p.id).map((o) => o.getInfo())
            });
            this._joinRoom(p, newSecret, "secret");
        }
    }

    _onPairDeviceInitiate(peer) {
        if (peer.rateLimitReached()) {
            this._send(peer, { type: "pair-device-join-key-rate-limit" });
            return;
        }
        this._removePairKey(peer.pairKey);

        let pairKey = randomizer.getRandomString(6, false);
        while (this._pairKeys[pairKey]) {
            pairKey = randomizer.getRandomString(6, false);
        }

        const roomSecret = crypto.randomBytes(32).toString("hex");
        peer.pairKey = pairKey;
        this._pairKeys[pairKey] = {
            creator: peer,
            roomSecret
        };

        this._send(peer, {
            type: "pair-device-initiated",
            pairKey,
            roomSecret
        });
    }

    _onPairDeviceJoin(peer, message) {
        if (peer.rateLimitReached()) {
            this._send(peer, { type: "pair-device-join-key-rate-limit" });
            return;
        }

        const pairKey = String(message.pairKey || "").trim();
        const entry = this._pairKeys[pairKey];

        if (!entry || entry.creator.id === peer.id) {
            this._send(peer, { type: "pair-device-join-key-invalid" });
            return;
        }

        const { creator, roomSecret } = entry;
        this._removePairKey(pairKey);
        creator.pairKey = null;

        if (!creator.roomSecrets.includes(roomSecret)) creator.roomSecrets.push(roomSecret);
        if (!peer.roomSecrets.includes(roomSecret)) peer.roomSecrets.push(roomSecret);

        this._send(creator, {
            type: "pair-device-joined",
            roomSecret,
            peer: peer.getInfo()
        });
        this._send(peer, {
            type: "pair-device-joined",
            roomSecret,
            peer: creator.getInfo()
        });

        this._joinRoom(creator, roomSecret, "secret");
        this._joinRoom(peer, roomSecret, "secret");
    }

    _onPairDeviceCancel(peer) {
        this._removePairKey(peer.pairKey);
        peer.pairKey = null;
        this._send(peer, { type: "pair-device-canceled" });
    }

    _removePairKey(pairKey) {
        if (pairKey && this._pairKeys[pairKey]) {
            delete this._pairKeys[pairKey];
        }
    }

    _onCreatePublicRoom(peer) {
        this._onLeavePublicRoom(peer);
        let roomId = randomizer.getRandomString(5, true);
        while (this._rooms[roomId]) {
            roomId = randomizer.getRandomString(5, true);
        }
        peer.publicRoomId = roomId;
        this._send(peer, {
            type: "public-room-created",
            roomId
        });
        this._joinRoom(peer, roomId, "public");
    }

    _onJoinPublicRoom(peer, message) {
        const roomId = String(message.publicRoomId || "").trim().toUpperCase();
        if (!/^[A-Z]{5}$/.test(roomId)) {
            this._send(peer, { type: "public-room-id-invalid", roomId });
            return;
        }
        if (!this._rooms[roomId] && !message.createIfInvalid) {
            this._send(peer, { type: "public-room-id-invalid", roomId });
            return;
        }
        if (peer.publicRoomId && peer.publicRoomId !== roomId) {
            this._onLeavePublicRoom(peer);
        }
        peer.publicRoomId = roomId;
        this._joinRoom(peer, roomId, "public");
    }

    _onLeavePublicRoom(peer) {
        if (!peer.publicRoomId) return;
        const roomId = peer.publicRoomId;
        peer.publicRoomId = null;
        this._leaveRoom(peer, roomId, "public");
        this._send(peer, { type: "public-room-left", roomId });
    }

    _disconnect(peer) {
        if (peer._disconnected) return;
        peer._disconnected = true;

        this._removePairKey(peer.pairKey);
        peer.pairKey = null;

        this._cancelKeepAlive(peer);
        delete this._keepAliveTimers[peer.id];

        this._leaveRoom(peer, peer.ip, "ip");
        for (const secret of peer.roomSecrets) {
            this._leaveRoom(peer, secret, "secret");
        }
        if (peer.publicRoomId) {
            this._leaveRoom(peer, peer.publicRoomId, "public");
        }

        try {
            peer.socket.terminate();
        } catch {
            // ignore
        }
    }

    _keepAlive(peer) {
        this._cancelKeepAlive(peer);
        const timeout = 30000;
        if (!this._keepAliveTimers[peer.id]) {
            this._keepAliveTimers[peer.id] = { lastBeat: Date.now() };
        }
        if (Date.now() - this._keepAliveTimers[peer.id].lastBeat > 2 * timeout) {
            this._disconnect(peer);
            return;
        }
        this._send(peer, { type: "ping" });
        this._keepAliveTimers[peer.id].timerId = setTimeout(() => this._keepAlive(peer), timeout);
    }

    _setKeepAliveTimerToNow(peer) {
        if (this._keepAliveTimers[peer.id]) {
            this._keepAliveTimers[peer.id].lastBeat = Date.now();
        }
    }

    _cancelKeepAlive(peer) {
        if (this._keepAliveTimers[peer.id]?.timerId) {
            clearTimeout(this._keepAliveTimers[peer.id].timerId);
        }
    }

    _send(peer, message) {
        if (!peer || !peer.socket || peer.socket.readyState !== 1) return;
        peer.socket.send(JSON.stringify(message));
    }

    close() {
        for (const id in this._keepAliveTimers) {
            clearTimeout(this._keepAliveTimers[id]?.timerId);
        }
        this._wss.close();
    }
}
