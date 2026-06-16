# Email for graceahrens.com

Grace site mail is sent through **Cloudflare Email Sending** only (no Resend). Pages and the scheduler call the **chess-accounts** worker, which sends via its `EMAIL_TRANSACTIONAL` binding and never falls back to Resend for Grace mail.

## Setup (one time)

Pick a random secret string, then set the **same value** in three places:

```bash
# 1. chess-accounts worker
cd ~/git/ahrens-labs.github.io/workers
npx wrangler secret put GRACE_EMAIL_SECRET
npx wrangler deploy

# 2. grace-ahrens Pages
cd ~/git/grace-ahrens
npx wrangler pages secret put GRACE_EMAIL_SECRET --project-name=grace-ahrens
npx wrangler pages deploy . --project-name=grace-ahrens --branch=main

# 3. drip scheduler (welcome emails)
cd ~/git/grace-ahrens/workers/scheduler
npx wrangler secret put GRACE_EMAIL_SECRET
npx wrangler deploy
```

Onboard **graceahrens.com** under Cloudflare → Email → Email Sending and verify `grace@graceahrens.com` as a sender.

## What recipients see

- **From:** Grace Ahrens `<grace@graceahrens.com>`
- **Reply-To:** `grace@graceahrens.com`

## Endpoint

Pages calls `POST /internal/grace-ahrens/send` on chess-accounts with header `X-Grace-Email-Secret`.

## Optional: dedicated worker

`workers/email/` (`grace-ahrens-email`) is a standalone Cloudflare-only sender if you want Grace mail fully separate from chess-accounts later. It is not the active path today.
