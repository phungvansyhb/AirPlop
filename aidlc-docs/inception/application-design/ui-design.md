# UI/UX Design Specification (`ui-design.md`)

- **Phase**: `INCEPTION`
- **Stage**: `Stage 1.4 — Application & UI Design`
- **Design System**: `AirPlop Glassmorphism (Auto / Light / Dark)`
- **Status**: `Implemented & Verified`

---

## 1. Clarified UI Design Decisions

| Dimension | Selection | Specification Summary |
| :--- | :--- | :--- |
| **Target UI Surfaces** | Single-stage Radar + Modals + Toasts | Top glass header, center radar peer grid, footer device identity bar, drag-drop overlay, and 6 glass modals |
| **Visual Aesthetic** | Glassmorphism (`backdrop-filter: blur(20px–26px)`) | Translucent frosted surfaces, subtle specular borders, animated 3-orb gradient mesh background |
| **Theme Modes** | `Auto` (OS), `Light`, `Dark` | Persisted in `localStorage` (`airplop_theme`), toggled cleanly via `data-theme` attribute |
| **Typography & Motion** | System sans stack + smooth radar pulse | Respects `@media (prefers-reduced-motion: reduce)` |
| **Localization (`i18n`)** | Bilingual `EN` / `VI` | `[data-i18n]` DOM bindings + `en.json` / `vi.json` parity |

---

## 2. Design Tokens (Light & Dark Mode)

```css
:root {
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --accent: #6366f1;
  --accent-2: #06b6d4;
  --bg-base: #eef2ff;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --glass-bg: rgba(255, 255, 255, 0.55);
  --glass-bg-strong: rgba(255, 255, 255, 0.78);
  --glass-border: rgba(255, 255, 255, 0.65);
}

[data-theme="dark"] {
  --bg-base: #090d16;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --glass-bg: rgba(17, 25, 40, 0.56);
  --glass-bg-strong: rgba(17, 25, 40, 0.82);
  --glass-border: rgba(255, 255, 255, 0.14);
}
```

---

## 3. Surface-by-Surface Component Specs
1. **Top Glass Header**: Brand badge, Pair Device button, Public Room button, `EN`/`VI` pill switcher, Theme cycle button (`🌗`/`☀️`/`🌙`), Info modal trigger.
2. **Radar Discovery Stage**: Pulsing concentric rings, responsive peer cards with device emoji avatar, room-type badges (`Same Network`, `Paired`, `Public Room`), quick actions (`Send Files`, `Send Text`), and live progress bar.
3. **Modals & Overlays**: Frosted-strong (`blur(26px)`) modals for Send Text, Receive Text, Incoming Files Accept/Decline, Device Pairing (6-digit code + QR + unpair list), Public Room (5-letter code + QR), Rename, and About.
