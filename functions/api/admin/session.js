import { getSessionAdmin, json } from "../../_lib/admin-auth.js";
import {
  ALLOWED_ADMIN_EMAILS,
  getAccountStates,
} from "../../_lib/admin-store.js";
import {
  getDraft,
  hasSubscriberStorage,
  listConfirmedSubscribers,
  getConfirmedSubscriberCount,
} from "../../_lib/subscribers.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const session = await getSessionAdmin(request, env);

  if (session) {
    let subscriberCount = null;
    let subscribers = [];
    let draft = null;

    if (hasSubscriberStorage(env)) {
      subscribers = await listConfirmedSubscribers(env);
      subscriberCount = await getConfirmedSubscriberCount(env);
      draft = await getDraft(env);
    }

    return json({
      authenticated: true,
      email: session.email,
      subscriberCount,
      subscribers: subscribers.map((entry) => ({
        name: entry.name || "",
        email: entry.email,
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
