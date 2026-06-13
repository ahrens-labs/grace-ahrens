import { hashPassword, json } from "../../_lib/admin-auth.js";
import {
  hasKv,
  normalizeAdminEmail,
  hasUserPassword,
  activatePassword,
} from "../../_lib/admin-store.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.SESSION_SECRET) {
    return json({ error: "Admin setup is not configured yet." }, 503);
  }

  if (!hasKv(env)) {
    return json({ error: "Admin storage is not configured yet." }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const email = normalizeAdminEmail(body.email);
  const password = String(body.password || "");
  const confirmPassword = String(body.confirmPassword || "");

  if (!email) {
    return json({ error: "Please choose a valid admin account." }, 400);
  }

  if (await hasUserPassword(env, email)) {
    return json({ error: "This account already has a password. Sign in instead." }, 400);
  }

  if (!password) {
    return json({ error: "Please enter a password." }, 400);
  }

  if (password !== confirmPassword) {
    return json({ error: "Passwords do not match." }, 400);
  }

  const passwordHash = await hashPassword(password, env.SESSION_SECRET);
  await activatePassword(env, email, passwordHash);

  return json({
    success: true,
    email,
    message: `Password saved for ${email}. You can sign in now.`,
  });
}
