# Email for graceahrens.com

Grace site mail routes through the **chess-accounts** worker.

## What recipients see

- **From:** Grace Ahrens `<grace@ahrenslabs.com>`
- **Reply-To:** `grace@graceahrens.com`

Mail sends from **grace@ahrenslabs.com** (ahrenslabs.com is already verified for sending). Replies go to grace@graceahrens.com.

## Secrets

```bash
cd ~/git/ahrens-labs.github.io/workers
npx wrangler secret put GRACE_EMAIL_SECRET
npx wrangler deploy

cd ~/git/grace-ahrens
npx wrangler pages secret put GRACE_EMAIL_SECRET --project-name=grace-ahrens
npx wrangler pages deploy . --project-name=grace-ahrens --branch=main
```
