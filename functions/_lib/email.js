export async function sendAdminConfirmationEmail(env, confirmUrl) {
  if (!env.RESEND_API_KEY) {
    return { ok: false, reason: "missing_resend_key" };
  }

  const to = env.ADMIN_NOTIFY_EMAIL || "grace@graceahrens.com";
  const from = env.ADMIN_FROM_EMAIL || "Grace Ahrens <noreply@graceahrens.com>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Confirm your Grace Ahrens admin password",
      html: `
        <p>Someone requested to set the admin password for <strong>graceahrens.com</strong>.</p>
        <p>If this was you, confirm your new admin password by clicking the link below. This link expires in one hour.</p>
        <p><a href="${confirmUrl}">Confirm admin password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    }),
  });

  if (!response.ok) {
    return { ok: false, reason: "send_failed" };
  }

  return { ok: true };
}
