import { hasSubscriberStorage, unsubscribeEmail } from "../_lib/subscribers.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const origin = url.origin;
  const email = String(url.searchParams.get("email") || "").trim().toLowerCase();
  const token = String(url.searchParams.get("token") || "").trim();

  if (!hasSubscriberStorage(env) || !email || !token) {
    return Response.redirect(`${origin}/newsletter.html?unsubscribed=invalid`, 302);
  }

  const result = await unsubscribeEmail(env, email, token);
  if (!result.ok) {
    return Response.redirect(`${origin}/newsletter.html?unsubscribed=invalid`, 302);
  }

  return Response.redirect(`${origin}/newsletter.html?unsubscribed=1`, 302);
}
