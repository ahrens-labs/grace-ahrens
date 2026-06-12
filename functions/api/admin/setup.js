import { hashPassword, json } from "../../_lib/admin-auth.js";
import {
  hasKv,
  normalizeAdminEmail,
  hasUserPassword,
  getPendingSetup,
  savePendingSetup,
} from "../../_lib/admin-store.js";
import { hasEmailBinding, sendAdminConfirmationEmail } from "../../_lib/email.js";

function createToken() {
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
    return json({
      error: "Email is not configured yet. Onboard graceahrens.com for Email Sending in Cloudflare, then redeploy.",
    }, 503);
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

  if (await getPendingSetup(env, email)) {
    return json({
      success: true,
      pending: true,
      email,
      message: `A confirmation email was already sent to ${email}.`,
    });
  }

  if (!password) {
    return json({ error: "Please enter a password." }, 400);
  }

  if (password !== confirmPassword) {
    return json({ error: "Passwords do not match." }, 400);
  }

  const token = createToken();
  const passwordHash = await hashPassword(password, env.SESSION_SECRET);
  const exp = Date.now() + 60 * 60 * 1000;

  await savePendingSetup(env, email, { token, passwordHash, exp });

  const origin = new URL(request.url).origin;
  const confirmUrl =
    `${origin}/api/admin/confirm-setup?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  const emailResult = await sendAdminConfirmationEmail(env, confirmUrl, email);

  if (!emailResult.ok) {
    const detail =
      emailResult.reason === "missing_email_config"
        ? "Email credentials are not set on this site."
        : emailResult.reason === "E_SENDER_NOT_VERIFIED" || emailResult.reason === "E_SENDER_DOMAIN_NOT_AVAILABLE"
          ? "graceahrens.com is not onboarded for Email Sending yet."
          : emailResult.reason === "missing_email_binding"
            ? "The email worker is not deployed."
            : null;

    return json({
      error: detail
        ? `Could not send confirmation email. ${detail}`
        : "Could not send confirmation email. Check that Cloudflare Email Sending is set up for graceahrens.com.",
    }, 500);
  }

  return json({
    success: true,
    pending: true,
    email,
    message: `Confirmation email sent to ${email}. Click the link there to finish setup.`,
  });
}
