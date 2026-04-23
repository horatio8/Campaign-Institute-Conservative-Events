export type Mail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
  replyTo?: string;
};

// Console transport — prints to server logs. Swap for Postmark/Resend later.
async function consoleSend(mail: Mail) {
  const from = mail.from ?? process.env.EMAIL_FROM ?? "support@luma.local";
  // eslint-disable-next-line no-console
  console.log(
    `\n[email] from=${from} to=${mail.to}${mail.replyTo ? ` reply-to=${mail.replyTo}` : ""}` +
      `\n  subject: ${mail.subject}\n  text: ${mail.text}` +
      (mail.html ? `\n  html: ${mail.html.replace(/\s+/g, " ").slice(0, 200)}…` : "") +
      `\n`
  );
}

export async function sendEmail(mail: Mail): Promise<void> {
  const transport = process.env.EMAIL_TRANSPORT ?? "console";
  switch (transport) {
    case "console":
      return consoleSend(mail);
    // future: case "postmark": return postmarkSend(mail);
    // future: case "resend":   return resendSend(mail);
    default:
      return consoleSend(mail);
  }
}
