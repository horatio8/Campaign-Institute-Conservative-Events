type Mail = { to: string; subject: string; text: string; from?: string };

// Console transport — prints to server logs. Swap for Postmark/Resend later.
async function consoleSend(mail: Mail) {
  const from = mail.from ?? process.env.EMAIL_FROM ?? "support@luma.local";
  // eslint-disable-next-line no-console
  console.log(
    `\n[email] from=${from} to=${mail.to}\n  subject: ${mail.subject}\n  body: ${mail.text}\n`
  );
}

export async function sendEmail(mail: Mail): Promise<void> {
  const transport = process.env.EMAIL_TRANSPORT ?? "console";
  switch (transport) {
    case "console":
      return consoleSend(mail);
    default:
      return consoleSend(mail);
  }
}
