import {
  createSessionToken,
  sessionCookie,
  json,
} from "../../_lib/admin-auth.js";
import {
  normalizeAdminEmail,
  hasUserPassword,
  verifyStoredPassword,
} from "../../_lib/admin-store.js";

export async function onRequestPost({ request, env }) {
  if (!env.SESSION_SECRET) {
    return json({ error: "Admin login is not configured yet." }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const email = normalizeAdminEmail(body.email);
  const password = String(body.password || "");

  if (!email) {
    return json({ error: "Please choose a valid admin account." }, 400);
  }

  if (!(await hasUserPassword(env, email))) {
    return json({ error: "This account does not have a password yet. Create one first." }, 400);
  }

  const valid = await verifyStoredPassword(env, email, password);
  if (!valid) {
    return json({ error: "Incorrect password." }, 401);
  }

  const token = await createSessionToken(env.SESSION_SECRET, email);
  return json(
    { success: true, email },
    200,
    { "Set-Cookie": sessionCookie(token) }
  );
}
