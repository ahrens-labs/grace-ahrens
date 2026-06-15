import { bodyToHtml } from "./email.js";

const MAILING_ADDRESS = "283 Wagner Avenue<br>Ambridge, PA 15003";

export const NEWSLETTER_SOCIAL_LINKS = [
  { label: "website", url: "https://graceahrens.com" },
  { label: "twitter", url: "" },
  { label: "goodreads", url: "" },
  { label: "facebook", url: "" },
  { label: "instagram", url: "" },
];

const FOOTER_COPY = {
  signupNote: "You received this email because you signed up for fiction updates on my website.",
  affiliateNote:
    "Emails may contain affiliate links, meaning if you decide to make a purchase via my links, I may earn a commission at no additional cost to you.",
};

function buildSocialLinksHtml() {
  const links = NEWSLETTER_SOCIAL_LINKS.filter((entry) => entry.url);
  if (!links.length) return "";

  return links
    .map(
      (entry, index) =>
        `${index > 0 ? '<span style="color:#bbb;">&nbsp;&nbsp;</span>' : ""}<a href="${entry.url}" style="color:#5a5a5a;text-decoration:underline;">${entry.label}</a>`
    )
    .join("");
}

function buildSocialLinksText() {
  return NEWSLETTER_SOCIAL_LINKS.filter((entry) => entry.url)
    .map((entry) => `${entry.label}: ${entry.url}`)
    .join("\n");
}

export function buildNewsletterEmail(body, { unsubscribeUrl }) {
  const bodyHtml = bodyToHtml(body);
  const socialHtml = buildSocialLinksHtml();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter</title>
</head>
<body style="margin:0;padding:0;background:#efeeea;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#efeeea;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #e4e0d8;">
          <tr>
            <td style="padding:36px 32px 28px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.75;color:#1c1c1c;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 36px;border-top:1px solid #ebe6de;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.65;color:#666666;text-align:center;">
              ${socialHtml ? `<p style="margin:0 0 18px 0;">${socialHtml}</p>` : ""}
              <p style="margin:0 0 18px 0;color:#555555;">${MAILING_ADDRESS}</p>
              <p style="margin:0 0 14px 0;">${FOOTER_COPY.signupNote}</p>
              <p style="margin:0 0 18px 0;">${FOOTER_COPY.affiliateNote}</p>
              <p style="margin:0;"><a href="${unsubscribeUrl}" style="color:#5a5a5a;text-decoration:underline;">Unsubscribe</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textParts = [
    body,
    "",
    buildSocialLinksText(),
    "",
    "283 Wagner Avenue",
    "Ambridge, PA 15003",
    "",
    FOOTER_COPY.signupNote,
    "",
    FOOTER_COPY.affiliateNote,
    "",
    `Unsubscribe: ${unsubscribeUrl}`,
  ];

  return { html, text: textParts.filter(Boolean).join("\n") };
}
