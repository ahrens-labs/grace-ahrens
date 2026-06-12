import { getPendingSetup, activatePassword } from "../../_lib/admin-store.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const origin = url.origin;
  const token = String(url.searchParams.get("token") || "").trim();
  const pending = await getPendingSetup(env);

  if (!token || !pending || pending.token !== token || Date.now() > pending.exp) {
    return Response.redirect(`${origin}/admin.html?setup=invalid`, 302);
  }

  await activatePassword(env, pending.passwordHash);
  return Response.redirect(`${origin}/admin.html?setup=confirmed`, 302);
}
