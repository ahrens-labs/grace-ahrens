import { getSessionAdmin, json } from "../../_lib/admin-auth.js";
import {
  ALLOWED_ADMIN_EMAILS,
  getAccountStates,
} from "../../_lib/admin-store.js";
import {
  getDraft,
  hasSubscriberStorage,
  listAllSubscribers,
} from "../../_lib/subscribers.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const session = await getSessionAdmin(request, env);

  if (session) {
    let subscriberCount = null;
    let subscribers = [];
    let draft = null;

    if (hasSubscriberStorage(env)) {
      subscribers = await listAllSubscribers(env);
      subscriberCount = subscribers.filter((entry) => entry.status === "confirmed").length;
      draft = await getDraft(env);
    }

    return json({
      authenticated: true,
      email: session.email,
      subscriberCount,
      subscribers: subscribers.map((entry) => ({
        name: entry.name || "",
        email: entry.email,
        status: entry.status || "pending",
        confirmedAt: entry.confirmedAt || null,
        createdAt: entry.createdAt || null,
      })),
      draft: draft
        ? {
            subject: draft.subject || "",
            body: draft.body || "",
            savedAt: draft.savedAt || null,
          }
        : null,
    });
  }

  const accounts = await getAccountStates(env);

  return json({
    authenticated: false,
    allowedAdmins: ALLOWED_ADMIN_EMAILS,
    accounts,
  });
}
