import {
  confirmSubscriber,
  hasSubscriberStorage,
} from "../_lib/subscribers.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const origin = url.origin;
  const token = String(url.searchParams.get("token") || "").trim();

  if (!token || !hasSubscriberStorage(env)) {
    return Response.redirect(`${origin}/newsletter.html?confirmed=invalid`, 302);
  }

  const result = await confirmSubscriber(env, token);
  if (!result.ok) {
    return Response.redirect(`${origin}/newsletter.html?confirmed=invalid`, 302);
  }

  return Response.redirect(`${origin}/newsletter.html?confirmed=1`, 302);
}
