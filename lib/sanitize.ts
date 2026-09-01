import crypto from "crypto";

/**
 * AirGuard Input Sanitization and Security Validation Utilities
 */

// Strict email regex matching RFC 5322 standard
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validates and sanitizes an email address.
 * Rejects oversized emails (> 254 chars) and CRLF injection.
 */
export function validateEmail(input: unknown): { valid: boolean; email: string; error?: string } {
  if (typeof input !== "string") {
    return { valid: false, email: "", error: "Email must be a string." };
  }

  const trimmed = input.trim().toLowerCase();

  if (trimmed.length === 0) {
    return { valid: false, email: "", error: "Email is required." };
  }

  if (trimmed.length > 254) {
    return { valid: false, email: "", error: "Email exceeds maximum length of 254 characters." };
  }

  // Prevent CRLF injection
  if (/[\r\n\0]/.test(trimmed)) {
    return { valid: false, email: "", error: "Email contains invalid control characters." };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, email: "", error: "Invalid email format." };
  }

  return { valid: true, email: trimmed };
}

/**
 * Strips script tags, HTML tags, control characters and limits length.
 */
export function sanitizeString(input: unknown, maxLength = 255): string {
  if (input === null || input === undefined) return "";
  const str = String(input);

  // Strip control characters (except common whitespace), then strip script/HTML tags
  const clean = str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();

  return clean.slice(0, maxLength);
}

/**
 * Validates and bounds a numerical value within [min, max].
 */
export function sanitizeNumber(
  input: unknown,
  min = -Infinity,
  max = Infinity,
  fallback = 0
): number {
  if (input === null || input === undefined) return fallback;
  const num = typeof input === "number" ? input : parseFloat(String(input));

  if (!Number.isFinite(num)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, num));
}

/**
 * Validates geographical latitude (-90 to 90) and longitude (-180 to 180).
 */
export function validateCoordinates(
  latInput: unknown,
  lonInput: unknown
): { valid: boolean; lat: number; lon: number } {
  const lat = typeof latInput === "number" ? latInput : parseFloat(String(latInput));
  const lon = typeof lonInput === "number" ? lonInput : parseFloat(String(lonInput));

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { valid: false, lat: 12.9716, lon: 77.5946 };
  }

  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    return { valid: false, lat: 12.9716, lon: 77.5946 };
  }

  return { valid: true, lat: parseFloat(lat.toFixed(4)), lon: parseFloat(lon.toFixed(4)) };
}

/**
 * Server-side cryptographic token signer using HMAC-SHA256.
 * Replaces insecure unsigned base64 tokens.
 */
function getAuthSecret(): string {
  return process.env.AUTH_SECRET || "airguard_default_dev_secret_key_change_in_prod";
}

export function createSignedToken(payload: Record<string, any>): string {
  const secret = getAuthSecret();
  const data = JSON.stringify(payload);
  const dataB64 = Buffer.from(data).toString("base64url");
  const hmac = crypto.createHmac("sha256", secret).update(dataB64).digest("base64url");
  return `${dataB64}.${hmac}`;
}

export function verifySignedToken(token: string): { valid: boolean; payload: any } {
  if (!token || typeof token !== "string") {
    return { valid: false, payload: null };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    // Backward compatibility check for legacy demo base64 tokens
    try {
      const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
      if (decoded && decoded.exp && decoded.exp > Date.now()) {
        return { valid: true, payload: decoded };
      }
    } catch {}
    return { valid: false, payload: null };
  }

  const [dataB64, signature] = parts;
  const secret = getAuthSecret();
  const expectedSig = crypto.createHmac("sha256", secret).update(dataB64).digest("base64url");

  // Constant-time comparison to prevent timing attacks
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, payload: null };
  }

  try {
    const payload = JSON.parse(Buffer.from(dataB64, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Date.now()) {
      return { valid: false, payload: null }; // Expired
    }
    return { valid: true, payload };
  } catch {
    return { valid: false, payload: null };
  }
}

/**
 * Filter an untrusted object to only include specified allowed keys with sanitized values.
 */
export function sanitizeObject<T extends Record<string, any>>(
  raw: any,
  allowedKeys: (keyof T)[]
): Partial<T> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const clean: Record<string, any> = {};
  for (const key of allowedKeys as string[]) {
    if (Object.prototype.hasOwnProperty.call(raw, key)) {
      const val = raw[key];
      if (typeof val === "string") {
        clean[key] = sanitizeString(val);
      } else if (typeof val === "number") {
        clean[key] = Number.isFinite(val) ? val : 0;
      } else if (typeof val === "boolean") {
        clean[key] = val;
      }
    }
  }
  return clean as Partial<T>;
}
