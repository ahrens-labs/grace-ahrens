import { buildNewsletterEmail, personalizeNewsletterText } from "./newsletter-template.js";
import { buildUnsubscribeUrl } from "./subscribers.js";

export function formatEmailSendError(reason, message) {
  switch (reason) {
    case "E_SENDER_NOT_VERIFIED":
    case "E_SENDER_DOMAIN_NOT_AVAILABLE":
      return "The sender address is not verified for Cloudflare Email Sending yet. Redeploy the email worker or onboard the domain in Cloudflare.";
    case "E_RECIPIENT_NOT_ALLOWED":
      return "Cloudflare blocked this recipient. Email must route through chess-accounts — set GRACE_EMAIL_SECRET and redeploy (see workers/email/README.md).";
    case "E_TOO_MANY_RECIPIENTS":
      return "Too many recipients in one send. Try again — this should not happen with a normal list size.";
    case "missing_email_binding":
    case "missing_email_config":
    case "unauthorized":
    case "not_configured":
      return message || "Email is not configured. Set GRACE_EMAIL_SECRET on chess-accounts and grace-ahrens Pages (same value).";
    case "send_failed":
      return message || "Email sending failed for an unknown reason.";
    default:
      return message || reason || "Email sending failed.";
  }
}

function getFromAddress(env) {
  const override = env.NEWSLETTER_FROM_EMAIL || env.SENDER_EMAIL;
  if (override) {
    const match = String(override).match(/^(.+?)\s*<([^>]+)>$/);
    if (match) {
      return { name: match[1].trim(), email: match[2].trim() };
    }
    return { email: String(override).trim(), name: "Grace Ahrens" };
  }

  return { email: "caleb@ahrenslabs.com", name: "Grace Ahrens" };
}

function getReplyTo(env) {
  return env.REPLY_TO_EMAIL || "grace@graceahrens.com";
}

function getApiToken(env) {
  return env.CLOUDFLARE_EMAIL_API_TOKEN || env.CLOUDFLARE_API_TOKEN || "";
}

export function hasEmailBinding(env) {
  if (env.EMAIL_WORKER) {
    return Boolean(env.GRACE_EMAIL_SECRET);
  }

  return (
    Boolean(env.EMAIL) ||
    Boolean(env.EMAIL_TRANSACTIONAL) ||
    Boolean(getApiToken(env) && env.CLOUDFLARE_ACCOUNT_ID)
  );
}

async function sendViaBinding(env, payload) {
  const binding = env.EMAIL_TRANSACTIONAL || env.EMAIL;
  const result = await binding.send(payload);
  return { ok: true, messageId: result.messageId };
}

async function sendViaWorker(env, payload) {
  const secret = env.GRACE_EMAIL_SECRET;
  if (!secret) {
    return {
      ok: false,
      reason: "missing_email_config",
      message: "GRACE_EMAIL_SECRET is not set on the grace-ahrens Pages project.",
    };
  }

  let response;
  try {
    response = await env.EMAIL_WORKER.fetch(
      new Request("https://chess-accounts/internal/grace-ahrens/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Grace-Email-Secret": secret,
        },
        body: JSON.stringify(payload),
      })
    );
  } catch (error) {
    return {
      ok: false,
      reason: "send_failed",
      message: error.message,
    };
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    return {
      ok: false,
      reason: data.reason || "send_failed",
      message: data.message,
    };
  }

  return { ok: true, messageId: data.messageId };
}

async function sendViaRestApi(env, payload) {
  const token = getApiToken(env);
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;

  if (!token || !accountId) {
    return { ok: false, reason: "missing_email_config" };
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    const message = data.errors?.[0]?.message || "send_failed";
    return { ok: false, reason: message };
  }

  return { ok: true };
}

export async function sendEmail(env, { to, subject, html, text, bcc }) {
  const payload = {
    from: getFromAddress(env),
    replyTo: getReplyTo(env),
    subject,
  };

  if (to) payload.to = to;
  if (bcc) payload.bcc = bcc;
  if (html) payload.html = html;
  if (text) payload.text = text;

  if (env.EMAIL || env.EMAIL_TRANSACTIONAL) {
    try {
      return await sendViaBinding(env, payload);
    } catch (error) {
      return {
        ok: false,
        reason: error.code || "send_failed",
        message: error.message,
      };
    }
  }

  if (env.EMAIL_WORKER) {
    return sendViaWorker(env, payload);
  }

  return sendViaRestApi(env, payload);
}

export async function sendAdminConfirmationEmail(env, confirmUrl, toEmail) {
  return sendEmail(env, {
    to: toEmail,
    subject: "Confirm your Grace Ahrens admin password",
    html: `
      <p>Someone requested to set the admin password for <strong>graceahrens.com</strong> using <strong>${toEmail}</strong>.</p>
      <p>If this was you, confirm your new admin password by clicking the link below. This link expires in one hour.</p>
      <p><a href="${confirmUrl}">Confirm admin password</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
    text: [
      `Someone requested to set the admin password for graceahrens.com using ${toEmail}.`,
      "If this was you, confirm your new admin password by visiting:",
      confirmUrl,
      "This link expires in one hour.",
      "If you did not request this, you can ignore this email.",
    ].join("\n\n"),
  });
}

export function bodyToHtml(body) {
  return body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>\n");
}

export async function sendNewsletterToList(env, subject, body, recipients, origin) {
  if (!recipients.length) {
    return { ok: false, reason: "no_recipients" };
  }

  let sent = 0;

  for (const subscriber of recipients) {
    const unsubscribeUrl = await buildUnsubscribeUrl(env, origin, subscriber.email);
    const { html, text } = buildNewsletterEmail(body, {
      unsubscribeUrl,
      name: subscriber.name,
    });

    const result = await sendEmail(env, {
      to: subscriber.email,
      subject: personalizeNewsletterText(subject, subscriber.name),
      html,
      text,
    });

    if (!result.ok) {
      return { ok: false, reason: result.reason, message: result.message, sent };
    }

    sent += 1;
  }

  return { ok: true, sent };
}
