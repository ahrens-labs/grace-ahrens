import { isAdmin, json } from "../../_lib/admin-auth.js";
import { getAdminState } from "../../_lib/admin-store.js";

async function getSubscriberCount(apiKey) {
  const response = await fetch("https://api.buttondown.com/v1/subscribers?limit=1", {
    headers: { Authorization: `Token ${apiKey}` },
  });

  if (!response.ok) return null;

  const data = await response.json().catch(() => ({}));
  if (typeof data.count === "number") return data.count;
  if (Array.isArray(data.results)) return data.results.length;
  return null;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const authed = await isAdmin(request, env);

  if (authed) {
    let subscriberCount = null;
    if (env.BUTTONDOWN_API_KEY) {
      subscriberCount = await getSubscriberCount(env.BUTTONDOWN_API_KEY);
    }

    return json({
      authenticated: true,
      subscriberCount,
    });
  }

  const { needsSetup, setupPending } = await getAdminState(env);

  return json({
    authenticated: false,
    needsSetup,
    setupPending,
  });
}
