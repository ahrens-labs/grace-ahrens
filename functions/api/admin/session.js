import { getSessionAdmin, json } from "../../_lib/admin-auth.js";
import {
  ALLOWED_ADMIN_EMAILS,
  getAccountStates,
} from "../../_lib/admin-store.js";
import {
  getConfirmedSubscriberCount,
  getDraft,
  hasSubscriberStorage,
} from "../../_lib/subscribers.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const session = await getSessionAdmin(request, env);

  if (session) {
    let subscriberCount = null;
    let draft = null;

    if (hasSubscriberStorage(env)) {
      subscriberCount = await getConfirmedSubscriberCount(env);
      draft = await getDraft(env);
    }

    return json({
      authenticated: true,
      email: session.email,
      subscriberCount,
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
