import { hashPassword, verifyPasswordPlain } from "./admin-auth.js";

const PASSWORD_KEY = "admin:password_hash";
const PENDING_KEY = "admin:setup_pending";
const PENDING_TTL = 60 * 60;

export function hasKv(env) {
  return Boolean(env.ADMIN_KV);
}

export async function hasAdminPassword(env) {
  if (env.ADMIN_PASSWORD) return true;
  if (!hasKv(env)) return false;
  const stored = await env.ADMIN_KV.get(PASSWORD_KEY);
  return Boolean(stored);
}

export async function getPendingSetup(env) {
  if (!hasKv(env)) return null;
  const raw = await env.ADMIN_KV.get(PENDING_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function savePendingSetup(env, pending) {
  await env.ADMIN_KV.put(PENDING_KEY, JSON.stringify(pending), {
    expirationTtl: PENDING_TTL,
  });
}

export async function activatePassword(env, passwordHash) {
  await env.ADMIN_KV.put(PASSWORD_KEY, passwordHash);
  await env.ADMIN_KV.delete(PENDING_KEY);
}

export async function verifyStoredPassword(env, password) {
  if (!password || !env.SESSION_SECRET) return false;

  const hash = await hashPassword(password, env.SESSION_SECRET);

  if (hasKv(env)) {
    const stored = await env.ADMIN_KV.get(PASSWORD_KEY);
    if (stored && stored === hash) return true;
  }

  if (env.ADMIN_PASSWORD) {
    return verifyPasswordPlain(password, env.ADMIN_PASSWORD);
  }

  return false;
}

export async function getAdminState(env) {
  const setupPending = Boolean(await getPendingSetup(env));
  const needsSetup = !(await hasAdminPassword(env));

  return { needsSetup, setupPending };
}
