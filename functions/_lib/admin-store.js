import { hashPassword } from "./admin-auth.js";

export const ALLOWED_ADMIN_EMAILS = [
  "grace@graceahrens.com",
  "caleb@ahrenslabs.com",
];

const LEGACY_PASSWORD_KEY = "admin:password_hash";
const LEGACY_PENDING_KEY = "admin:setup_pending";
const PENDING_TTL = 60 * 60;

function userKey(email) {
  return `admin:user:${email}`;
}

function pendingKey(email) {
  return `admin:pending:${email}`;
}

export function hasKv(env) {
  return Boolean(env.ADMIN_KV);
}

export function normalizeAdminEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  return ALLOWED_ADMIN_EMAILS.includes(normalized) ? normalized : "";
}

export async function hasUserPassword(env, email) {
  if (!hasKv(env)) return false;

  const stored = await env.ADMIN_KV.get(userKey(email));
  if (stored) return true;

  if (email === "grace@graceahrens.com") {
    const legacy = await env.ADMIN_KV.get(LEGACY_PASSWORD_KEY);
    if (legacy) return true;
  }

  return false;
}

export async function getPendingSetup(env, email) {
  if (!hasKv(env)) return null;
  const raw = await env.ADMIN_KV.get(pendingKey(email));
  if (!raw) {
    if (email === "grace@graceahrens.com") {
      const legacyRaw = await env.ADMIN_KV.get(LEGACY_PENDING_KEY);
      if (legacyRaw) {
        try {
          return JSON.parse(legacyRaw);
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function savePendingSetup(env, email, pending) {
  await env.ADMIN_KV.put(pendingKey(email), JSON.stringify({ ...pending, email }), {
    expirationTtl: PENDING_TTL,
  });
}

export async function activatePassword(env, email, passwordHash) {
  await env.ADMIN_KV.put(userKey(email), passwordHash);
  await env.ADMIN_KV.delete(pendingKey(email));

  if (email === "grace@graceahrens.com") {
    await env.ADMIN_KV.delete(LEGACY_PENDING_KEY);
    await env.ADMIN_KV.delete(LEGACY_PASSWORD_KEY);
  }
}

export async function verifyStoredPassword(env, email, password) {
  if (!password || !env.SESSION_SECRET) return false;

  const hash = await hashPassword(password, env.SESSION_SECRET);

  if (hasKv(env)) {
    const stored = await env.ADMIN_KV.get(userKey(email));
    if (stored && stored === hash) return true;

    if (email === "grace@graceahrens.com") {
      const legacy = await env.ADMIN_KV.get(LEGACY_PASSWORD_KEY);
      if (legacy && legacy === hash) return true;
    }
  }

  return false;
}

export async function getAccountStates(env) {
  const accounts = {};

  for (const email of ALLOWED_ADMIN_EMAILS) {
    accounts[email] = {
      hasPassword: await hasUserPassword(env, email),
      setupPending: Boolean(await getPendingSetup(env, email)),
    };
  }

  return accounts;
}
