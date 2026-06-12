import { hashPassword, json } from "../../_lib/admin-auth.js";
import {
  hasAdminPassword,
  hasKv,
  getPendingSetup,
  savePendingSetup,
} from "../../_lib/admin-store.js";
import { sendAdminConfirmationEmail } from "../../_lib/email.js";

const MIN_PASSWORD_LENGTH = 12;

function createToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

function toBase64Url(buffer) {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
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

  if (await hasAdminPassword(env)) {
    return json({ error: "Admin password is already set." }, 400);
  }

  if (await getPendingSetup(env)) {
    return json({
      success: true,
      pending: true,
      message: "A confirmation email was already sent. Check grace@graceahrens.com.",
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const password = String(body.password || "");
  const confirmPassword = String(body.confirmPassword || "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    return json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }, 400);
  }

  if (password !== confirmPassword) {
    return json({ error: "Passwords do not match." }, 400);
  }

  const token = createToken();
  const passwordHash = await hashPassword(password, env.SESSION_SECRET);
  const exp = Date.now() + 60 * 60 * 1000;

  await savePendingSetup(env, { token, passwordHash, exp });

  const origin = new URL(request.url).origin;
  const confirmUrl = `${origin}/api/admin/confirm-setup?token=${encodeURIComponent(token)}`;
  const emailResult = await sendAdminConfirmationEmail(env, confirmUrl);

  if (!emailResult.ok) {
    return json({
      error: "Could not send confirmation email. Check that Resend is configured.",
    }, 500);
  }

  return json({
    success: true,
    pending: true,
    message: "Confirmation email sent to grace@graceahrens.com. Click the link there to finish setup.",
  });
}
