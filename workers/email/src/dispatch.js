const VERIFIED_SENDER = "caleb@ahrenslabs.com";
const SENDER_ERRORS = new Set([
  "E_SENDER_NOT_VERIFIED",
  "E_SENDER_DOMAIN_NOT_AVAILABLE",
]);

function defaultSender(env) {
  return {
    email: env.SENDER_EMAIL || VERIFIED_SENDER,
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

function buildMessage(env, payload, fromOverride) {
  const from = fromOverride || normalizeFrom(payload.from, env);
  const message = {
    from,
    subject: String(payload.subject || ""),
  };

  if (payload.to) message.to = payload.to;
  if (payload.bcc) message.bcc = payload.bcc;
  if (payload.html) message.html = payload.html;
  if (payload.text) message.text = payload.text;

  const replyTo = payload.replyTo || env.REPLY_TO_EMAIL || "grace@graceahrens.com";
  if (replyTo) {
    message.replyTo = replyTo;
  }

  return message;
}

async function sendViaCloudflare(env, message) {
  const binding = env.EMAIL_OUTBOUND || env.EMAIL_TRANSACTIONAL;
  if (!binding) {
    return { ok: false, reason: "missing_email_binding" };
  }

  try {
    const result = await binding.send(message);
    return { ok: true, messageId: result.messageId, via: "cloudflare", from: message.from.email };
  } catch (error) {
    return {
      ok: false,
      reason: error.code || "send_failed",
      message: error.message,
    };
  }
}

export async function dispatchTransactionalEmail(env, payload) {
  const verifiedFrom = {
    email: String(env.SENDER_EMAIL || VERIFIED_SENDER).trim(),
    name: defaultSender(env).name,
  };
  const message = buildMessage(env, payload, verifiedFrom);
  const result = await sendViaCloudflare(env, message);

  if (result.ok) {
    return result;
  }

  if (SENDER_ERRORS.has(result.reason) && message.from.email !== VERIFIED_SENDER) {
    const retry = buildMessage(env, payload, {
      email: VERIFIED_SENDER,
      name: verifiedFrom.name,
    });
    return sendViaCloudflare(env, retry);
  }

  return result;
}
