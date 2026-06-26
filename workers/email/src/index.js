import { dispatchTransactionalEmail } from "./dispatch.js";

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
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
