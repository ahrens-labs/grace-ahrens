# Email for graceahrens.com

Grace site mail is sent through the **chess-accounts** worker, which already has a working Cloudflare `EMAIL_TRANSACTIONAL` binding (no recipient allowlist).

The separate `grace-ahrens-email` worker is no longer used.

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

## What recipients see

- **From:** Grace Ahrens `<caleb@ahrenslabs.com>`
- **Reply-To:** `grace@graceahrens.com`

## Endpoint

Pages calls `POST /internal/grace-ahrens/send` on chess-accounts with header `X-Grace-Email-Secret`.
