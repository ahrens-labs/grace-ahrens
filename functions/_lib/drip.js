import {
  listAllSubscriberRecords,
  saveSubscriber,
} from "./subscribers.js";
import { sendWelcomeEmail2, sendWelcomeEmail3 } from "./welcome-emails.js";

export async function processDueDripEmails(env) {
  const now = Date.now();
  const subscribers = await listAllSubscriberRecords(env);
  let sent = 0;
  let failed = 0;

  for (const record of subscribers) {
    if (record.status !== "confirmed" || !record.drip) continue;

    const { email, name, drip } = record;
    let updated = false;

    if (!drip.email2Sent && drip.email2DueAt <= now) {
      const result = await sendWelcomeEmail2(env, email, name);
      if (result.ok) {
        drip.email2Sent = true;
        updated = true;
        sent += 1;
      } else {
        failed += 1;
        continue;
      }
    }

    if (drip.email2Sent && !drip.email3Sent && drip.email3DueAt <= now) {
      const result = await sendWelcomeEmail3(env, email, name);
      if (result.ok) {
        drip.email3Sent = true;
        updated = true;
        sent += 1;
      } else {
        failed += 1;
      }
    }

    if (updated) {
      record.drip = drip;
      await saveSubscriber(env, record);
    }
  }

  return { sent, failed };
}
