const SESSION_COOKIE = "admin_session";
const SESSION_DAYS = 7;

function encoder() {
  return new TextEncoder();
}

function toBase64Url(buffer) {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + "=".repeat(padLength));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function hashPassword(password, secret) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder().encode(`${secret}:${password}`)
  );
  return toBase64Url(digest);
}

export async function verifyPasswordPlain(input, expected) {
  if (!input || !expected) return false;

  const [inputHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder().encode(input)),
    crypto.subtle.digest("SHA-256", encoder().encode(expected)),
  ]);

  return crypto.subtle.timingSafeEqual(inputHash, expectedHash);
}

export async function createSessionToken(secret) {
  const payload = {
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
    role: "admin",
  };

  const payloadPart = toBase64Url(encoder().encode(JSON.stringify(payload)));
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder().encode(payloadPart));
  return `${payloadPart}.${toBase64Url(signature)}`;
}

export async function verifySessionToken(token, secret) {
  if (!token || !secret) return false;

  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) return false;

  try {
    const key = await importHmacKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(signaturePart),
      encoder().encode(payloadPart)
    );
    if (!valid) return false;

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadPart)));
    if (!payload?.exp || Date.now() > payload.exp) return false;
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export function getSessionToken(request) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(new RegExp(`(?:^|; )${SESSION_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export async function isAdmin(request, env) {
  if (!env.SESSION_SECRET) return false;
  const token = getSessionToken(request);
  return verifySessionToken(token, env.SESSION_SECRET);
}

export function sessionCookie(token, maxAgeSeconds = SESSION_DAYS * 24 * 60 * 60) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}
