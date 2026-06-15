const BATCH_SIZE = 50;

export function formatEmailSendError(reason, message) {
  switch (reason) {
    case "E_SENDER_NOT_VERIFIED":
    case "E_SENDER_DOMAIN_NOT_AVAILABLE":
      return "graceahrens.com is not fully set up for Email Sending yet. Finish domain onboarding in Cloudflare.";
    case "E_RECIPIENT_NOT_ALLOWED":
      return "Email could not be sent. Add RESEND_API_KEY to the grace-ahrens-email worker (same key as chess-accounts) and verify graceahrens.com in Resend.";
    case "E_TOO_MANY_RECIPIENTS":
      return "Too many recipients in one send. Try again — this should not happen with a normal list size.";
    case "missing_email_binding":
    case "missing_email_config":
      return "Email sending is not configured on the server.";
    case "send_failed":
    case "resend_failed":
      return message || "Email sending failed for an unknown reason.";
    case "missing_resend_key":
      return "Email sending is not configured. Run: cd workers/email && npx wrangler secret put RESEND_API_KEY";
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

  return { email: "grace@graceahrens.com", name: "Grace Ahrens" };
}

function getFromEmailOnly(env) {
  return getFromAddress(env).email;
}

function getApiToken(env) {
  return env.CLOUDFLARE_EMAIL_API_TOKEN || env.CLOUDFLARE_API_TOKEN || "";
}

export function hasEmailBinding(env) {
  return (
    Boolean(env.EMAIL) ||
    Boolean(env.EMAIL_TRANSACTIONAL) ||
    Boolean(env.EMAIL_WORKER) ||
    Boolean(env.RESEND_API_KEY) ||
    Boolean(getApiToken(env) && env.CLOUDFLARE_ACCOUNT_ID)
  );
}

function formatFromForResend(from) {
  if (from && typeof from === "object" && from.email) {
    return from.name ? `${from.name} <${from.email}>` : from.email;
  }
  return String(from || "Grace Ahrens <grace@graceahrens.com>");
}

async function sendViaResend(env, payload) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "missing_resend_key" };
  }

  const body = {
    from: formatFromForResend(payload.from),
    subject: payload.subject,
  };

  if (payload.to) {
    body.to = Array.isArray(payload.to) ? payload.to : [payload.to];
  }

  if (payload.bcc) {
    body.bcc = Array.isArray(payload.bcc) ? payload.bcc : [payload.bcc];
  }

  if (payload.html) body.html = payload.html;
  if (payload.text) body.text = payload.text;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      ok: false,
      reason: "resend_failed",
      message: data.message || data.error || "Resend request failed.",
    };
  }

  return { ok: true, messageId: data.id, via: "resend" };
}

async function sendViaBinding(env, payload) {
  const binding = env.EMAIL_TRANSACTIONAL || env.EMAIL;
  const result = await binding.send(payload);
  return { ok: true, messageId: result.messageId };
}

async function sendViaWorker(env, payload) {
  let response;
  try {
    response = await env.EMAIL_WORKER.fetch(
      new Request("https://grace-ahrens-email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    const workerResult = await sendViaWorker(env, payload);
    if (workerResult.ok) {
      return workerResult;
    }

    if (env.RESEND_API_KEY) {
      return sendViaResend(env, payload);
    }

    return workerResult;
  }

  if (env.RESEND_API_KEY) {
    return sendViaResend(env, payload);
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

export async function sendNewsletterToList(env, subject, body, recipients) {
  if (!recipients.length) {
    return { ok: false, reason: "no_recipients" };
  }

  const html = `<div style="font-family: Georgia, serif; line-height: 1.6;">${bodyToHtml(body)}</div>`;
  const emails = recipients.map((subscriber) => subscriber.email);
  let sent = 0;

  for (let index = 0; index < emails.length; index += BATCH_SIZE) {
    const batch = emails.slice(index, index + BATCH_SIZE);
    const payload = {
      to: batch[0],
      subject,
      html,
      text: body,
    };

    if (batch.length > 1) {
      payload.bcc = batch.slice(1);
    }

    const result = await sendEmail(env, payload);

    if (!result.ok) {
      return { ok: false, reason: result.reason, message: result.message, sent };
    }

    sent += batch.length;
  }

  return { ok: true, sent };
}
