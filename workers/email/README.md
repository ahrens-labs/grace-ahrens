# Email for graceahrens.com

Grace site mail routes through the **chess-accounts** worker.

## What recipients see

- **From:** Grace Ahrens `<grace@graceahrens.com>`
- **Reply-To:** `grace@graceahrens.com`

Mail tries `grace@` first. If that domain is not verified yet, it falls back to `caleb@ahrenslabs.com` so delivery still works.

## To use grace@ as the From address

Verify **graceahrens.com** on one of:

1. **Resend** — [resend.com/domains](https://resend.com/domains) (free tier allows one domain; you may need to swap or upgrade)
2. **Cloudflare Email Sending** — dashboard → Email → Email Sending → Onboard domain

Until verified, recipients may see From `caleb@ahrenslabs.com` with Reply-To `grace@graceahrens.com`.

## Secrets

```bash
cd ~/git/ahrens-labs.github.io/workers
npx wrangler secret put GRACE_EMAIL_SECRET
npx wrangler deploy

cd ~/git/grace-ahrens
npx wrangler pages secret put GRACE_EMAIL_SECRET --project-name=grace-ahrens
npx wrangler pages deploy . --project-name=grace-ahrens --branch=main
```
