const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 100;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

async function verifyTurnstile(secret, token, request) {
  if (!secret || !token) return false;

  const formData = new URLSearchParams();
  formData.append("secret", secret);
  formData.append("response", token);

  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) formData.append("remoteip", ip);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();
  return result.success === true;
}

async function subscribeButtondown(apiKey, email, name) {
  const response = await fetch("https://api.buttondown.com/v1/subscribers", {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: email,
      metadata: { name },
    }),
  });

  if (response.ok) {
    return { ok: true };
  }

  const data = await response.json().catch(() => ({}));

  if (response.status === 409 || data?.code === "email_already_exists") {
    return { ok: true, alreadySubscribed: true };
  }

  return { ok: false };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.includes("application/json")) {
    return json({ error: "Invalid request" }, 415);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const company = String(body.company || "").trim();
  if (company) {
    return json({ success: true });
  }

  const name = String(body.name || "").trim().slice(0, MAX_NAME_LENGTH);
  const email = String(body.email || "").trim().toLowerCase();
  const turnstileToken = String(body.turnstileToken || "").trim();

  if (!name) {
    return json({ error: "Please enter your name." }, 400);
  }

  if (!email || !EMAIL_RE.test(email)) {
    return json({ error: "Please enter a valid email address." }, 400);
  }

  if (env.TURNSTILE_SECRET_KEY) {
    if (!turnstileToken) {
      return json({ error: "Please complete the security check." }, 400);
    }

    const verified = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, turnstileToken, request);
    if (!verified) {
      return json({ error: "Security check failed. Please try again." }, 403);
    }
  }

  if (!env.BUTTONDOWN_API_KEY) {
    return json({ error: "Newsletter signup is not configured yet." }, 503);
  }

  const result = await subscribeButtondown(env.BUTTONDOWN_API_KEY, email, name);
  if (!result.ok) {
    return json({ error: "Unable to subscribe right now. Please try again later." }, 500);
  }

  if (result.alreadySubscribed) {
    return json({
      success: true,
      message: "You are already on the list. Thanks for reading!",
    });
  }

  return json({
    success: true,
    message: "You are on the list. Check your inbox to confirm your subscription.",
  });
}
