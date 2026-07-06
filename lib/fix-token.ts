import { randomBytes } from "crypto";

/** Generates a URL-safe random token (32 bytes -> 43 base64url chars, no padding). */
export function generateFixToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Magic-link tokens are valid for 30 days after approval. */
export function computeFixTokenExpiry(from: Date = new Date()): Date {
  const expiry = new Date(from);
  expiry.setDate(expiry.getDate() + 30);
  return expiry;
}
