import {
  createSessionToken,
  sessionCookie,
  json,
} from "../../_lib/admin-auth.js";
import { hasAdminPassword, verifyStoredPassword } from "../../_lib/admin-store.js";

export async function onRequestPost({ request, env }) {
  if (!env.SESSION_SECRET) {
    return json({ error: "Admin login is not configured yet." }, 503);
  }

  if (!(await hasAdminPassword(env))) {
    return json({ error: "Admin password has not been set up yet." }, 400);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const password = String(body.password || "");
  const valid = await verifyStoredPassword(env, password);
  if (!valid) {
    return json({ error: "Incorrect password." }, 401);
  }

  const token = await createSessionToken(env.SESSION_SECRET);
  return json(
    { success: true },
    200,
    { "Set-Cookie": sessionCookie(token) }
  );
}
