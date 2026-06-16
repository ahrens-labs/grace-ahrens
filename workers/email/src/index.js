import { dispatchTransactionalEmail } from "./dispatch.js";

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const expected = env.GRACE_EMAIL_SECRET;
    if (!expected || typeof expected !== "string") {
      return Response.json(
        {
          ok: false,
          reason: "not_configured",
          message: "Set GRACE_EMAIL_SECRET on grace-ahrens-email (wrangler secret put GRACE_EMAIL_SECRET).",
        },
        { status: 503 }
      );
    }

    const provided = request.headers.get("X-Grace-Email-Secret") || "";
    if (!timingSafeEqual(provided, expected)) {
      return Response.json({ ok: false, reason: "unauthorized" }, { status: 401 });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return Response.json({ ok: false, reason: "invalid_json" }, { status: 400 });
    }

    if (!payload.to) {
      return Response.json({ ok: false, reason: "missing_to" }, { status: 400 });
    }

    const result = await dispatchTransactionalEmail(env, payload);
    if (!result.ok) {
      return Response.json(result, { status: 500 });
    }

    return Response.json(result);
  },
};
