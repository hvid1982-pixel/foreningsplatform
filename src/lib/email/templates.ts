/**
 * Danish e-mail templates. Plain text first (most robust), simple HTML second.
 */
import type { EmailMessage } from "./index";

function wrapHtml(paragraphs: string[], link: { href: string; label: string }): string {
  const body = paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
  return `<!doctype html><html lang="da"><body style="font-family:system-ui,sans-serif;line-height:1.5">${body}<p><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></p></body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function verificationEmail(to: string, name: string, url: string): EmailMessage {
  const lines = [
    `Hej ${name}`,
    "Tak fordi du har oprettet en konto på Foreningsplatform. Bekræft din e-mailadresse ved at åbne linket nedenfor.",
    "Hvis du ikke har oprettet en konto, kan du se bort fra denne mail.",
  ];
  return {
    to,
    subject: "Bekræft din e-mailadresse",
    text: `${lines.join("\n\n")}\n\n${url}`,
    html: wrapHtml(lines, { href: url, label: "Bekræft e-mailadresse" }),
  };
}

export function resetPasswordEmail(to: string, name: string, url: string): EmailMessage {
  const lines = [
    `Hej ${name}`,
    "Vi har modtaget en anmodning om at nulstille din adgangskode. Linket er gyldigt i én time.",
    "Hvis du ikke har bedt om det, kan du se bort fra denne mail. Din adgangskode er uændret.",
  ];
  return {
    to,
    subject: "Nulstil din adgangskode",
    text: `${lines.join("\n\n")}\n\n${url}`,
    html: wrapHtml(lines, { href: url, label: "Vælg ny adgangskode" }),
  };
}
