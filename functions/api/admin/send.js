import { getSessionAdmin, json } from "../../_lib/admin-auth.js";
import {
  hasSubscriberStorage,
  listConfirmedSubscribers,
  saveDraft,
  clearDraft,
} from "../../_lib/subscribers.js";
import {
  formatEmailSendError,
  hasEmailBinding,
  sendNewsletterToList,
} from "../../_lib/email.js";

const MAX_SUBJECT_LENGTH = 200;
const MAX_BODY_LENGTH = 50000;

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const session = await getSessionAdmin(request, env);
    if (!session) {
      return json({ error: "Not authorized." }, 401);
    }

    if (!hasSubscriberStorage(env) || !hasEmailBinding(env)) {
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

    if (mode === "draft") {
      await saveDraft(env, {
        subject,
        body: message,
        savedAt: Date.now(),
        savedBy: session.email,
      });

      return json({
        success: true,
        message: "Draft saved. Come back anytime to finish and send.",
      });
    }

    if (confirm !== "SEND") {
      return json({ error: "Type SEND in the confirmation box to email your full list." }, 400);
    }

    const subscribers = await listConfirmedSubscribers(env);
    if (!subscribers.length) {
      return json({ error: "There are no subscribers to email yet." }, 400);
    }

    const origin = new URL(request.url).origin;
    const sendResult = await sendNewsletterToList(env, subject, message, subscribers, origin);
    if (!sendResult.ok) {
      const detail = sendResult.sent
        ? ` Sent ${sendResult.sent} before the error.`
        : "";
      const reason = formatEmailSendError(sendResult.reason, sendResult.message);
      return json({
        error: `${reason}${detail}`,
      }, 500);
    }

    await clearDraft(env);

    return json({
      success: true,
      message: `Your newsletter was sent to ${sendResult.sent} subscriber${sendResult.sent === 1 ? "" : "s"}.`,
      recipientCount: sendResult.sent,
    });
  } catch (error) {
    return json({
      error: `Unexpected error while sending: ${error.message || "please try again."}`,
    }, 500);
  }
}
