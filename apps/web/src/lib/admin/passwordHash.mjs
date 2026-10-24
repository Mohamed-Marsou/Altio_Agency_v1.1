// Password fingerprint (scrypt). A plain .mjs file so that BOTH the dev server (TypeScript)
// and the command `npm run admin:password` (plain Node) use exactly the same code.
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 32;
export const MIN_PASSWORD_LENGTH = 12;

/**
 * "scrypt:<salt>:<key>": a salted one-way fingerprint of a password.
 * @param {string} password
 * @returns {string}
 */
export function hashPassword(password) {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, KEY_LENGTH);
  // ":" and not "$": in a .env file a "$" starts a variable and would damage the value.
  return `scrypt:${salt.toString("base64")}:${key.toString("base64")}`;
}

/**
 * True when the password matches the stored fingerprint (takes the same time either way).
 * @param {string} password
 * @param {string} stored
 * @returns {boolean}
 */
export function verifyPassword(password, stored) {
  const [scheme, saltText, keyText] = stored.split(":");
  if (scheme !== "scrypt" || !saltText || !keyText) return false;
  const expected = Buffer.from(keyText, "base64");
  if (expected.length !== KEY_LENGTH) return false;
  const actual = scryptSync(password, Buffer.from(saltText, "base64"), KEY_LENGTH);
  return timingSafeEqual(actual, expected);
}
