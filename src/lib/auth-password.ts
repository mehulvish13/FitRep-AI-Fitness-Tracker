import crypto from "crypto";

const ALGO = "sha256";
const IV_BYTES = 16;

export function hashPassword(password: string, salt?: string) {
    const usedSalt = salt ?? crypto.randomBytes(16).toString("hex");
    const iv = crypto.randomBytes(IV_BYTES).toString("hex");

    // Simple deterministic hash with random salt/iv. (Keeps us dependency-free.)
    const hash = crypto
        .createHash(ALGO)
        .update(`${usedSalt}:${iv}:${password}`)
        .digest("hex");

    return {
        passwordSalt: usedSalt,
        passwordHash: hash,
        passwordIv: iv,
    };
}

export function verifyPassword(password: string, data: { passwordSalt: string; passwordIv: string; passwordHash: string }) {
    const { passwordSalt, passwordIv, passwordHash } = data;
    const hash = crypto
        .createHash(ALGO)
        .update(`${passwordSalt}:${passwordIv}:${password}`)
        .digest("hex");

    return hash === passwordHash;
}
