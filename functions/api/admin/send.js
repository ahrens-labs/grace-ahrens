import { isAdmin, json } from "../../_lib/admin-auth.js";

const MAX_SUBJECT_LENGTH = 200;
const MAX_BODY_LENGTH = 50000;

async function createButtondownEmail(apiKey, subject, body, mode) {
  const headers = {
    Authorization: `Token ${apiKey}`,
    "Content-Type": "application/json",
    "X-API-Version": "2026-04-01",
  };

  const payload = {
    subject,
    body,
    status: mode === "send" ? "about_to_send" : "draft",
  };

  if (mode === "send") {
    headers["X-Buttondown-Live-Dangerously"] = "true";
  }

  const response = await fetch("https://api.buttondown.com/v1/emails", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!(await isAdmin(request, env))) {
    return json({ error: "Not authorized." }, 401);
  }

  if (!env.BUTTONDOWN_API_KEY) {
    return json({ error: "Newsletter is not configured yet." }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const subject = String(body.subject || "").trim().slice(0, MAX_SUBJECT_LENGTH);
  const message = String(body.body || "").trim().slice(0, MAX_BODY_LENGTH);
  const mode = body.mode === "send" ? "send" : "draft";
  const confirm = String(body.confirm || "").trim().toUpperCase();

  if (!subject) {
    return json({ error: "Please enter a subject line." }, 400);
  }

  if (!message) {
    return json({ error: "Please enter a message." }, 400);
  }

  if (mode === "send" && confirm !== "SEND") {
    return json({ error: 'Type SEND in the confirmation box to email your full list.' }, 400);
  }

  const { response, data } = await createButtondownEmail(
    env.BUTTONDOWN_API_KEY,
    subject,
    message,
    mode
  );

  if (!response.ok) {
    return json({ error: "Unable to save or send this email right now." }, 500);
  }

  if (mode === "send") {
    return json({
      success: true,
      message: "Your newsletter is on its way to the full list.",
      previewUrl: data.absolute_url || null,
    });
  }

  return json({
    success: true,
    message: "Draft saved. Review it before sending to your list.",
    previewUrl: data.absolute_url || null,
  });
}
