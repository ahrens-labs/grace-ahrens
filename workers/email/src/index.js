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

    if (!env.EMAIL) {
      return Response.json({ ok: false, reason: "missing_email_binding" }, { status: 503 });
    }

    try {
      const result = await env.EMAIL.send(payload);
      return Response.json({ ok: true, messageId: result.messageId });
    } catch (error) {
      return Response.json(
        {
          ok: false,
          reason: error.code || "send_failed",
          message: error.message,
        },
        { status: 500 }
      );
    }
  },
};
