import { Localization } from "./localization.js";
import { Events } from "./network.js";
import { PersistentStorage } from "./persistent-storage.js";

export class AirPlopUI {
    constructor(client) {
        this.client = client;
        this.selectedPeerId = null;
        this.pendingDroppedFiles = null;
        this.currentTheme = localStorage.getItem("airplop_theme") || "auto";

        this._initTheme();
        this._bindHeaderActions();
        this._bindModals();
        this._bindDragAndPaste();
        this._bindNetworkEvents();
    }

    _initTheme() {
        this._applyTheme(this.currentTheme);
    }

    _applyTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem("airplop_theme", theme);
        document.documentElement.setAttribute("data-theme", theme);
        const btn = document.getElementById("btn-theme");
        if (btn) {
            btn.textContent = theme === "light" ? "☀️" : theme === "dark" ? "🌙" : "🌗";
            const key = theme === "light" ? "header.themeLight" : theme === "dark" ? "header.themeDark" : "header.themeAuto";
            btn.title = Localization.get(key);
        }
    }

    _bindHeaderActions() {
        const btnLang = document.getElementById("btn-lang");
        const syncLangLabel = () => {
            btnLang.textContent = Localization.lang.toUpperCase();
        };
        syncLangLabel();
        window.addEventListener("language-changed", () => {
            syncLangLabel();
            this._applyTheme(this.currentTheme);
            this._renderPeers(Array.from(this.client.peers.values()));
            this._renderPublicRoomBanner(this.client.activePublicRoom);
        });

        btnLang.addEventListener("click", () => {
            const next = Localization.lang === "en" ? "vi" : "en";
            Localization.setLanguage(next);
        });

        document.getElementById("btn-theme").addEventListener("click", () => {
            const order = ["auto", "light", "dark"];
            const next = order[(order.indexOf(this.currentTheme) + 1) % order.length];
            this._applyTheme(next);
        });

        document.getElementById("btn-pair").addEventListener("click", async () => {
            await this._renderPairedDevicesList();
            this._openModal("modal-pair");
        });

        document.getElementById("btn-public-room").addEventListener("click", () => {
            this._openModal("modal-public-room");
        });

        document.getElementById("btn-about").addEventListener("click", () => {
            this._openModal("modal-about");
        });

        document.getElementById("btn-self-name").addEventListener("click", () => {
            const input = document.getElementById("rename-input");
            input.value = this.client.selfInfo?.displayName || "";
            this._openModal("modal-rename");
            input.focus();
        });
    }

    _bindModals() {
        document.querySelectorAll("[data-close-modal]").forEach((btn) => {
            btn.addEventListener("click", () => this._closeAllModals());
        });

        document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
            backdrop.addEventListener("click", (e) => {
                if (e.target === backdrop) this._closeAllModals();
            });
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") this._closeAllModals();
        });

        // Send text
        const textInput = document.getElementById("send-text-input");
        const sendTextAction = () => {
            const text = textInput.value.trim();
            if (!text || !this.selectedPeerId) return;
            this.client.sendText(this.selectedPeerId, text);
            textInput.value = "";
            this._closeAllModals();
            this.showToast(Localization.get("transfer.completed"));
        };
        document.getElementById("btn-confirm-send-text").addEventListener("click", sendTextAction);
        textInput.addEventListener("keydown", (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") sendTextAction();
        });

        // Copy received text
        document.getElementById("btn-copy-text").addEventListener("click", async () => {
            const val = document.getElementById("receive-text-output").value;
            await navigator.clipboard.writeText(val);
            this.showToast(Localization.get("toast.copied"));
        });

        // File input
        document.getElementById("file-input").addEventListener("change", (e) => {
            if (e.target.files.length > 0 && this.selectedPeerId) {
                this.client.sendFiles(this.selectedPeerId, e.target.files);
                e.target.value = "";
            }
        });

        // Pair device
        document.getElementById("btn-generate-pair").addEventListener("click", () => {
            this.client.send({ type: "pair-device-initiate" });
        });
        document.getElementById("btn-join-pair").addEventListener("click", () => {
            const code = document.getElementById("pair-join-input").value.trim();
            if (code.length === 6) {
                this.client.send({ type: "pair-device-join", pairKey: code });
            }
        });

        // Public room
        document.getElementById("btn-create-public-room").addEventListener("click", () => {
            this.client.send({ type: "create-public-room" });
        });
        document.getElementById("btn-join-public-room").addEventListener("click", () => {
            const code = document.getElementById("public-room-input").value.trim().toUpperCase();
            if (code.length === 5) {
                this.client.send({ type: "join-public-room", publicRoomId: code });
            }
        });
        document.getElementById("btn-leave-public-room").addEventListener("click", () => {
            this.client.send({ type: "leave-public-room" });
        });

        // Rename
        document.getElementById("btn-save-rename").addEventListener("click", () => {
            const newName = document.getElementById("rename-input").value.trim();
            if (newName) {
                localStorage.setItem("airplop_display_name", newName);
                if (this.client.selfInfo) this.client.selfInfo.displayName = newName;
                document.getElementById("btn-self-name").textContent = newName;
                this.client.send({ type: "display-name-changed", displayName: newName });
                this.showToast(Localization.get("toast.nameUpdated"));
            }
            this._closeAllModals();
        });
    }

    _bindDragAndPaste() {
        const overlay = document.getElementById("drop-overlay");
        let dragDepth = 0;

        window.addEventListener("dragenter", (e) => {
            e.preventDefault();
            dragDepth++;
            overlay.classList.add("active");
        });
        window.addEventListener("dragleave", (e) => {
            e.preventDefault();
            dragDepth = Math.max(0, dragDepth - 1);
            if (dragDepth === 0) overlay.classList.remove("active");
        });
        window.addEventListener("dragover", (e) => e.preventDefault());
        window.addEventListener("drop", (e) => {
            e.preventDefault();
            dragDepth = 0;
            overlay.classList.remove("active");
            if (e.dataTransfer?.files?.length > 0) {
                this.pendingDroppedFiles = e.dataTransfer.files;
                this.showToast(Localization.get("toast.fileSelected"));
            }
        });

        window.addEventListener("paste", (e) => {
            if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
            const files = e.clipboardData?.files;
            if (files && files.length > 0) {
                this.pendingDroppedFiles = files;
                this.showToast(Localization.get("toast.fileSelected"));
            }
        });
    }

    _bindNetworkEvents() {
        Events.on("self-info", (e) => {
            document.getElementById("btn-self-name").textContent = e.detail.displayName;
            document.getElementById("self-device").textContent = e.detail.deviceName;
        });

        Events.on("peers-changed", (e) => {
            this._renderPeers(e.detail);
        });

        Events.on("text-received", (e) => {
            document.getElementById("receive-text-output").value = e.detail.text;
            this._openModal("modal-receive-text");
        });

        Events.on("files-request", (e) => {
            const { peerId, files, respond } = e.detail;
            const peerEntry = this.client.peers.get(peerId);
            const name = peerEntry?.info?.name?.displayName || "Peer";
            const totalSize = files.reduce((s, f) => s + f.size, 0);

            document.getElementById("receive-files-meta").textContent =
                `${Localization.get("modal.receiveFilesFrom")}: ${name} (${files.length} file(s), ${formatBytes(totalSize)})`;

            const listEl = document.getElementById("receive-files-list");
            listEl.innerHTML = "";
            for (const f of files) {
                const row = document.createElement("div");
                row.className = "paired-item";
                const fname = document.createElement("span");
                fname.textContent = f.name;
                const fsize = document.createElement("span");
                fsize.textContent = formatBytes(f.size);
                row.append(fname, fsize);
                listEl.appendChild(row);
            }

            const btnAccept = document.getElementById("btn-accept-files");
            const btnDecline = document.getElementById("btn-decline-files");
            btnAccept.onclick = () => {
                respond(true);
                this._closeAllModals();
            };
            btnDecline.onclick = () => {
                respond(false);
                this._closeAllModals();
            };

            this._openModal("modal-receive-files");
        });

        Events.on("transfer-progress", (e) => {
            const { peerId, progress } = e.detail;
            const card = document.querySelector(`[data-peer-id="${peerId}"]`);
            if (!card) return;
            const wrap = card.querySelector(".peer-progress");
            const bar = card.querySelector(".peer-progress-bar");
            if (progress > 0 && progress < 1) {
                wrap.classList.add("active");
                bar.style.width = `${Math.round(progress * 100)}%`;
            } else {
                wrap.classList.remove("active");
                bar.style.width = "0%";
            }
        });

        Events.on("transfer-completed", () => {
            this.showToast(Localization.get("transfer.completed"));
        });

        Events.on("transfer-declined", () => {
            this.showToast(Localization.get("transfer.declined"));
        });

        Events.on("files-received", async (e) => {
            const { files } = e.detail;
            this.showToast(Localization.get("transfer.completed"));
            if (files.length === 1) {
                triggerDownload(files[0].blob, files[0].name);
            } else if (files.length > 1 && window.JSZip) {
                const zip = new window.JSZip();
                for (const f of files) {
                    zip.file(f.name, f.blob);
                }
                const zipBlob = await zip.generateAsync({ type: "blob" });
                triggerDownload(zipBlob, `AirPlop_Files_${Date.now()}.zip`);
            }
        });

        Events.on("pair-initiated", (e) => {
            const { pairKey } = e.detail;
            document.getElementById("pair-code-section").style.display = "block";
            document.getElementById("pair-code-value").textContent = pairKey;
            renderQr("pair-qr", `${location.origin}/?pair_key=${pairKey}`);
        });

        Events.on("pair-joined", async () => {
            document.getElementById("pair-code-section").style.display = "none";
            document.getElementById("pair-join-input").value = "";
            await this._renderPairedDevicesList();
            this.showToast(Localization.get("toast.pairSuccess"));
        });

        Events.on("pair-invalid", () => this.showToast(Localization.get("toast.pairInvalid")));
        Events.on("pair-rate-limit", () => this.showToast(Localization.get("toast.pairRateLimit")));

        Events.on("public-room-updated", (e) => {
            const roomId = e.detail;
            this._renderPublicRoomBanner(roomId);
            const activeBox = document.getElementById("public-room-active-box");
            if (roomId) {
                activeBox.style.display = "block";
                document.getElementById("public-room-code-value").textContent = roomId;
                renderQr("public-room-qr", `${location.origin}/?room=${roomId}`);
                this.showToast(`${Localization.get("toast.roomCreated")} ${roomId}`);
            } else {
                activeBox.style.display = "none";
                this.showToast(Localization.get("toast.roomLeft"));
            }
        });

        Events.on("public-room-invalid", () => this.showToast(Localization.get("toast.roomInvalid")));
    }

    _renderPublicRoomBanner(roomId) {
        const banner = document.getElementById("active-room-banner");
        if (roomId) {
            banner.style.display = "block";
            banner.textContent = `${Localization.get("modal.publicRoomActive")} ${roomId}`;
        } else {
            banner.style.display = "none";
        }
    }

    _renderPeers(peerEntries) {
        const grid = document.getElementById("peers-grid");
        const empty = document.getElementById("empty-state");
        grid.innerHTML = "";

        if (!peerEntries || peerEntries.length === 0) {
            empty.style.display = "flex";
            return;
        }
        empty.style.display = "none";

        for (const entry of peerEntries) {
            const { info, rooms } = entry;
            const card = document.createElement("div");
            card.className = "peer-card glass";
            card.setAttribute("data-peer-id", info.id);

            const avatar = document.createElement("div");
            avatar.className = "peer-avatar";
            avatar.textContent = info.name.type === "mobile" ? "📱" : info.name.type === "tablet" ? "📲" : "💻";

            const nameEl = document.createElement("div");
            nameEl.className = "peer-name";
            nameEl.textContent = info.name.displayName;

            const devEl = document.createElement("div");
            devEl.className = "peer-device";
            devEl.textContent = info.name.deviceName;

            const badges = document.createElement("div");
            badges.className = "peer-badges";
            for (const r of rooms) {
                const b = document.createElement("span");
                b.className = "badge";
                const key = r.roomType === "secret" ? "discovery.roomSecret" : r.roomType === "public" ? "discovery.roomPublic" : "discovery.roomIp";
                b.textContent = Localization.get(key);
                badges.appendChild(b);
            }

            const actions = document.createElement("div");
            actions.className = "peer-actions-row";
            const btnFile = document.createElement("button");
            btnFile.className = "peer-mini-btn";
            btnFile.textContent = Localization.get("peer.sendFiles");
            btnFile.onclick = (ev) => {
                ev.stopPropagation();
                this._triggerSendFiles(info.id);
            };
            const btnText = document.createElement("button");
            btnText.className = "peer-mini-btn";
            btnText.textContent = Localization.get("peer.sendText");
            btnText.onclick = (ev) => {
                ev.stopPropagation();
                this.selectedPeerId = info.id;
                this._openModal("modal-send-text");
                document.getElementById("send-text-input").focus();
            };
            actions.append(btnFile, btnText);

            const progress = document.createElement("div");
            progress.className = "peer-progress";
            const bar = document.createElement("div");
            bar.className = "peer-progress-bar";
            progress.appendChild(bar);

            card.onclick = () => this._triggerSendFiles(info.id);
            card.oncontextmenu = (ev) => {
                ev.preventDefault();
                this.selectedPeerId = info.id;
                this._openModal("modal-send-text");
            };

            card.append(avatar, nameEl, devEl, badges, actions, progress);
            grid.appendChild(card);
        }
    }

    _triggerSendFiles(peerId) {
        this.selectedPeerId = peerId;
        if (this.pendingDroppedFiles && this.pendingDroppedFiles.length > 0) {
            const files = this.pendingDroppedFiles;
            this.pendingDroppedFiles = null;
            this.client.sendFiles(peerId, files);
        } else {
            document.getElementById("file-input").click();
        }
    }

    async _renderPairedDevicesList() {
        const listEl = document.getElementById("paired-devices-list");
        const devices = await PersistentStorage.getAllPairedDevices().catch(() => []);
        listEl.innerHTML = "";
        if (devices.length === 0) {
            const empty = document.createElement("div");
            empty.style.fontSize = "0.82rem";
            empty.style.color = "var(--text-secondary)";
            empty.textContent = Localization.get("modal.pairedEmpty");
            listEl.appendChild(empty);
            return;
        }
        for (const d of devices) {
            const row = document.createElement("div");
            row.className = "paired-item";
            const label = document.createElement("span");
            label.textContent = `${d.displayName} (${d.deviceName || "Device"})`;
            const unpairBtn = document.createElement("button");
            unpairBtn.className = "btn btn-danger";
            unpairBtn.style.padding = "4px 10px";
            unpairBtn.style.fontSize = "0.75rem";
            unpairBtn.textContent = Localization.get("modal.unpair");
            unpairBtn.onclick = async () => {
                await PersistentStorage.deletePairedDevice(d.secret);
                this.client.send({ type: "room-secrets-deleted", roomSecrets: [d.secret] });
                await this._renderPairedDevicesList();
            };
            row.append(label, unpairBtn);
            listEl.appendChild(row);
        }
    }

    _openModal(id) {
        this._closeAllModals();
        document.getElementById(id)?.classList.add("open");
    }

    _closeAllModals() {
        document.querySelectorAll(".modal-backdrop.open").forEach((m) => m.classList.remove("open"));
    }

    showToast(message) {
        const container = document.getElementById("toast-container");
        const toast = document.createElement("div");
        toast.className = "toast glass-strong";
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3200);
    }
}

function renderQr(containerId, text) {
    const el = document.getElementById(containerId);
    if (!el || typeof window.qrcode !== "function") return;
    const qr = window.qrcode(0, "M");
    qr.addData(text);
    qr.make();
    el.innerHTML = qr.createSvgTag(4, 2);
}

function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
