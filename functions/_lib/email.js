const BATCH_SIZE = 50;

function getFromAddress(env) {
  return env.NEWSLETTER_FROM_EMAIL || "Grace Ahrens <grace@graceahrens.com>";
}

function getFromEmailOnly(env) {
  const from = getFromAddress(env);
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from;
}

export function hasEmailBinding(env) {
  return Boolean(env.EMAIL);
}

export async function sendEmail(env, { to, subject, html, text, bcc }) {
  if (!env.EMAIL) {
    return { ok: false, reason: "missing_email_binding" };
  }

  const payload = {
    from: getFromAddress(env),
    subject,
  };

  if (to) payload.to = to;
  if (bcc) payload.bcc = bcc;
  if (html) payload.html = html;
  if (text) payload.text = text;

  try {
    const result = await env.EMAIL.send(payload);
    return { ok: true, messageId: result.messageId };
  } catch (error) {
    return {
      ok: false,
      reason: error.code || "send_failed",
      message: error.message,
    };
  }
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

export async function sendSubscriptionConfirmationEmail(env, confirmUrl, toEmail, name) {
  const greeting = name ? `Hi ${name},` : "Hi,";

  return sendEmail(env, {
    to: toEmail,
    subject: "Confirm your subscription — Grace Ahrens",
    html: `
      <p>${greeting}</p>
      <p>Thanks for signing up for updates from Grace Ahrens. Please confirm your subscription by clicking the link below:</p>
      <p><a href="${confirmUrl}">Confirm subscription</a></p>
      <p>If you did not sign up, you can ignore this email.</p>
    `,
    text: [
      greeting,
      "Thanks for signing up for updates from Grace Ahrens.",
      "Please confirm your subscription by visiting:",
      confirmUrl,
      "If you did not sign up, you can ignore this email.",
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
  const fromEmail = getFromEmailOnly(env);
  const emails = recipients.map((subscriber) => subscriber.email);
  let sent = 0;

  for (let index = 0; index < emails.length; index += BATCH_SIZE) {
    const batch = emails.slice(index, index + BATCH_SIZE);
    const result = await sendEmail(env, {
      to: fromEmail,
      bcc: batch,
      subject,
      html,
      text: body,
    });

    if (!result.ok) {
      return { ok: false, reason: result.reason, message: result.message, sent };
    }

    sent += batch.length;
  }

  return { ok: true, sent };
}
