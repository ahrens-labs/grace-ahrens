const BATCH_SIZE = 50;

export function formatEmailSendError(reason, message) {
  switch (reason) {
    case "E_SENDER_NOT_VERIFIED":
    case "E_SENDER_DOMAIN_NOT_AVAILABLE":
      return "graceahrens.com is not fully set up for Email Sending yet. Finish domain onboarding in Cloudflare.";
    case "E_RECIPIENT_NOT_ALLOWED":
      return "One or more recipients are not allowed yet. Complete Email Sending setup for graceahrens.com, or verify destination addresses in Cloudflare Email Routing.";
    case "E_TOO_MANY_RECIPIENTS":
      return "Too many recipients in one send. Try again — this should not happen with a normal list size.";
    case "missing_email_binding":
    case "missing_email_config":
      return "Email sending is not configured on the server.";
    case "send_failed":
      return message || "Email sending failed for an unknown reason.";
    default:
      return message || reason || "Email sending failed.";
  }
}

function getFromAddress(env) {
  return env.NEWSLETTER_FROM_EMAIL || "Grace Ahrens <grace@graceahrens.com>";
}

function getFromEmailOnly(env) {
  const from = getFromAddress(env);
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from;
}

function getApiToken(env) {
  return env.CLOUDFLARE_EMAIL_API_TOKEN || env.CLOUDFLARE_API_TOKEN || "";
}

export function hasEmailBinding(env) {
  return (
    Boolean(env.EMAIL) ||
    Boolean(env.EMAIL_WORKER) ||
    Boolean(getApiToken(env) && env.CLOUDFLARE_ACCOUNT_ID)
  );
}

async function sendViaBinding(env, payload) {
  const result = await env.EMAIL.send(payload);
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

  if (env.EMAIL) {
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
