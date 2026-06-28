import { bodyToHtml } from "./email.js";

const AUTHOR_NAME = "Grace Ahrens";
const AUTHOR_TAGLINE = "Fantasy Author";
const AUTHOR_LOGO_URL = "https://graceahrens.com/apple-touch-icon.png";

const THEME = {
  navyDeep: "#0b1528",
  navy: "#13233f",
  navyMid: "#1c3358",
  navyGlow: "#2d5088",
  grayBlueLight: "#8fa3bc",
  moon: "#b8c9e4",
  silver: "#d2dae8",
  silverBright: "#eef2fa",
  textOnDark: "#eef2f8",
  textOnDarkMuted: "#d4ddea",
  accent: "#1e3a66",
  text: "#121820",
};

export const NEWSLETTER_SOCIAL_LINKS = [
  { label: "website", url: "https://graceahrens.com", icon: "&#127760;" },
  { label: "twitter", url: "", icon: "&#120143;" },
  { label: "goodreads", url: "", icon: "g" },
  { label: "facebook", url: "", icon: "f" },
  { label: "instagram", url: "", icon: "&#9679;" },
];

const FOOTER_COPY = {
  signupNote: "You received this email because you signed up for fiction updates on my website.",
};

function linkifyHtml(html) {
  return html.replace(
    /(https?:\/\/[^\s<]+)/g,
    `<a href="$1" style="color:${THEME.navyGlow};text-decoration:underline;">$1</a>`
  );
}

function buildSocialIconsHtml() {
  const links = NEWSLETTER_SOCIAL_LINKS.filter((entry) => entry.url);
  if (!links.length) return "";

  return links
    .map(
      (entry) =>
        `<a href="${entry.url}" style="display:inline-block;width:30px;height:30px;margin-left:6px;background:${THEME.navyMid};border:1px solid rgba(210,218,232,0.22);border-radius:5px;text-align:center;line-height:28px;color:${THEME.silver};text-decoration:none;font-family:Georgia,'Times New Roman',serif;font-size:13px;font-weight:bold;">${entry.icon}</a>`
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

function buildLogoHtml() {
  return `
    <p style="margin:0;text-align:center;">
      <a href="https://graceahrens.com" style="text-decoration:none;">
        <img src="${AUTHOR_LOGO_URL}" alt="${AUTHOR_NAME}" width="64" height="64" style="display:inline-block;width:64px;height:64px;border:0;">
      </a>
    </p>`;
}

function buildFooterHtml(unsubscribeUrl) {
  const socialIcons = buildSocialIconsHtml();

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${THEME.navyDeep};border-top:1px solid rgba(210,218,232,0.2);">
      <tr>
        <td style="padding:28px 24px 22px;">
          <p style="margin:0 0 16px 0;text-align:center;font-size:10px;line-height:1;color:${THEME.moon};letter-spacing:0.5em;">&#10022;</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td valign="top" style="font-family:Georgia,'Times New Roman',serif;color:${THEME.textOnDark};">
                <p style="margin:0 0 6px 0;font-size:28px;line-height:1.15;color:${THEME.silverBright};font-weight:600;">${AUTHOR_NAME}</p>
                <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.4;color:${THEME.textOnDarkMuted};">${AUTHOR_TAGLINE}</p>
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
          <div style="height:1px;background:rgba(210,218,232,0.2);line-height:1px;font-size:1px;">&nbsp;</div>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 24px 26px;background:${THEME.navy};">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td valign="top" width="42%" style="font-family:Georgia,'Times New Roman',serif;font-size:12px;line-height:1.55;color:${THEME.textOnDarkMuted};padding-right:16px;">
                <p style="margin:0;">${AUTHOR_NAME}</p>
              </td>
              <td valign="top" align="right" style="font-family:Georgia,'Times New Roman',serif;font-size:11px;line-height:1.55;color:${THEME.grayBlueLight};text-align:right;">
                <p style="margin:0 0 10px 0;">${FOOTER_COPY.signupNote}</p>
                <p style="margin:0;"><a href="${unsubscribeUrl}" style="color:${THEME.silverBright};text-decoration:underline;text-underline-offset:3px;">Unsubscribe</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

function buildNewsletterText(bodyText, unsubscribeUrl) {
  const textParts = [
    bodyText,
    "",
    AUTHOR_NAME,
    AUTHOR_TAGLINE,
    "",
    buildSocialLinksText(),
    "",
    FOOTER_COPY.signupNote,
    "",
    `Unsubscribe: ${unsubscribeUrl}`,
  ];

  return textParts.filter(Boolean).join("\n");
}

export function buildNewsletterLayout({ bodyHtml, text, unsubscribeUrl }) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid rgba(19,35,63,0.08);">
          <tr>
            <td style="padding:34px 30px 26px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.7;color:${THEME.text};">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 30px 30px;">
              ${buildLogoHtml()}
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

  return {
    html,
    text: buildNewsletterText(text, unsubscribeUrl),
  };
}

export function buildNewsletterEmail(body, { unsubscribeUrl, name }) {
  const personalizedBody = personalizeNewsletterText(body, name);
  const bodyHtml = linkifyHtml(bodyToHtml(personalizedBody));

  return buildNewsletterLayout({
    bodyHtml,
    text: personalizedBody,
    unsubscribeUrl,
  });
}
