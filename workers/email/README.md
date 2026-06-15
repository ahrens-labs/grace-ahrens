# grace-ahrens-email

Outbound mail for graceahrens.com. Uses **Resend** (same as chess-accounts) because Cloudflare Email Sending returns `E_RECIPIENT_NOT_ALLOWED` for arbitrary subscribers until the domain is fully onboarded.

## One-time setup

```bash
cd workers/email

# Paste the same RESEND_API_KEY you use for chess-accounts
npx wrangler secret put RESEND_API_KEY

npx wrangler deploy
```

**Resend dashboard:** verify `graceahrens.com` and allow `grace@graceahrens.com` as a sender (Domains → add graceahrens.com if needed).

## Optional: Pages fallback

If the worker secret is missing, you can also add `RESEND_API_KEY` as an encrypted variable on the **grace-ahrens** Pages project in the Cloudflare dashboard. Pages Functions will fall back to Resend when the worker fails.

## Config

| Variable | Where | Purpose |
|----------|--------|---------|
| `TRANSACTIONAL_EMAIL_VIA=resend` | wrangler.toml | Skip Cloudflare, use Resend only |
| `SENDER_EMAIL` | wrangler.toml | `grace@graceahrens.com` |
| `RESEND_API_KEY` | wrangler secret | Resend API key |

## Why EMAIL_TRANSACTIONAL?

Binding name avoids legacy dashboard allowlists on an old `EMAIL` binding. With `TRANSACTIONAL_EMAIL_VIA=resend`, Cloudflare send is not used at runtime.
