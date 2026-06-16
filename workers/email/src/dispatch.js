function defaultSender(env) {
  return {
    email: env.SENDER_EMAIL || "grace@graceahrens.com",
    name: env.SENDER_NAME || "Grace Ahrens",
  };
}

function normalizeFrom(from, env) {
  if (from && typeof from === "object" && from.email) {
    return {
      email: String(from.email).trim(),
      name: String(from.name || defaultSender(env).name).trim(),
    };
  }

  if (typeof from === "string" && from.trim()) {
    const match = from.trim().match(/^(.+?)\s*<([^>]+)>$/);
    if (match) {
      return { name: match[1].trim(), email: match[2].trim() };
    }
    return { email: from.trim(), name: defaultSender(env).name };
  }

  return defaultSender(env);
}

function buildMessage(env, payload) {
  const message = {
    from: normalizeFrom(payload.from, env),
    subject: String(payload.subject || ""),
  };

  if (payload.to) message.to = payload.to;
  if (payload.bcc) message.bcc = payload.bcc;
  if (payload.html) message.html = payload.html;
  if (payload.text) message.text = payload.text;

  const replyTo = payload.replyTo || env.REPLY_TO_EMAIL;
  if (replyTo) {
    message.replyTo = replyTo;
  }

  return message;
}

async function sendViaCloudflare(env, message) {
  if (!env.EMAIL_TRANSACTIONAL) {
    return { ok: false, reason: "missing_email_binding" };
  }

  try {
    const result = await env.EMAIL_TRANSACTIONAL.send(message);
    return { ok: true, messageId: result.messageId, via: "cloudflare" };
  } catch (error) {
    return {
      ok: false,
      reason: error.code || "send_failed",
      message: error.message,
    };
  }
}

const SENDER_FALLBACK_ERRORS = new Set([
  "E_SENDER_NOT_VERIFIED",
  "E_SENDER_DOMAIN_NOT_AVAILABLE",
]);

export async function dispatchTransactionalEmail(env, payload) {
  const message = buildMessage(env, payload);
  const result = await sendViaCloudflare(env, message);

  if (result.ok) {
    return result;
  }

  const fallbackEmail = String(env.FALLBACK_SENDER_EMAIL || "").trim();
  if (
    fallbackEmail &&
    SENDER_FALLBACK_ERRORS.has(result.reason) &&
    message.from.email !== fallbackEmail
  ) {
    const retry = {
      ...message,
      from: {
        email: fallbackEmail,
        name: message.from.name || defaultSender(env).name,
      },
    };
    return sendViaCloudflare(env, retry);
  }

  return result;
}
