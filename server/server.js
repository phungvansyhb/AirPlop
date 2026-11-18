import express from "express";
import rateLimit from "express-rate-limit";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class AirPlopServer {
    constructor(conf = {}) {
        const app = express();

        if (conf.rateLimit) {
            const limiter = rateLimit({
                windowMs: 5 * 60 * 1000,
                max: 1000,
                standardHeaders: true,
                legacyHeaders: false
            });
            app.use(limiter);
            app.set("trust proxy", conf.rateLimit);
        }

        const publicDir = path.join(__dirname, "..", "public");
        app.use(express.static(publicDir));

        app.get("/config", (_req, res) => {
            res.json({
                signalingServer: conf.signalingServer || false,
                wsFallback: Boolean(conf.wsFallback),
                buttons: conf.buttons || []
            });
        });

        app.use((_req, res) => {
            res.sendFile(path.join(publicDir, "index.html"));
        });

        this.app = app;
        this.server = http.createServer(app);
    }
}
