/**
 * Minimal, replaceable e-mail sending.
 *
 * - `EMAIL_TRANSPORT=smtp`: sends via SMTP (Mailpit locally; any SMTP provider
 *   such as Resend, Postmark or Brevo in production).
 * - `EMAIL_TRANSPORT=log`: writes the mail to the server log instead. Useful for
 *   staging before a mail provider is set up. Never use in production.
 *
 * To switch to a provider HTTP API later, add another transport here; callers
 * only use `sendEmail`.
 */
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const log = logger.child({ module: "email" });

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
    });
  }
  return transporter;
}

/** Test hook: the last messages sent with the `log` transport (newest last). */
export const sentEmailsForTests: EmailMessage[] = [];

export async function sendEmail(message: EmailMessage): Promise<void> {
  if (env.EMAIL_TRANSPORT === "log") {
    log.info({ to: message.to, subject: message.subject, text: message.text }, "E-mail (log transport)");
    if (env.APP_ENV === "test") sentEmailsForTests.push(message);
    return;
  }
  await getTransporter().sendMail({ from: env.EMAIL_FROM, ...message });
  log.info({ to: message.to, subject: message.subject }, "E-mail sendt");
}
