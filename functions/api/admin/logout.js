import { clearSessionCookie, json } from "../../_lib/admin-auth.js";

export async function onRequestPost() {
  return json({ success: true }, 200, { "Set-Cookie": clearSessionCookie() });
}
