# grace-ahrens-email

Outbound mail for graceahrens.com (newsletter confirmations, welcome drips, admin).

Same pattern as chess-accounts: Cloudflare `EMAIL_TRANSACTIONAL` binding first, Resend fallback.

## Deploy

```bash
cd workers/email
npx wrangler deploy
```

## Secrets

Copy the Resend key from chess-accounts if you use the same Resend account:

```bash
npx wrangler secret put RESEND_API_KEY
```

Optional — force Resend only (useful when Cloudflare returns `E_RECIPIENT_NOT_ALLOWED`):

```bash
# In wrangler.toml [vars], uncomment:
# TRANSACTIONAL_EMAIL_VIA = "resend"
```

`SENDER_EMAIL` must be verified with whichever provider sends (`grace@graceahrens.com`).

## Why EMAIL_TRANSACTIONAL?

Do **not** rename back to `EMAIL`. An old dashboard allowlist on a legacy `EMAIL` binding causes `E_RECIPIENT_NOT_ALLOWED` for arbitrary subscribers. This worker intentionally omits `allowed_destination_addresses`.

## Test

After deploy, sign up on the newsletter form or check Cloudflare Worker logs for `grace-ahrens-email`.
