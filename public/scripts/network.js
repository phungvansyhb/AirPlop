import { PersistentStorage } from "./persistent-storage.js";

const CHUNK_SIZE = 64000; // 64 KB

export class EventBus extends EventTarget {
    fire(name, detail) {
        this.dispatchEvent(new CustomEvent(name, { detail }));
    }
    on(name, cb) {
        this.addEventListener(name, cb);
    }
}

export const Events = new EventBus();

export class AirPlopClient {
    constructor() {
        this.ws = null;
        this.rtcConfig = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
        this.wsFallback = false;
        this.peers = new Map(); // peerId -> { info, roomType, roomId, rtc }
        this.selfInfo = null;
        this.activePublicRoom = null;
        this._reconnectTimer = null;
    }

    async connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }
        const proto = location.protocol === "https:" ? "wss:" : "ws:";
        const webrtcSupported = typeof RTCPeerConnection !== "undefined";
        const url = `${proto}//${location.host}?webrtc_supported=${webrtcSupported}`;

        const ws = new WebSocket(url);
        this.ws = ws;

        ws.onopen = async () => {
            Events.fire("ws-connected");
            this.send({ type: "join-ip-room" });

            const paired = await PersistentStorage.getAllPairedDevices().catch(() => []);
            if (paired.length > 0) {
                this.send({
                    type: "room-secrets",
                    roomSecrets: paired.map((d) => d.secret)
                });
            }

            if (this.activePublicRoom) {
                this.send({
                    type: "join-public-room",
                    publicRoomId: this.activePublicRoom,
                    createIfInvalid: true
                });
            }
        };

        ws.onmessage = (evt) => {
            let msg;
            try {
                msg = JSON.parse(evt.data);
            } catch {
                return;
            }
            this._handleMessage(msg);
        };

        ws.onclose = () => {
            Events.fire("ws-disconnected");
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = setTimeout(() => this.connect(), 2500);
        };
    }

    send(obj) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(obj));
        }
    }

    _handleMessage(msg) {
        switch (msg.type) {
            case "ping":
                this.send({ type: "pong" });
                break;
            case "ws-config":
                if (msg.wsConfig?.rtcConfig) this.rtcConfig = msg.wsConfig.rtcConfig;
                this.wsFallback = Boolean(msg.wsConfig?.wsFallback);
                break;
            case "display-name":
                this.selfInfo = msg;
                const savedName = localStorage.getItem("airplop_display_name");
                if (savedName && savedName.trim()) {
                    this.selfInfo.displayName = savedName.trim();
                    this.send({ type: "display-name-changed", displayName: this.selfInfo.displayName });
                }
                Events.fire("self-info", this.selfInfo);
                break;
            case "peers":
                for (const p of msg.peers) {
                    this._upsertPeer(p, msg.roomType, msg.roomId);
                }
                break;
            case "peer-joined":
                this._upsertPeer(msg.peer, msg.roomType, msg.roomId);
                break;
            case "peer-updated":
                this._upsertPeer(msg.peer, msg.roomType, msg.roomId);
                break;
            case "peer-left":
                this._removePeer(msg.peerId, msg.roomType, msg.roomId);
                break;
            case "signal":
                this._handleSignal(msg);
                break;
            case "pair-device-initiated":
                Events.fire("pair-initiated", msg);
                break;
            case "pair-device-joined":
                PersistentStorage.savePairedDevice({
                    secret: msg.roomSecret,
                    displayName: msg.peer?.name?.displayName,
                    deviceName: msg.peer?.name?.deviceName
                }).then(() => Events.fire("pair-joined", msg));
                break;
            case "pair-device-join-key-invalid":
                Events.fire("pair-invalid");
                break;
            case "pair-device-join-key-rate-limit":
                Events.fire("pair-rate-limit");
                break;
            case "public-room-created":
                this.activePublicRoom = msg.roomId;
                Events.fire("public-room-updated", msg.roomId);
                break;
            case "public-room-id-invalid":
                Events.fire("public-room-invalid", msg);
                break;
            case "public-room-left":
                this.activePublicRoom = null;
                Events.fire("public-room-updated", null);
                break;
            case "request":
            case "files-transfer-response":
            case "header":
            case "ws-chunk":
            case "file-transfer-complete":
            case "text":
                this._handleWsFallback(msg);
                break;
        }
    }

    _upsertPeer(peerInfo, roomType, roomId) {
        const existing = this.peers.get(peerInfo.id);
        if (existing) {
            existing.info = peerInfo;
            if (!existing.rooms.some((r) => r.roomId === roomId && r.roomType === roomType)) {
                existing.rooms.push({ roomType, roomId });
            }
        } else {
            this.peers.set(peerInfo.id, {
                info: peerInfo,
                rooms: [{ roomType, roomId }],
                rtc: null
            });
        }
        Events.fire("peers-changed", Array.from(this.peers.values()));
    }

    _removePeer(peerId, roomType, roomId) {
        const entry = this.peers.get(peerId);
        if (!entry) return;
        entry.rooms = entry.rooms.filter((r) => !(r.roomId === roomId && r.roomType === roomType));
        if (entry.rooms.length === 0) {
            if (entry.rtc) entry.rtc.close();
            this.peers.delete(peerId);
        }
        Events.fire("peers-changed", Array.from(this.peers.values()));
    }

    _getPrimaryRoom(peerEntry) {
        return peerEntry.rooms[0] || { roomType: "ip", roomId: "" };
    }

    async _ensureRtc(peerId, isInitiator) {
        const entry = this.peers.get(peerId);
        if (!entry) throw new Error("Peer not found");
        if (entry.rtc && entry.rtc.isConnected()) return entry.rtc;

        const room = this._getPrimaryRoom(entry);
        if (!entry.rtc) {
            entry.rtc = new RTCPeerSession({
                peerId,
                roomType: room.roomType,
                roomId: room.roomId,
                rtcConfig: this.rtcConfig,
                sendSignal: (payload) => this.send({ type: "signal", to: peerId, roomType: room.roomType, roomId: room.roomId, ...payload })
            });
            if (isInitiator) {
                await entry.rtc.createOffer();
            }
        }
        await entry.rtc.waitForChannel();
        return entry.rtc;
    }

    async _handleSignal(msg) {
        const senderId = msg.sender?.id;
        if (!senderId) return;
        const entry = this.peers.get(senderId);
        if (!entry) return;

        if (!entry.rtc) {
            const room = this._getPrimaryRoom(entry);
            entry.rtc = new RTCPeerSession({
                peerId: senderId,
                roomType: room.roomType,
                roomId: room.roomId,
                rtcConfig: this.rtcConfig,
                sendSignal: (payload) => this.send({ type: "signal", to: senderId, roomType: room.roomType, roomId: room.roomId, ...payload })
            });
        }
        await entry.rtc.handleSignal(msg);
    }

    async sendText(peerId, text) {
        const entry = this.peers.get(peerId);
        if (!entry) return;
        try {
            const rtc = await this._ensureRtc(peerId, true);
            rtc.sendJson({ type: "text", text });
        } catch {
            if (this.wsFallback) {
                const room = this._getPrimaryRoom(entry);
                this.send({ type: "text", to: peerId, roomType: room.roomType, roomId: room.roomId, text });
            }
        }
    }

    async sendFiles(peerId, files) {
        const entry = this.peers.get(peerId);
        if (!entry || !files || files.length === 0) return;

        const meta = Array.from(files).map((f) => ({
            name: f.name,
            size: f.size,
            mime: f.type || "application/octet-stream"
        }));

        try {
            const rtc = await this._ensureRtc(peerId, true);
            await rtc.sendFiles(files, meta);
        } catch {
            if (this.wsFallback) {
                await this._sendFilesViaWs(peerId, files, meta);
            }
        }
    }

    async _sendFilesViaWs(peerId, files, meta) {
        const entry = this.peers.get(peerId);
        const room = this._getPrimaryRoom(entry);
        const relay = (obj) => this.send({ ...obj, to: peerId, roomType: room.roomType, roomId: room.roomId });

        this._wsPendingAccept = this._wsPendingAccept || new Map();
        const accepted = await new Promise((resolve) => {
            this._wsPendingAccept.set(peerId, resolve);
            relay({ type: "request", files: meta });
        });
        if (!accepted) {
            Events.fire("transfer-declined", { peerId });
            return;
        }

        const totalBytes = meta.reduce((sum, f) => sum + f.size, 0) || 1;
        let sentBytes = 0;

        for (const file of files) {
            relay({ type: "header", name: file.name, size: file.size, mime: file.type });
            let offset = 0;
            while (offset < file.size) {
                const slice = file.slice(offset, offset + CHUNK_SIZE);
                const buf = await slice.arrayBuffer();
                const b64 = arrayBufferToBase64(buf);
                relay({ type: "ws-chunk", chunk: b64 });
                offset += buf.byteLength;
                sentBytes += buf.byteLength;
                Events.fire("transfer-progress", { peerId, progress: Math.min(1, sentBytes / totalBytes) });
            }
            relay({ type: "file-transfer-complete" });
        }
        Events.fire("transfer-progress", { peerId, progress: 0 });
        Events.fire("transfer-completed", { peerId });
    }

    _handleWsFallback(msg) {
        const peerId = msg.sender?.id;
        if (!peerId) return;
        const entry = this.peers.get(peerId);
        const room = entry ? this._getPrimaryRoom(entry) : { roomType: msg.roomType, roomId: msg.roomId };

        if (msg.type === "text") {
            Events.fire("text-received", { peerId, text: msg.text });
        } else if (msg.type === "request") {
            Events.fire("files-request", {
                peerId,
                peerName: entry?.info?.name?.displayName || "Peer",
                files: msg.files,
                respond: (accepted) => {
                    this.send({ type: "files-transfer-response", to: peerId, roomType: room.roomType, roomId: room.roomId, accepted });
                    if (accepted) {
                        this._wsReceivers = this._wsReceivers || new Map();
                        this._wsReceivers.set(peerId, new FileBatchReceiver(peerId, msg.files));
                    }
                }
            });
        } else if (msg.type === "files-transfer-response") {
            const resolver = this._wsPendingAccept?.get(peerId);
            if (resolver) {
                this._wsPendingAccept.delete(peerId);
                resolver(Boolean(msg.accepted));
            }
        } else if (msg.type === "header") {
            this._wsReceivers?.get(peerId)?.startFile(msg);
        } else if (msg.type === "ws-chunk") {
            this._wsReceivers?.get(peerId)?.pushChunk(base64ToArrayBuffer(msg.chunk));
        } else if (msg.type === "file-transfer-complete") {
            this._wsReceivers?.get(peerId)?.finishFile();
        }
    }
}

