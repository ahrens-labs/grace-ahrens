# grace-ahrens-email

Outbound mail via **Cloudflare Email Sending** (not Resend). Uses the same account and pattern as chess-accounts.

## Why caleb@ahrenslabs.com?

ahrenslabs.com is already onboarded for Cloudflare Email Sending. Messages show **Grace Ahrens** as the sender name and set **Reply-To: grace@graceahrens.com**. No Resend domain slot needed.

When graceahrens.com is onboarded on Cloudflare Email Sending, change `SENDER_EMAIL` in `wrangler.toml` to `grace@graceahrens.com` and redeploy.

## Deploy

```bash
cd workers/email
npx wrangler deploy
```

## If you see E_RECIPIENT_NOT_ALLOWED

1. Redeploy this worker (`npx wrangler deploy`).
2. In Cloudflare dashboard → Workers → **grace-ahrens-email** → Settings → Bindings → confirm the send-email binding is **EMAIL_TRANSACTIONAL** with **no** destination allowlist.
3. Do not use an old `EMAIL` binding with `allowed_destination_addresses`.

## Onboard graceahrens.com (optional, for grace@ sender)

Cloudflare dashboard → **Email Service** → **Email Sending** → add **graceahrens.com** and complete DNS. Then set `SENDER_EMAIL = "grace@graceahrens.com"` in `wrangler.toml`.
