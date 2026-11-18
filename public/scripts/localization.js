class LocalizationManager {
    constructor() {
        this.supported = ["en", "vi"];
        this.lang = this._detectLanguage();
        this.dict = {};
    }

    _detectLanguage() {
        const saved = localStorage.getItem("airplop_lang");
        if (saved && this.supported.includes(saved)) return saved;
        const browserLang = (navigator.language || "en").slice(0, 2).toLowerCase();
        return this.supported.includes(browserLang) ? browserLang : "en";
    }

    async init() {
        await this.setLanguage(this.lang);
    }

    async setLanguage(lang) {
        if (!this.supported.includes(lang)) lang = "en";
        this.lang = lang;
        localStorage.setItem("airplop_lang", lang);
        document.documentElement.lang = lang;

        const res = await fetch(`/lang/${lang}.json`);
        this.dict = await res.json();
        this.applyToDOM();
        window.dispatchEvent(new CustomEvent("language-changed", { detail: { lang } }));
    }

    get(key) {
        return this.dict[key] || key;
    }

    applyToDOM() {
        document.querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.getAttribute("data-i18n");
            if (this.dict[key]) el.textContent = this.dict[key];
        });
        document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
            const key = el.getAttribute("data-i18n-placeholder");
            if (this.dict[key]) el.setAttribute("placeholder", this.dict[key]);
        });
        document.querySelectorAll("[data-i18n-title]").forEach((el) => {
            const key = el.getAttribute("data-i18n-title");
            if (this.dict[key]) el.setAttribute("title", this.dict[key]);
        });
    }
}

export const Localization = new LocalizationManager();