class RTCPeerSession {
    constructor({ peerId, rtcConfig, sendSignal }) {
        this.peerId = peerId;
        this.sendSignal = sendSignal;
        this.pc = new RTCPeerConnection(rtcConfig);
        this.channel = null;
        this._channelReadyResolvers = [];
        this._pendingAccept = null;
        this._receiver = null;

        this.pc.onicecandidate = (e) => {
            if (e.candidate) {
                this.sendSignal({ ice: e.candidate });
            }
        };

        this.pc.ondatachannel = (e) => {
            this._setupChannel(e.channel);
        };
    }

    isConnected() {
        return this.channel && this.channel.readyState === "open";
    }

    async createOffer() {
        const ch = this.pc.createDataChannel("airplop-data", { ordered: true });
        this._setupChannel(ch);
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        this.sendSignal({ sdp: this.pc.localDescription });
    }

    async handleSignal(msg) {
        if (msg.sdp) {
            await this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            if (msg.sdp.type === "offer") {
                const answer = await this.pc.createAnswer();
                await this.pc.setLocalDescription(answer);
                this.sendSignal({ sdp: this.pc.localDescription });
            }
        } else if (msg.ice) {
            try {
                await this.pc.addIceCandidate(new RTCIceCandidate(msg.ice));
            } catch {
                // ignore stale candidates
            }
        }
    }

