import crypto from "crypto";
import UAParser from "ua-parser-js";
import { animals, colors, uniqueNamesGenerator } from "unique-names-generator";
import { cyrb53 } from "./helper.js";

export default class Peer {
    constructor(socket, request, conf = {}) {
        this.conf = conf;
        this.socket = socket;

        this._setIP(request);
        this._setPeerId(request);
        this._setRtcSupported(request);
        this._setName(request);

        this.requestRate = 0;
        this.roomSecrets = [];
        this.pairKey = null;
        this.publicRoomId = null;
    }

    rateLimitReached() {
        if (this.requestRate >= 10) {
            return true;
        }
        this.requestRate += 1;
        setTimeout(() => {
            this.requestRate = Math.max(0, this.requestRate - 1);
        }, 10000);
        return false;
    }

    _setIP(request) {
        if (request.headers["cf-connecting-ip"]) {
            this.ip = request.headers["cf-connecting-ip"].split(/\s*,\s*/)[0];
        } else if (request.headers["x-forwarded-for"]) {
            this.ip = request.headers["x-forwarded-for"].split(/\s*,\s*/)[0];
        } else {
            this.ip = request.socket?.remoteAddress ?? "127.0.0.1";
        }

        if (this.ip.startsWith("::ffff:")) {
            this.ip = this.ip.substring(7);
        }

        if (this.conf.ipv6Localize && this.ip.includes(":")) {
            this.ip = this.ip.split(":", this.conf.ipv6Localize).join(":");
        }

        if (this.ip === "::1" || this.ipIsPrivate(this.ip)) {
            this.ip = "127.0.0.1";
        }
    }

    ipIsPrivate(ip) {
        if (!ip.includes(":")) {
            return (
                /^10\./.test(ip) ||
                /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip) ||
                /^192\.168\./.test(ip) ||
                ip === "127.0.0.1"
            );
        }

        const firstWord = ip.split(":").find((el) => !!el) || "";
        return (
            /^fe[c-f][0-f]$/i.test(firstWord) ||
            /^fc[0-f]{2}$/i.test(firstWord) ||
            /^fd[0-f]{2}$/i.test(firstWord) ||
            firstWord.toLowerCase() === "fe80" ||
            firstWord === "100"
        );
    }

    _setPeerId(request) {
        const url = new URL(request.url || "/", "http://localhost");
        const peerId = url.searchParams.get("peer_id");
        if (peerId && Peer.isValidUuid(peerId)) {
            this.id = peerId;
        } else {
            this.id = crypto.randomUUID();
        }
    }

    _setRtcSupported(request) {
        const url = new URL(request.url || "/", "http://localhost");
        this.rtcSupported = url.searchParams.get("webrtc_supported") !== "false";
    }

    _setName(request) {
        const ua = new UAParser(request.headers["user-agent"] || "");
        const result = ua.getResult();

        let deviceName = "";
        if (result.os?.name) {
            deviceName = result.os.name.replace("Mac OS", "macOS") + " ";
        }
        if (result.device?.model) {
            deviceName += result.device.model;
        } else if (result.browser?.name) {
            deviceName += result.browser.name;
        }
        if (!deviceName.trim()) {
            deviceName = "Unknown Device";
        }

        const displayName = uniqueNamesGenerator({
            length: 2,
            separator: " ",
            dictionaries: [colors, animals],
            style: "capital",
            seed: cyrb53(this.id)
        });

        this.name = {
            model: result.device?.model || "",
            os: result.os?.name || "",
            browser: result.browser?.name || "",
            type: result.device?.type || "desktop",
            deviceName: deviceName.trim(),
            displayName
        };
    }

    getInfo() {
        return {
            id: this.id,
            name: this.name,
            rtcSupported: this.rtcSupported
        };
    }

    static isValidUuid(uuid) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
    }
}
