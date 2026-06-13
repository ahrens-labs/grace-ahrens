import { hashPassword, json } from "../../_lib/admin-auth.js";
import {
  hasKv,
  normalizeAdminEmail,
  hasUserPassword,
  savePendingSetup,
  PENDING_TTL,
} from "../../_lib/admin-store.js";
import { hasEmailBinding, sendAdminConfirmationEmail } from "../../_lib/email.js";

function createSetupToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.SESSION_SECRET) {
    return json({ error: "Admin setup is not configured yet." }, 503);
  }

  if (!hasKv(env)) {
    return json({ error: "Admin storage is not configured yet." }, 503);
  }

  if (!hasEmailBinding(env)) {
    return json({ error: "Email sending is not configured yet." }, 503);
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
  const token = createSetupToken();
  const exp = Date.now() + PENDING_TTL * 1000;

  await savePendingSetup(env, email, { token, passwordHash, exp });

  const origin = new URL(request.url).origin;
  const confirmUrl =
    `${origin}/api/admin/confirm-setup?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  const emailResult = await sendAdminConfirmationEmail(env, confirmUrl, email);

  if (!emailResult.ok) {
    return json({ error: "Unable to send confirmation email right now. Please try again later." }, 500);
  }

  return json({
    success: true,
    pending: true,
    email,
    message: `Check ${email} for a confirmation link to activate your admin password.`,
  });
}