    _setupChannel(channel) {
        this.channel = channel;
        channel.binaryType = "arraybuffer";
        channel.bufferedAmountLowThreshold = 256 * 1024;

        channel.onopen = () => {
            for (const r of this._channelReadyResolvers) r();
            this._channelReadyResolvers = [];
        };

        channel.onmessage = (e) => {
            if (typeof e.data === "string") {
                const msg = JSON.parse(e.data);
                this._onJsonMessage(msg);
            } else {
                this._receiver?.pushChunk(e.data);
            }
        };
    }

    waitForChannel() {
        if (this.isConnected()) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error("WebRTC timeout")), 10000);
            this._channelReadyResolvers.push(() => {
                clearTimeout(timer);
                resolve();
            });
        });
    }

    sendJson(obj) {
        this.channel.send(JSON.stringify(obj));
    }

    _onJsonMessage(msg) {
        switch (msg.type) {
            case "text":
                Events.fire("text-received", { peerId: this.peerId, text: msg.text });
                break;
            case "request":
                Events.fire("files-request", {
                    peerId: this.peerId,
                    files: msg.files,
                    respond: (accepted) => {
                        this.sendJson({ type: "files-transfer-response", accepted });
                        if (accepted) {
                            this._receiver = new FileBatchReceiver(this.peerId, msg.files);
                        }
                    }
                });
                break;
            case "files-transfer-response":
                if (this._pendingAccept) {
                    const res = this._pendingAccept;
                    this._pendingAccept = null;
                    res(Boolean(msg.accepted));
                }
                break;
            case "header":
                this._receiver?.startFile(msg);
                break;
            case "file-transfer-complete":
                this._receiver?.finishFile();
                break;
        }
    }

    async sendFiles(files, meta) {
        const accepted = await new Promise((resolve) => {
            this._pendingAccept = resolve;
            this.sendJson({ type: "request", files: meta });
        });

        if (!accepted) {
            Events.fire("transfer-declined", { peerId: this.peerId });
            return;
        }

        const totalBytes = meta.reduce((sum, f) => sum + f.size, 0) || 1;
        let sentBytes = 0;

        for (const file of files) {
            this.sendJson({ type: "header", name: file.name, size: file.size, mime: file.type });
            let offset = 0;
            while (offset < file.size) {
                if (this.channel.bufferedAmount > 1024 * 1024) {
                    await new Promise((res) => {
                        this.channel.onbufferedamountlow = () => {
                            this.channel.onbufferedamountlow = null;
                            res();
                        };
                    });
                }
                const slice = file.slice(offset, offset + CHUNK_SIZE);
                const buf = await slice.arrayBuffer();
                this.channel.send(buf);
                offset += buf.byteLength;
                sentBytes += buf.byteLength;
                Events.fire("transfer-progress", { peerId: this.peerId, progress: Math.min(1, sentBytes / totalBytes) });
            }
            this.sendJson({ type: "file-transfer-complete" });
        }

        Events.fire("transfer-progress", { peerId: this.peerId, progress: 0 });
        Events.fire("transfer-completed", { peerId: this.peerId });
    }

    close() {
        try {
            this.channel?.close();
            this.pc?.close();
        } catch {
            // ignore
        }
    }
}

