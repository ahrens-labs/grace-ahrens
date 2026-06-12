import {
  verifyPassword,
  createSessionToken,
  sessionCookie,
  json,
} from "../../_lib/admin-auth.js";

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return json({ error: "Admin login is not configured yet." }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const password = String(body.password || "");
  const valid = await verifyPassword(password, env.ADMIN_PASSWORD);
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
