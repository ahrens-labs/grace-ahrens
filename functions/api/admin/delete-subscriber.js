import { getSessionAdmin, json } from "../../_lib/admin-auth.js";
import { formatEmailSendError, hasEmailBinding } from "../../_lib/email.js";
import { deleteSubscriber, getSubscriber, hasSubscriberStorage } from "../../_lib/subscribers.js";
import { sendRemovalEmail } from "../../_lib/welcome-emails.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const session = await getSessionAdmin(request, env);
    if (!session) {
      return json({ error: "Not authorized." }, 401);
    }

    if (!hasSubscriberStorage(env) || !hasEmailBinding(env)) {
      return json({ error: "Subscriber management is not configured yet." }, 503);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid request." }, 400);
    }

    const email = String(body.email || "").trim().toLowerCase();
    const confirm = String(body.confirm || "").trim().toUpperCase();

    if (!email || !EMAIL_RE.test(email)) {
      return json({ error: "Please choose a valid subscriber email." }, 400);
    }

    if (confirm !== "REMOVE") {
      return json({ error: "Type REMOVE in the confirmation box to delete this subscriber." }, 400);
    }

    const existing = await getSubscriber(env, email);
    if (!existing) {
      return json({ error: "That subscriber was not found." }, 404);
    }

    if (existing.status !== "confirmed") {
      return json({ error: "Only confirmed subscribers can be removed from the admin list." }, 400);
    }

    const origin = new URL(request.url).origin;
    const emailResult = await sendRemovalEmail(env, email, existing.name, origin);
    if (!emailResult.ok) {
      return json(
        {
          error: formatEmailSendError(emailResult.reason, emailResult.message),
        },
        500
      );
    }

    const result = await deleteSubscriber(env, email);
    if (!result.ok) {
      return json({ error: "Could not remove that subscriber." }, 500);
    }

    return json({
      success: true,
      message: `Removed ${result.name || result.email} from the list and sent a confirmation email.`,
    });
  } catch (error) {
    console.error("delete-subscriber error:", error);
    return json({ error: "Something went wrong." }, 500);
  }
}
