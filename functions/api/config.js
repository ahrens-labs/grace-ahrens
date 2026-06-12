export async function onRequestGet({ env }) {
  const turnstileSiteKey = env.TURNSTILE_SITE_KEY || "";
  return new Response(
    JSON.stringify({
      turnstileSiteKey,
      turnstileRequired: Boolean(turnstileSiteKey),
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    }
  );
}