class FileBatchReceiver {
    constructor(peerId, filesMeta) {
        this.peerId = peerId;
        this.filesMeta = filesMeta;
        this.totalBytes = filesMeta.reduce((s, f) => s + f.size, 0) || 1;
        this.receivedBytes = 0;
        this.currentHeader = null;
        this.currentChunks = [];
        this.completedFiles = [];
    }

    startFile(header) {
        this.currentHeader = header;
        this.currentChunks = [];
    }

    pushChunk(arrayBuffer) {
        this.currentChunks.push(arrayBuffer);
        this.receivedBytes += arrayBuffer.byteLength;
        Events.fire("transfer-progress", {
            peerId: this.peerId,
            progress: Math.min(1, this.receivedBytes / this.totalBytes)
        });
    }

    finishFile() {
        if (!this.currentHeader) return;
        const blob = new Blob(this.currentChunks, { type: this.currentHeader.mime || "application/octet-stream" });
        this.completedFiles.push({ name: this.currentHeader.name, blob });
        this.currentChunks = [];
        this.currentHeader = null;

        if (this.completedFiles.length === this.filesMeta.length) {
            Events.fire("transfer-progress", { peerId: this.peerId, progress: 0 });
            Events.fire("files-received", { peerId: this.peerId, files: this.completedFiles });
        }
    }
}

function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToArrayBuffer(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}
