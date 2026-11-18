import crypto from "crypto";

export const cyrb53 = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed;
    let h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

export const hasher = {
    hashCodeSalted(str) {
        const salt = crypto.randomBytes(16).toString("hex");
        return crypto.createHash("sha256").update(str + salt).digest("hex");
    }
};

export const randomizer = {
    getRandomString(length, onlyLetters = false) {
        const chars = onlyLetters
            ? "ABCDEFGHJKLMNPQRSTUVWXYZ"
            : "0123456789";
        let result = "";
        const bytes = crypto.randomBytes(length);
        for (let i = 0; i < length; i++) {
            result += chars[bytes[i] % chars.length];
        }
        return result;
    }
};
