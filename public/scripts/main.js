import { Localization } from "./localization.js";
import { AirPlopClient } from "./network.js";
import { AirPlopUI } from "./ui.js";

async function bootstrap() {
    await Localization.init();

    const client = new AirPlopClient();
    new AirPlopUI(client);

    // Handle URL query params (?pair_key=... or ?room=...)
    const params = new URLSearchParams(location.search);
    const roomParam = params.get("room");
    if (roomParam && /^[A-Za-z]{5}$/.test(roomParam)) {
        client.activePublicRoom = roomParam.toUpperCase();
    }

    await client.connect();

    const pairParam = params.get("pair_key");
    if (pairParam && /^\d{6}$/.test(pairParam)) {
        setTimeout(() => {
            client.send({ type: "pair-device-join", pairKey: pairParam });
        }, 600);
    }

    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/service-worker.js").catch(() => {});
    }
}

bootstrap();
