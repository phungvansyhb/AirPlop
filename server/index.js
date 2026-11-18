import fs from "fs";
import AirPlopServer from "./server.js";
import AirPlopWsServer from "./ws-server.js";

const argv = process.argv.slice(2);
const hasFlag = (flag) => argv.includes(flag);

let rtcConfig = {
    sdpSemantics: "unified-plan",
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
    ]
};

const rtcConfigFile = process.env.RTC_CONFIG;
if (rtcConfigFile && fs.existsSync(rtcConfigFile)) {
    rtcConfig = JSON.parse(fs.readFileSync(rtcConfigFile, "utf8"));
}

const conf = {
    port: Number(process.env.PORT) || 3000,
    rateLimit: hasFlag("--rate-limit") || process.env.RATE_LIMIT === "true",
    wsFallback: hasFlag("--ws-fallback") || process.env.WS_FALLBACK === "true",
    ipv6Localize: Number(process.env.IPV6_LOCALIZE) || false,
    rtcConfig,
    debugMode: hasFlag("--debug") || process.env.DEBUG_MODE === "true"
};

const httpServer = new AirPlopServer(conf);
const wsServer = new AirPlopWsServer(httpServer.server, conf);

httpServer.server.listen(conf.port, () => {
    console.log(`AirPlop running on http://localhost:${conf.port}`);
    if (conf.wsFallback) console.log("WebSocket fallback: ENABLED");
    if (conf.rateLimit) console.log("Rate limiting: ENABLED");
});

if (hasFlag("--auto-restart") || process.env.AUTO_RESTART === "true") {
    process.on("uncaughtException", (err) => {
        console.error("Uncaught Exception:", err);
        process.exit(1);
    });
}

export { httpServer, wsServer };
