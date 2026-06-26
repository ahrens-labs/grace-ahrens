import { sendEmail } from "./email.js";
import { buildStyledEmail } from "./newsletter-template.js";
import { buildUnsubscribeUrl } from "./subscribers.js";

const SITE_ORIGIN = "https://graceahrens.com";

function displayName(name) {
  const trimmed = String(name || "").trim();
  return trimmed || "friend";
}

async function sendStyledEmail(
  env,
  { toEmail, subject, body, origin, title, footerNote, includeUnsubscribe = true }
) {
  const unsubscribeUrl = includeUnsubscribe
    ? await buildUnsubscribeUrl(env, origin || SITE_ORIGIN, toEmail)
    : undefined;
  const { html, text } = buildStyledEmail(body, { unsubscribeUrl, title, footerNote });
  return sendEmail(env, { to: toEmail, subject, html, text });
}

export function buildConfirmationEmail(name, confirmUrl) {
  const who = displayName(name);
  const subject = "Confirm your subscription";

  const body = [
    `Hello there, ${who}.`,
    "",
    "Welcome, fellow adventurer to a world of starlight and whimsy. Otherwise known as my email list. My name is Grace Ahrens, and I strive to wield words in a way that brings light to others.",
    "",
    "Thank you for signing up to receive my writing updates and occasional other nonsense. Please confirm your subscription by clicking the link below:",
    "",
    confirmUrl,
    "",
    "If you did not sign up, you can ignore this email.",
    "",
    "Should you choose to continue journeying through the world of my email list, you will receive a couple more emails over the next few days explaining more about who I am, why I write, and what I love about stories.",
    "",
    "For now, farewell, adventurer.",
  ].join("\n");

  return { subject, body };
}

export function buildWhoIAmEmail(name) {
  const who = displayName(name);
  const subject = "Who I am, Why I write, and What I love about stories";

  const body = [
    `Hi, ${who}`,
    "",
    "In my last email, I promised to tell you more about who I am. So let's dive in!",
    "",
    "I am a writer and lover of stories. For as long as I can remember, I have loved escaping into a book to be swept away on an adventure, more often than not one involving plenty of magic and a few dragons. When I was ten, I decided that I wanted to write books like the ones I loved to read. I have not stopped writing stories since then, and I certainly have not stopped reading stories either.",
    "",
    'One of my favorite book series of all time is J.R.R. Tolkien\'s "The Lord of the Rings." A moment that always stands out to me in the series happens when Frodo and Sam are on the final stretch of their journey to Mount Doom. Things are growing steadily darker and more hopeless, and the weight of the ring and the shadows of Mordor are bearing down on our heroes. It is in this darkest moment that Sam spots a star through the haze of Mordor.',
    "",
    'When Sam sees the star, here is what goes through his head: "Sam saw a white star twinkle for a while. The beauty of it smote his heart, as he looked up out of the forsaken land, and hope returned to him. For like a shaft, clear and cold, the thought pierced him that in the end the Shadow was only a small and passing thing: there was light and high beauty forever beyond its reach."',
    "",
    "The power of the light that pierces through the darkness touched my heart just as keenly as it touched Sam's. I strive to write stories that embrace this light and offer hope even in the darkest moments, hope that shines all the brighter because of the surrounding darkness.",
    "",
    "Stories have power. They have the power to take us to new places and experience different points of view. They have the power to offer hope in darkness. They have the power to help us face the adventures that come at us in the real world. I have read many books that have brought me hope or joy, whether it is through moments of laughter and love, adventures and worlds that sweep me away, or scenes like the one in The Lord of the Rings that point to light that cannot be quenched by darkness.",
    "",
    "Through my words, I want to bring that same hope and joy to readers. I want to harness the power of stories to remind readers that there is light even in the darkness, and that the darkness will not overcome the light. Whether my words portray a dark night with only a single star piercing through to offer light in the gloom or a sunshine-filled day with light around every corner, I will strive to use my words to bring light to my readers.",
  ].join("\n");

  return { subject, body };
}

export function buildAhrensLabsEmail(name) {
  const who = displayName(name);
  const subject = "Have you heard of Ahrens Labs?";

  const body = [
    `Hi, ${who}`,
    "",
    "Here's a fun fact about me that didn't make it into my last email: My surname, Ahrens, has its root in the German word that means eagle.",
    "",
    "I think that's pretty cool.",
    "",
    "And the name Ahrens isn't one that I have all to myself. I share it with a few wonderful people known as my family.",
    "",
    "Which leads us to the main subject of this email: Ahrens Labs.",
    "",
    "Ahrens Labs is where our family comes together to use our talents and create products that others can use and enjoy. Most of what we create is coding based, and there are a few writing projects as well.",
    "",
    "If you want to see our creations for yourself, you can visit https://ahrenslabs.com.",
    "",
    "Creating an Ahrens Labs account gives you access to a chess engine, a dungeon game, a customizable sports digest, lessons for a made-up language, and much more - all for free. And we have a permanent ad-free guarantee on our website!",
    "",
    "Because our surname comes from the German word meaning eagle, our logo is an eagle, and a pretty neat looking one, too.",
    "",
    "I invite you to hop over to https://ahrenslabs.com and see for yourself if there is anything there that interests you!",
    "",
    "P.S. If you were wondering how Ahrens is pronounced, it is ARNS (rhymes with barns.) No worries if you've been pronouncing it wrong! It's a tricky name to pronounce. Gold star if you have been pronouncing it correctly!",
  ].join("\n");

  return { subject, body };
}

export function buildRemovalEmail(name) {
  const who = displayName(name);
  const subject = "You have been removed from the mailing list";

  const body = [
    `Hello there, ${who}.`,
    "",
    "This is Grace Ahrens. Your address has been removed from my fiction updates mailing list at graceahrens.com.",
    "",
    "You will no longer receive newsletters, welcome messages, or other list emails from me. If you believe this was a mistake, you can sign up again anytime on my website.",
    "",
    "Thank you for reading, and fare thee well for now.",
  ].join("\n");

  return {
    subject,
    body,
    footerNote:
      "You received this email because your address was removed from the fiction updates list on graceahrens.com.",
  };
}

export async function sendSubscriptionConfirmationEmail(env, confirmUrl, toEmail, name, origin) {
  const { subject, body } = buildConfirmationEmail(name, confirmUrl);
  return sendStyledEmail(env, {
    toEmail,
    subject,
    body,
    origin,
    title: subject,
  });
}

export async function sendWelcomeEmail2(env, toEmail, name, origin) {
  const { subject, body } = buildWhoIAmEmail(name);
  return sendStyledEmail(env, {
    toEmail,
    subject,
    body,
    origin,
    title: subject,
  });
}

export async function sendWelcomeEmail3(env, toEmail, name, origin) {
  const { subject, body } = buildAhrensLabsEmail(name);
  return sendStyledEmail(env, {
    toEmail,
    subject,
    body,
    origin,
    title: subject,
  });
}

export async function sendRemovalEmail(env, toEmail, name) {
  const { subject, body, footerNote } = buildRemovalEmail(name);
  return sendStyledEmail(env, {
    toEmail,
    subject,
    body,
    title: subject,
    footerNote,
    includeUnsubscribe: false,
  });
}
