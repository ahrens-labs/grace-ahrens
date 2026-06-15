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

function formatFromAddress(from) {
  return from.name ? `${from.name} <${from.email}>` : from.email;
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

async function sendViaResend(env, message) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "missing_resend_key" };
  }

  const body = {
    from: formatFromAddress(message.from),
    subject: message.subject,
  };

  if (message.to) {
    body.to = Array.isArray(message.to) ? message.to : [message.to];
  }

  if (message.bcc) {
    body.bcc = Array.isArray(message.bcc) ? message.bcc : [message.bcc];
  }

  if (message.html) body.html = message.html;
  if (message.text) body.text = message.text;

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

export async function dispatchTransactionalEmail(env, payload) {
  const message = buildMessage(env, payload);
  const mode = String(env.TRANSACTIONAL_EMAIL_VIA || "").trim().toLowerCase();

  if (mode === "resend") {
    return sendViaResend(env, message);
  }

  const cloudflareResult = await sendViaCloudflare(env, message);
  if (cloudflareResult.ok) {
    return cloudflareResult;
  }

  if (env.RESEND_API_KEY) {
    const resendResult = await sendViaResend(env, message);
    if (resendResult.ok) {
      return resendResult;
    }

    return {
      ok: false,
      reason: resendResult.reason,
      message: resendResult.message,
      primaryReason: cloudflareResult.reason,
    };
  }

  return cloudflareResult;
}
