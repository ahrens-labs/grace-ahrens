import { processDueDripEmails } from "../../../functions/_lib/drip.js";

export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(
      processDueDripEmails(env).catch((error) => {
        console.error("Drip email scheduler failed:", error);
      })
    );
  },
};
