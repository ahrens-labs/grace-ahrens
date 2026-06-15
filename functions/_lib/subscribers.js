const SUB_PREFIX = "sub:";
const TOKEN_PREFIX = "subtoken:";
const DRAFT_KEY = "newsletter:draft";
const TOKEN_TTL = 7 * 24 * 60 * 60;
const HOUR_MS = 60 * 60 * 1000;

function subKey(email) {
  return `${SUB_PREFIX}${email}`;
}

function tokenKey(token) {
  return `${TOKEN_PREFIX}${token}`;
}

function createToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function hasSubscriberStorage(env) {
  return Boolean(env.ADMIN_KV);
}

export async function getSubscriber(env, email) {
  const raw = await env.ADMIN_KV.get(subKey(email));
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function registerSubscriber(env, email, name) {
  const existing = await getSubscriber(env, email);
  if (existing?.status === "confirmed") {
    return { ok: true, alreadySubscribed: true };
  }

  const token = createToken();
  const record = {
    email,
    name,
    status: "pending",
    createdAt: existing?.createdAt || Date.now(),
  };

  await env.ADMIN_KV.put(subKey(email), JSON.stringify(record));
  await env.ADMIN_KV.put(tokenKey(token), email, { expirationTtl: TOKEN_TTL });

  return { ok: true, token, pending: true };
}

export async function confirmSubscriber(env, token) {
  const email = await env.ADMIN_KV.get(tokenKey(token));
  if (!email) return { ok: false, reason: "invalid_token" };

  const record = await getSubscriber(env, email);
  if (!record) return { ok: false, reason: "invalid_token" };

  if (record.status === "confirmed") {
    await env.ADMIN_KV.delete(tokenKey(token));
    return { ok: true, alreadyConfirmed: true, email, name: record.name };
  }

  record.status = "confirmed";
  record.confirmedAt = Date.now();
  record.drip = {
    email2DueAt: record.confirmedAt + 24 * HOUR_MS,
    email3DueAt: record.confirmedAt + 72 * HOUR_MS,
    email2Sent: false,
    email3Sent: false,
  };

  await env.ADMIN_KV.put(subKey(email), JSON.stringify(record));
  await env.ADMIN_KV.delete(tokenKey(token));

  return { ok: true, email, name: record.name };
}

export async function listConfirmedSubscribers(env) {
  const subscribers = [];
  let cursor;

  do {
    const page = await env.ADMIN_KV.list({ prefix: SUB_PREFIX, cursor });
    for (const key of page.keys) {
      const raw = await env.ADMIN_KV.get(key.name);
      if (!raw) continue;

      try {
        const record = JSON.parse(raw);
        if (record.status === "confirmed") subscribers.push(record);
      } catch {
        // Skip malformed records.
      }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  return subscribers;
}

export async function listAllSubscribers(env) {
  const subscribers = [];
  let cursor;

  do {
    const page = await env.ADMIN_KV.list({ prefix: SUB_PREFIX, cursor });
    for (const key of page.keys) {
      const raw = await env.ADMIN_KV.get(key.name);
      if (!raw) continue;

      try {
        const record = JSON.parse(raw);
        if (record.email) subscribers.push(record);
      } catch {
        // Skip malformed records.
      }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  subscribers.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "confirmed" ? -1 : 1;
    }
    const nameA = String(a.name || "").toLowerCase();
    const nameB = String(b.name || "").toLowerCase();
    if (nameA !== nameB) return nameA.localeCompare(nameB);
    return String(a.email).localeCompare(String(b.email));
  });

  return subscribers;
}

export async function getConfirmedSubscriberCount(env) {
  const subscribers = await listConfirmedSubscribers(env);
  return subscribers.length;
}

export async function saveDraft(env, draft) {
  await env.ADMIN_KV.put(DRAFT_KEY, JSON.stringify(draft));
}

export async function clearDraft(env) {
  await env.ADMIN_KV.delete(DRAFT_KEY);
}

export async function getDraft(env) {
  const raw = await env.ADMIN_KV.get(DRAFT_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function listAllSubscriberRecords(env) {
  const subscribers = [];
  let cursor;

  do {
    const page = await env.ADMIN_KV.list({ prefix: SUB_PREFIX, cursor });
    for (const key of page.keys) {
      const raw = await env.ADMIN_KV.get(key.name);
      if (!raw) continue;

      try {
        subscribers.push(JSON.parse(raw));
      } catch {
        // Skip malformed records.
      }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  return subscribers;
}

export async function saveSubscriber(env, record) {
  if (!record?.email) return;
  await env.ADMIN_KV.put(subKey(record.email), JSON.stringify(record));
}
