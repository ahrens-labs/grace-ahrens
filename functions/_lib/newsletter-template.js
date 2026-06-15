import { bodyToHtml } from "./email.js";

const AUTHOR_NAME = "Grace Ahrens";
const AUTHOR_TAGLINE = "Fantasy Author";
const AUTHOR_PHOTO_URL = "https://graceahrens.com/apple-touch-icon.png";

export const NEWSLETTER_SOCIAL_LINKS = [
  { label: "website", url: "https://graceahrens.com", icon: "&#127760;" },
  { label: "twitter", url: "", icon: "&#120143;" },
  { label: "goodreads", url: "", icon: "g" },
  { label: "facebook", url: "", icon: "f" },
  { label: "instagram", url: "", icon: "&#9679;" },
];

const FOOTER_COPY = {
  signupNote: "You received this email because you signed up for fiction updates on my website.",
  affiliateNote:
    "Emails may contain affiliate links, meaning if you decide to make a purchase via my links, I may earn a commission at no additional cost to you.",
};

function linkifyHtml(html) {
  return html.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#1a56a8;text-decoration:underline;">$1</a>'
  );
}

function buildSocialIconsHtml() {
  const links = NEWSLETTER_SOCIAL_LINKS.filter((entry) => entry.url);
  if (!links.length) return "";

  return links
    .map(
      (entry) =>
        `<a href="${entry.url}" style="display:inline-block;width:30px;height:30px;margin-left:6px;background:#f2f2f2;border-radius:5px;text-align:center;line-height:30px;color:#222222;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;">${entry.icon}</a>`
    )
    .join("");
}

function buildSocialLinksText() {
  return NEWSLETTER_SOCIAL_LINKS.filter((entry) => entry.url)
    .map((entry) => `${entry.label}: ${entry.url}`)
    .join("\n");
}

function displayName(name) {
  const trimmed = String(name || "").trim();
  return trimmed || "friend";
}

export function personalizeNewsletterText(text, name) {
  return String(text || "").replaceAll("{name}", displayName(name));
}

function buildSignatureHtml() {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td width="92" valign="middle" style="padding:0 18px 0 0;">
          <img src="${AUTHOR_PHOTO_URL}" alt="${AUTHOR_NAME}" width="72" height="72" style="display:block;width:72px;height:72px;border-radius:50%;object-fit:cover;">
        </td>
        <td valign="middle" style="padding:0;">
          <p style="margin:0;font-family:'Brush Script MT','Segoe Script','Lucida Handwriting',cursive;font-size:42px;line-height:1.1;color:#111111;">${AUTHOR_NAME}</p>
        </td>
      </tr>
    </table>`;
}

function buildFooterHtml(unsubscribeUrl) {
  const socialIcons = buildSocialIconsHtml();

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#000000;">
      <tr>
        <td style="padding:28px 24px 22px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td valign="top" style="font-family:Georgia,'Times New Roman',serif;color:#ffffff;">
                <p style="margin:0 0 6px 0;font-size:28px;line-height:1.15;color:#6ea8e6;font-weight:600;">${AUTHOR_NAME}</p>
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.4;color:#d8d8d8;">${AUTHOR_TAGLINE}</p>
              </td>
              <td valign="middle" align="right" style="white-space:nowrap;">
                ${socialIcons}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px;">
          <div style="height:1px;background:#444444;line-height:1px;font-size:1px;">&nbsp;</div>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 24px 26px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td valign="top" width="42%" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.55;color:#cccccc;padding-right:16px;">
                <p style="margin:0;">${AUTHOR_NAME}</p>
              </td>
              <td valign="top" align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.55;color:#cccccc;text-align:right;">
                <p style="margin:0 0 10px 0;">${FOOTER_COPY.signupNote}</p>
                <p style="margin:0 0 14px 0;">${FOOTER_COPY.affiliateNote}</p>
                <p style="margin:0;"><a href="${unsubscribeUrl}" style="color:#ffffff;text-decoration:underline;">Unsubscribe</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

export function buildNewsletterEmail(body, { unsubscribeUrl, name }) {
  const personalizedBody = personalizeNewsletterText(body, name);
  const bodyHtml = linkifyHtml(bodyToHtml(personalizedBody));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter</title>
</head>
<body style="margin:0;padding:0;background:#f3f3f3;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f3f3;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;">
          <tr>
            <td style="padding:34px 30px 26px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7;color:#222222;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 30px 30px;">
              ${buildSignatureHtml()}
            </td>
          </tr>
          <tr>
            <td style="padding:0;">
              ${buildFooterHtml(unsubscribeUrl)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textParts = [
    personalizedBody,
    "",
    AUTHOR_NAME,
    AUTHOR_TAGLINE,
    "",
    buildSocialLinksText(),
    "",
    FOOTER_COPY.signupNote,
    "",
    FOOTER_COPY.affiliateNote,
    "",
    `Unsubscribe: ${unsubscribeUrl}`,
  ];

  return { html, text: textParts.filter(Boolean).join("\n") };
}
