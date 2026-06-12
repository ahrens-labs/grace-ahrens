import {
  normalizeAdminEmail,
  getPendingSetup,
  activatePassword,
} from "../../_lib/admin-store.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const origin = url.origin;
  const token = String(url.searchParams.get("token") || "").trim();
  const email = normalizeAdminEmail(url.searchParams.get("email"));
  const pending = email ? await getPendingSetup(env, email) : null;

  if (!token || !email || !pending || pending.token !== token || Date.now() > pending.exp) {
    return Response.redirect(`${origin}/admin.html?setup=invalid`, 302);
  }

  await activatePassword(env, email, pending.passwordHash);
  return Response.redirect(
    `${origin}/admin.html?setup=confirmed&email=${encodeURIComponent(email)}`,
    302
  );
}
